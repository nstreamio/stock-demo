import { Form, Item } from "@swim/structure";
import { Cusip } from "./Table.types";

export class CusipForm extends Form<Cusip | undefined> {
  constructor() {
    super();
  }

  // @event(node:"/symbols",lane:stocks)@update(key:DIS){timestamp:1709080398,price:109.5,volume:,bid:,ask:,movement:0.073}

  // Item to JS object
  override cast(item: Item): Cusip | undefined {
    if (
      item.isDefinite() &&
      item.get("timestamp").isDefinite() &&
      item.get("price").isDefinite() &&
      item.get("volume").isDefined() &&
      item.get("movement").isDefined()
    ) {
      const object = {
        price: item.get("price").numberValue(0),
        volume: item.get("volume").numberValue(0),
        movement: item.get("movement").numberValue(0),
        timestamp: item.get("timestamp").numberValue(0),
        state: null,
      };
      return object;
    }

    return undefined;
  }

  // JS object to Item
  override mold(object: Cusip, item?: Item): Item {
    let result = Item.fromLike(object);
    if (item !== void 0) {
      result = item.concat(object);
    }
    return result;
  }
}