package io.nstream.demos.stocks.agents;

import io.nstream.demos.stocks.Utils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import swim.api.SwimLane;
import swim.api.agent.AbstractAgent;
import swim.api.lane.CommandLane;
import swim.api.lane.JoinValueLane;
import swim.concurrent.TimerRef;
import swim.structure.Value;
import swim.uri.Uri;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

public class SymbolsAgent extends AbstractAgent {
  private static final Logger log = LoggerFactory.getLogger(SymbolsAgent.class);
  @SwimLane("stocks")
  final JoinValueLane<String, Value> stocks = this.<String, Value>joinValueLane();

  TimerRef previousCloseTimer;

  final Duration PREVIOUS_CLOSE_INTERVAL = Duration.ofSeconds(30);
  @Override
  public void didStart() {
    super.didStart();
    this.previousCloseTimer = this.setTimer(PREVIOUS_CLOSE_INTERVAL.toMillis(), this::requestPreviousClose);
  }

  @SwimLane("add")
  final CommandLane<Value> add = this.<Value>commandLane().onCommand(input -> {
    log.debug("command = 'add' input: {}", input);
    String symbol = input.stringValue();
    Uri nodeUri = Uri.empty().path("/", "stock", symbol);
    this.stocks.downlink(symbol)
        .nodeUri(nodeUri)
        .laneUri("status")
        .open();
  });


  LocalDate lastPreviousClose = LocalDate.EPOCH;

  void requestPreviousClose() {
    try {
      // Yesterday calculation
      LocalDate today = ZonedDateTime.now(ZoneId.of("America/New_York"))
          .toLocalDate();
      LocalDate yesterday = today.minusDays(1);

      if (DayOfWeek.SUNDAY == today.getDayOfWeek() || DayOfWeek.SATURDAY == today.getDayOfWeek()) {
        log.trace("requestPreviousClose() - skipping be cause today is {}.", today.getDayOfWeek());
        return;
      } else if (!yesterday.isAfter(lastPreviousClose)) {
        return;
      } else {

        final int SPLIT_SIZE = 50;
        final List<String> symbols = new ArrayList<>(50);
        log.info("requestPreviousClose() - processing {} symbols", this.stocks.keySet().size());
        this.stocks.keySet().forEach(symbol -> {
          symbols.add(symbol);
          if (SPLIT_SIZE == symbols.size()) {
            log.debug("requestPreviousClose() - reaching split size of {}", SPLIT_SIZE);
            Value s = Utils.toItem(symbols);
            this.command("/adapter/twelvedata", "eod", s);
            symbols.clear();
          }
        });
        if (!symbols.isEmpty()) {
          Value s = Utils.toItem(symbols);
          log.debug("requestPreviousClose() - Processing left over {}", s);
          this.command("/adapter/twelvedata", "eod", s);
        }
        lastPreviousClose = yesterday;
      }
    } catch (Exception ex) {
      log.error("requestPreviousClose() - Exception thrown", ex);
    } finally {
      this.previousCloseTimer = this.setTimer(PREVIOUS_CLOSE_INTERVAL.toMillis(), this::requestPreviousClose);
    }
  }


}
