package io.nstream.demos.stocks.data.pricing;

import swim.api.ref.WarpRef;

public class PricingHandlerFactory {
  public static AbstractPricingHandler create(String type, String symbol, WarpRef warpRef) {
    AbstractPricingHandler handler;
    switch (type) {
      case "COMMON_STOCK":
      case "EXCHANGE_TRADED_FUND":
      case "INDEX":
      case "REIT":
      case "MUTUALFUND":
      case "LIMITED_PARTNERSHIP":
        handler = new StockPricingHandler(symbol, warpRef);
        break;
      default:
        handler = null;
    }

    return handler;
  }

}
