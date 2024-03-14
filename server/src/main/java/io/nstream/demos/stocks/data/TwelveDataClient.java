package io.nstream.demos.stocks.data;

import io.nstream.demos.stocks.data.pricing.AbstractPricingHandler;
import io.nstream.demos.stocks.data.pricing.PricingHandlerFactory;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.enums.ReadyState;
import org.java_websocket.handshake.ServerHandshake;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import swim.api.ref.WarpRef;
import swim.json.Json;
import swim.structure.Item;
import swim.structure.Record;
import swim.structure.Value;
import swim.uri.Uri;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;

public class TwelveDataClient extends WebSocketClient {
  private static final Logger log = LoggerFactory.getLogger(TwelveDataClient.class);
  private final WarpRef warpRef;
  private final Uri nodeUri;
  private final Uri restApiUri;
  private final String token;
  private final HttpClient httpClient;

  private final ScheduledExecutorService executorService;

  public TwelveDataClient(WarpRef warpRef, Uri nodeUri, String token) {
    super(URI.create(String.format("wss://ws.twelvedata.com/v1/quotes/price?apikey=%s", token)));
    this.warpRef = warpRef;
    this.nodeUri = nodeUri;
    this.restApiUri = Uri.parse("https://api.twelvedata.com/");
    this.token = token;
    this.httpClient = HttpClient.newBuilder().build();
    this.executorService = Executors.newScheduledThreadPool(1);
    this.executorService.scheduleAtFixedRate(this::sendKeepAlive, 10, 10, TimeUnit.SECONDS);
  }

  void sendKeepAlive() {
    ReadyState readyState = this.getReadyState();

    try {
      if (readyState == ReadyState.OPEN) {
        log.trace("sendKeepAlive() - sending heartbeat.");
        sendValue(
            Record.of()
                .slot("action", "heartbeat")
        );
      } else if (readyState == ReadyState.CLOSED) {
        log.warn("sendKeepAlive() - readyState = {}. Calling connect().", readyState);
        this.reconnect();
      }
    } catch (Exception ex) {
      log.error("sendKeepAlive() - exception thrown", ex);
    }
  }

  @Override
  public void onOpen(ServerHandshake serverHandshake) {
    log.info("onOpen() - status = {}", serverHandshake.getHttpStatus());
    this.warpRef.command(this.nodeUri, Uri.parse("connectionOpen"), Value.absent());
  }

  void sendValue(Value value) {
    String message = Json.toString(value);
    log.info("sendValue: {}", message);
    this.send(message);
  }

  public void subscribe(String symbol) {
    Value subscribe = Record.of()
        .slot("action", "subscribe")
        .slot(
            "params",
            Record.of()
                .slot("symbols", symbol)
        );
    sendValue(subscribe);
  }


  void handlePrice(Value value) {
    String symbol = value.get("symbol").stringValue();
    AbstractPricingHandler pricingHandler = pricingHandlers.get(symbol);
    if (null != pricingHandler) {
      pricingHandler.handleUpdate(value);
    }
  }

  private final Map<String, AbstractPricingHandler> pricingHandlers = new ConcurrentHashMap<>();

  void handleSubscribeStatus(Value value) {
    String status = value.get("status").stringValue();

    if ("ok".equals(status)) {
      value.get("success").forEach(item -> {
        String symbol = item.get("symbol").stringValue();
        String type = item.get("type").stringValue();
        AbstractPricingHandler handler = PricingHandlerFactory.create(type, symbol, this.warpRef);
        if (null == handler) {
          log.warn("Could not configure handler for {}:{}", symbol, type);
        } else {
          pricingHandlers.put(symbol, handler);
        }
      });
    } else if ("error".equals(status)) {
      value.get("fails").forEach(item -> {
        String symbol = item.get("symbol").stringValue();
        log.error("Subscription failed for {}", symbol);
      });
    }
  }

  void handleHeartBeat(Value value) {

  }

  final Map<String, Consumer<Value>> messageHandlers = Map.of(
      "subscribe-status", this::handleSubscribeStatus,
      "price", this::handlePrice,
      "heartbeat", this::handleHeartBeat
  );

  AtomicInteger messagesPerSecond = new AtomicInteger(0);

  @Override
  public void onMessage(String message) {
    log.trace("onMessage() - message: {}", message);
    Value value = Json.parse(message);
    final String event = value.getSlot("event").stringValue();
    Consumer<Value> messageHandler = messageHandlers.getOrDefault(
        event, v -> log.warn("Could not process event '{}': {}", event, message)
    );
    messageHandler.accept(value);
    this.messagesPerSecond.incrementAndGet();
  }

  @Override
  public void onClose(int code, String reason, boolean remote) {
    log.warn("onClose() - code = {} remote = '{}' reason = '{}'", code, remote, reason);
  }

  @Override
  public void onError(Exception e) {
    log.error("onError() - Exception thrown", e);
  }


  Set<String> ignore = Set.of("nodeUri", "lane");


  void processRequest(Uri requestUri, Value input) throws IOException, InterruptedException {
    log.info("processRequest() - requestUri = '{}'", requestUri);
    Uri uri = requestUri.appendedQuery()
        .appendedQuery("apikey", this.token);


    HttpRequest request = HttpRequest.newBuilder(URI.create(uri.toString()))
        .GET()
        .build();
    HttpResponse<String> response = this.httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    Value value = Json.parse(response.body());
    String nodeUri = input.getSlot("nodeUri").stringValue();
    String lane = input.getSlot("lane").stringValue();
    this.warpRef.command(nodeUri, lane, value);
  }


  Uri buildUri(String path, Value input) {
    Uri result = this.restApiUri.appendedPath(path);

    for (Item item : input) {
      if (ignore.contains(item.key().stringValue())) {
        continue;
      }
      result = result.appendedQuery(item.key().stringValue(), item.stringValue());
    }

    return result;
  }

  public void eod(Value input) {
    Uri requestUri = buildUri("eod", input);

    try {
      processRequest(requestUri, input);
    } catch (Exception e) {
      log.error("Exception while calling eod api", e);
    }

  }
}
