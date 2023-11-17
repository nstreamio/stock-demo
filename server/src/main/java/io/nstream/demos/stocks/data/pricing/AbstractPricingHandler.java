package io.nstream.demos.stocks.data.pricing;

import swim.api.ref.WarpRef;
import swim.structure.Value;
import swim.uri.Uri;

public abstract class AbstractPricingHandler {
//  protected final String symbol;
  protected final WarpRef warpRef;
  protected final Uri nodeUri;
  protected final Uri commandLane;

  public AbstractPricingHandler(WarpRef warpRef, Uri nodeUri, Uri commandLane) {
    this.warpRef = warpRef;
    this.nodeUri = nodeUri;
    this.commandLane = commandLane;
  }

  public abstract void handleUpdate(Value value);

  protected void fireCommand(Value value) {
    this.warpRef.command(this.nodeUri, this.commandLane, value);
  }
}
