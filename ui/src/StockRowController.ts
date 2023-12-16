import { TraitViewRef } from "@swim/controller";
import { TraitRef } from "@swim/model";
import { LeafTrait, LeafView, RowController, RowTrait, TextCellTrait, TextCellView } from "@swim/table";
import { Record as SwimRecord } from "@swim/structure";
import { Observes } from "@swim/util";
import { ValueChange } from "./types";

export class StockRowController extends RowController {
  private _classRemovalTimers: {
    price: NodeJS.Timeout | null;
    volume: NodeJS.Timeout | null;
    movement: NodeJS.Timeout | null;
  } = {
    price: null,
    volume: null,
    movement: null,
  };

  constructor(trait: RowTrait, key: string) {
    super();
    this.trait.set(trait);
    this.setKey(key);
  }

  @TraitViewRef({
    viewType: LeafView,
    extends: true,
    initView(leafView: LeafView): void {
      super.initView(leafView);
      leafView.set({
        style: {
          height: "44px",
        },
      });
    },
  })
  override readonly leaf!: TraitViewRef<this, LeafTrait, LeafView> & Observes<LeafTrait> & Observes<LeafView>;

  @TraitRef({
    traitType: RowTrait,
    extends: true,
  })
  readonly trait!: TraitRef<this, RowTrait>;

  @TraitViewRef({
    traitType: TextCellTrait,
    viewType: TextCellView,
  })
  readonly symbolCell!: TraitViewRef<this, TextCellTrait, TextCellView>;

  @TraitViewRef({
    traitType: TextCellTrait,
    viewType: TextCellView,
  })
  readonly priceCell!: TraitViewRef<this, TextCellTrait, TextCellView>;

  @TraitViewRef({
    traitType: TextCellTrait,
    viewType: TextCellView,
  })
  readonly volumeCell!: TraitViewRef<this, TextCellTrait, TextCellView>;

  @TraitViewRef({
    traitType: TextCellTrait,
    viewType: TextCellView,
  })
  readonly movementCell!: TraitViewRef<this, TextCellTrait, TextCellView>;

  updateRow(newRecord: SwimRecord, oldRecord: SwimRecord, isNew: boolean = false) {
    (["price", "volume", "movement"] as ("price" | "volume" | "movement")[]).forEach((key) => {
      // do not process empty or absent values
      if (!newRecord.get(key).isDefinite()) {
        return;
      }

      const newValue = newRecord.get(key).stringValue("");
      const oldValue = oldRecord.get(key).stringValue();

      let content: string = "";
      // apply appropriate text content formatting
      switch (key) {
        case "price": {
          content = StockRowController.formatPrice(newValue);
          break;
        }
        case "volume": {
          content = StockRowController.formatVolume(newValue);
          break;
        }
        case "movement": {
          content = StockRowController.formatMovement(newValue);
          break;
        }
      }
      // update text content of cell
      this[`${key}Cell`].attachTrait().set({ content });

      if (oldValue !== undefined && oldValue !== newValue && !isNew) {
        const change: ValueChange =
          Number.parseFloat(oldValue) < Number.parseFloat(newValue) ? "rising" : "falling";
        const cellView = this[`${key}Cell` as "priceCell"].attachView();

        // add styling which indicates whether value has increased or decreased
        cellView.classList.remove(change === "rising" ? "falling" : "rising");
        cellView.classList.add(change);

        // cancel any existing timeout to modify this cell's classList
        if (this._classRemovalTimers[key] !== null) {
          clearTimeout(this._classRemovalTimers[key]!);
        }
        // set new timeout to remove "rising" or "falling" from this cell's classList
        this._classRemovalTimers[key] = setTimeout(function () {
          cellView.classList.remove(change);
        }, 2000);
      }
    });
  }

  static formatPrice(str: string): string {
    return `$${Number.parseFloat(str).toFixed(2)}`;
  }

  static formatVolume(str: string): string {
    let intString = `${Number.parseFloat(str).toFixed(0)}`;
    if (intString.length < 4) {
      return intString;
    }

    // insert commas in the appropriate positions
    let result = "";
    do {
      result = `${intString.length > 3 ? "," : ""}${intString.slice(-3)}${result}`;
      intString = intString.slice(0, -3);
    } while (intString.length);
    return result;
  }

  static formatMovement(str: string): string {
    return `${Number.parseFloat(str).toFixed(2)}%`;
  }
}
