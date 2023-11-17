package io.nstream.demos.stocks.data.pricing;

import swim.api.ref.WarpRef;
import swim.structure.Value;
import swim.uri.Uri;

public class ForexPricingHandler extends AbstractPricingHandler {
  protected String baseCurrency;
  protected String quoteCurrency;

  public ForexPricingHandler(String baseCurrency, String quoteCurrency, WarpRef warpRef) {
    super(warpRef, Uri.parse(String.format("/forex/%s/%s", baseCurrency, quoteCurrency)), Uri.parse("update"));
    this.baseCurrency = baseCurrency;
    this.quoteCurrency = quoteCurrency;
  }

  @Override
  public void handleUpdate(Value value) {
    fireCommand(value);
  }
}
