package io.nstream.demos.stocks.agents;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import swim.api.SwimLane;
import swim.api.agent.AbstractAgent;
import swim.api.lane.CommandLane;
import swim.api.lane.JoinValueLane;
import swim.structure.Item;
import swim.structure.Value;
import swim.uri.Uri;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

public class SymbolsAgent extends AbstractAgent {
  private static final Logger log = LoggerFactory.getLogger(SymbolsAgent.class);
  @SwimLane("stocks")
  final JoinValueLane<String, Value> stocks = this.<String, Value>joinValueLane();

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
    // Yesterday calculation
    LocalDate today = ZonedDateTime.now(ZoneId.of("America/New_York"))
        .toLocalDate();
    LocalDate yesterday = today.minusDays(1);

    if(DayOfWeek.SUNDAY == today.getDayOfWeek() || DayOfWeek.SATURDAY == today.getDayOfWeek()) {
      log.trace("requestPreviousClose() - skipping be cause today is {}.", today.getDayOfWeek());
      return;
    }

    if(!yesterday.isAfter(lastPreviousClose)) {
      return;
    }

    final int SPLIT_SIZE = 50;
    final List<String> symbols = new ArrayList<>(50);

    this.stocks.keySet().forEach(symbol -> {
      symbols.add(symbol);
      if(SPLIT_SIZE == symbols.size()) {


        symbols.clear();
      }

    });




  }




}
