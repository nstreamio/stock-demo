package io.nstream.demos.stocks.agents;

import swim.api.SwimLane;
import swim.api.agent.AbstractAgent;
import swim.api.lane.CommandLane;
import swim.api.lane.ValueLane;
import swim.structure.Value;

public class ForexAgent extends AbstractAgent {
  @SwimLane("data")
  final ValueLane<Value> data = this.valueLane();

  @SwimLane("update")
  final CommandLane<Value> update = this.<Value>commandLane()
      .onCommand(input -> {
        this.data.set(input);
      });
}
