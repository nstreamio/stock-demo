package io.nstream.demos.stocks.agents;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import swim.api.SwimLane;
import swim.api.agent.AbstractAgent;
import swim.api.lane.CommandLane;
import swim.api.lane.JoinValueLane;
import swim.structure.Value;
import swim.uri.Uri;

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
}
