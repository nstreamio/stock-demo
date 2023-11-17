package io.nstream.demos.stocks.data.pricing;

import swim.api.ref.WarpRef;
import swim.structure.Value;
import swim.uri.Uri;

public class StockPricingHandler extends AbstractPricingHandler {
  protected final String symbol;

  public StockPricingHandler(String symbol, WarpRef warpRef) {
    super(warpRef, Uri.parse(String.format("/stock/%s", symbol)), Uri.parse("update"));
    this.symbol = symbol;
  }

  @Override
  public void handleUpdate(Value value) {
    fireCommand(value);
  }
}
