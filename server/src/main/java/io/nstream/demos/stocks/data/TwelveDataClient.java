package io.nstream.demos.stocks.data;

import io.nstream.demos.stocks.data.pricing.AbstractPricingHandler;
import io.nstream.demos.stocks.data.pricing.PricingHandlerFactory;
import org.java_websocket.client.WebSocketClient;
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
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;

public class TwelveDataClient extends WebSocketClient {
  private static final Logger log = LoggerFactory.getLogger(TwelveDataClient.class);
  private final WarpRef warpRef;
  private final Uri nodeUri;
  private final Uri restApiUri;
  private final String token;
  private final HttpClient httpClient;

  public TwelveDataClient(WarpRef warpRef, Uri nodeUri, String token) {
    super(URI.create(String.format("wss://ws.twelvedata.com/v1/quotes/price?apikey=%s", token)));
    this.warpRef = warpRef;
    this.nodeUri = nodeUri;
    this.restApiUri = Uri.parse("https://api.twelvedata.com/");
    this.token = token;
    this.httpClient = HttpClient.newBuilder().build();
  }

  @Override
  public void onOpen(ServerHandshake serverHandshake) {
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

  final Map<String, Consumer<Value>> messageHandlers = Map.of(
      "subscribe-status", this::handleSubscribeStatus,
      "price", this::handlePrice
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
  public void onClose(int i, String s, boolean b) {

  }

  @Override
  public void onError(Exception e) {
    log.error("Exception thrown", e);
  }

  public int getAndResetMessagesPerSecond() {
    return this.messagesPerSecond.getAndSet(0);
  }

  Set<String> ignore = Set.of("nodeUri", "lane");


  void processRequest(Uri requestUri, String nodeUri, String lane) throws IOException, InterruptedException {
    log.info("processRequest() - requestUri = '{}'", requestUri);
    Uri uri = requestUri.appendedQuery()
        .appendedQuery("apikey", this.token);

    HttpRequest request = HttpRequest.newBuilder(URI.create(uri.toString()))
        .GET()
        .build();
    HttpResponse<String> response = this.httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    Value value = Json.parse(response.body());
    this.warpRef.command(nodeUri, lane, value);
  }

  public void timeSeries(Value input) {
    Uri requestUri = this.restApiUri.appendedPath("time_series");

    for (Item item : input) {
      if (ignore.contains(item.key().stringValue())) {
        continue;
      }
      requestUri = requestUri.appendedQuery(item.key().stringValue(), item.stringValue());
    }
    String nodeUri = input.getSlot("nodeUri").stringValue();
    String lane = input.getSlot("lane").stringValue();
    try {
      processRequest(requestUri, nodeUri, lane);
    } catch (Exception e) {
      log.error("Exception while calling api", e);
    }
  }

  public void profile(Value input) {
    Uri requestUri = this.restApiUri.appendedPath("profile");

    for (Item item : input) {
      if (ignore.contains(item.key().stringValue())) {
        continue;
      }
      requestUri = requestUri.appendedQuery(item.key().stringValue(), item.stringValue());
    }
    String nodeUri = input.getSlot("nodeUri").stringValue();
    String lane = input.getSlot("lane").stringValue();
    try {
      processRequest(requestUri, nodeUri, lane);
    } catch (Exception e) {
      log.error("Exception while calling api", e);
    }
  }

}
