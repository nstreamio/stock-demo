import { TraitViewRef } from "@swim/controller";
import { TraitRef } from "@swim/model";
import {
  LeafTrait,
  LeafView,
  RowController,
  RowTrait,
  RowView,
  TextCellTrait,
  TextCellView,
} from "@swim/table";
import { Observes } from "@swim/util";
import { Uri } from "@swim/uri";
import { ValueDownlink } from "@swim/client";
import { Value } from "@swim/structure";
import { ValueChange } from "../types";
import { Property } from "@swim/component";

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

    const urlParams = new URLSearchParams(window.location.search);

    let host = urlParams.get("host");
    const baseUri = Uri.parse(document.location.href);
    if (!host) {
      host = baseUri
        .base()
        .withScheme(baseUri.schemeName === "https" ? "warps" : "warp")
        .toString();
    }
    const nodeUri = `/stock/${this.key}`;

    this.stockStatusDownlink.setHostUri(host);
    this.stockStatusDownlink.setNodeUri(nodeUri);
    this.stockStatusDownlink.open();
  }

  @TraitViewRef({
    viewType: RowView,
    extends: true,
    initView(rowView: RowView): void {
      super.initView(rowView);
      rowView.set({
        style: {
          height: "44px",
        },
      });
    },
  })
  override readonly row!: TraitViewRef<this, RowTrait, RowView>;

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
    viewDidPress(): void {
      // disable default press action
      return;
    },
    viewDidLongPress(): void {
      // disable default long press action
      return;
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
    initView(view): void {
      super.initView(view);
      view.set({
        classList: ["symbolCell"],
        style: {
          fontSize: "16px",
          fontWeight: "900",
          color: "#FBFBFB",
          opacity: 0.9,
        },
      });
    },
    extends: true,
  })
  readonly symbolCell!: TraitViewRef<this, TextCellTrait, TextCellView>;

  @TraitViewRef({
    traitType: TextCellTrait,
    viewType: TextCellView,
    initView(view): void {
      super.initView(view);
      view.set({
        classList: ["priceCell"],
        style: {
          fontSize: "14px",
          color: "#FBFBFB",
          opacity: 0.8,
        },
      });
    },
    extends: true,
  })
  readonly priceCell!: TraitViewRef<this, TextCellTrait, TextCellView>;

  @TraitViewRef({
    traitType: TextCellTrait,
    viewType: TextCellView,
    initView(view): void {
      super.initView(view);
      view.set({
        classList: ["volumeCell"],
        style: {
          fontSize: "14px",
          color: "#FBFBFB",
          opacity: 0.8,
        },
      });
    },
    extends: true,
  })
  readonly volumeCell!: TraitViewRef<this, TextCellTrait, TextCellView>;

  @TraitViewRef({
    traitType: TextCellTrait,
    viewType: TextCellView,
    initView(view): void {
      super.initView(view);
      view.set({
        classList: ["movementCell"],
        style: {
          fontSize: "14px",
          color: "#FBFBFB",
          opacity: 0.8,
        },
      });
    },
    extends: true,
  })
  readonly movementCell!: TraitViewRef<this, TextCellTrait, TextCellView>;

  // updateRow(
  //   change: ValueChange = "none"
  // ): void {

  //   if (change !== "none") {
  //     this.row.attachView().classList.add(change);
  //     setTimeout(() => {
  //       this.row.attachView().classList.remove(change);
  //     }, 2500);
  //   }

  //   this.name.setValue(name);
  // }

  @ValueDownlink({
    laneUri: "status",
    didSet(newRecord, oldRecord) {
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
        this.owner[`${key}Cell`].attachTrait().set({ content });

        if (oldValue !== undefined && oldValue !== newValue) {
          const change: ValueChange =
            Number.parseFloat(oldValue) < Number.parseFloat(newValue) ? "rising" : "falling";
          const cellView = this.owner[`${key}Cell` as "priceCell"].attachView();

          // add styling which indicates whether value has increased or decreased
          cellView.classList.remove(change === "rising" ? "falling" : "rising");
          cellView.classList.add(change);

          // cancel any existing timeout to modify this cell's classList
          if (this.owner._classRemovalTimers[key] !== null) {
            clearTimeout(this.owner._classRemovalTimers[key]!);
          }
          // set new timeout to remove "rising" or "falling" from this cell's classList
          this.owner._classRemovalTimers[key] = setTimeout(function () {
            cellView.classList.remove(change);
          }, 2500);
        }
      });
    },
  })
  readonly stockStatusDownlink!: ValueDownlink<this, Value>;

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
