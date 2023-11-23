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
import { MapDownlink, ValueDownlink } from "@swim/client";
import { Value } from "@swim/structure";
import { formatPrice } from "../helpers/stringFormatting";
import { PlayerChange } from "../types";

export class StockRowController extends RowController {
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

    this.stockHistoryDownlink.setHostUri(host);
    this.stockHistoryDownlink.setNodeUri(nodeUri);
    this.stockHistoryDownlink.open();

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
  override readonly leaf!: TraitViewRef<this, LeafTrait, LeafView> &
    Observes<LeafTrait> &
    Observes<LeafView>;

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
      // if (this.owner.key) {
      //   view.node.innerText = this.owner.key;
      // }
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
        classList: ["openCell"],
        style: {
          fontSize: "14px",
          color: "#FBFBFB",
          opacity: 0.8,
        },
      });
    },
    extends: true,
  })
  readonly openCell!: TraitViewRef<this, TextCellTrait, TextCellView>;

  @TraitViewRef({
    traitType: TextCellTrait,
    viewType: TextCellView,
    initView(view): void {
      super.initView(view);
      view.set({
        classList: ["highCell"],
        style: {
          fontSize: "14px",
          color: "#FBFBFB",
          opacity: 0.8,
        },
      });
    },
    extends: true,
  })
  readonly highCell!: TraitViewRef<this, TextCellTrait, TextCellView>;

  @TraitViewRef({
    traitType: TextCellTrait,
    viewType: TextCellView,
    initView(view): void {
      super.initView(view);
      view.set({
        classList: ["lowCell"],
        style: {
          fontSize: "14px",
          color: "#FBFBFB",
          opacity: 0.8,
        },
      });
    },
    extends: true,
  })
  readonly lowCell!: TraitViewRef<this, TextCellTrait, TextCellView>;

  @TraitViewRef({
    traitType: TextCellTrait,
    viewType: TextCellView,
    initView(view): void {
      super.initView(view);
      view.set({
        classList: ["closeCell"],
        style: {
          fontSize: "14px",
          color: "#FBFBFB",
          opacity: 0.8,
        },
      });
    },
    extends: true,
  })
  readonly closeCell!: TraitViewRef<this, TextCellTrait, TextCellView>;

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

  // updateRow(
  //   change: PlayerChange = "none"
  // ): void {

  //   if (change !== "none") {
  //     this.row.attachView().classList.add(change);
  //     setTimeout(() => {
  //       this.row.attachView().classList.remove(change);
  //     }, 2500);
  //   }

  //   this.name.setValue(name);
  // }

  /*

  price, high, and low get change indication colors
  */

  @ValueDownlink({
    laneUri: "status",
    didSet(newValue, oldValue) {
      const price = newValue.get("price").numberValue();

      if (price !== undefined) {
        this.owner.priceCell.attachTrait().set({
          content: formatPrice(price),
        });
      }
    },
  })
  readonly stockStatusDownlink!: ValueDownlink<this, Value>;

  @MapDownlink({
    laneUri: "history",
    didUpdate(key, newValue, oldValue) {
      console.log("newValue:", newValue);
      console.log("oldValue:", oldValue);
      const open = newValue.get("open").numberValue();
      const openPrev = oldValue.get("open").numberValue();
      const high = newValue.get("high").numberValue();
      const highPrev = oldValue.get("high").numberValue();
      const low = newValue.get("low").numberValue();
      const lowPrev = oldValue.get("low").numberValue();
      const close = newValue.get("close").numberValue();
      const closePrev = oldValue.get("close").numberValue();
      const volume = newValue.get("volume").numberValue();
      const volumePrev = oldValue.get("volume").numberValue();
      console.log("this.owner.key:", this.owner.key);
      console.log("volume:", volume);
      console.log("volumePrev:", volumePrev);

      const changes: Record<string, any> = {};

      if (open !== undefined) {
        this.owner.openCell.attachTrait().set({
          content: formatPrice(open),
        });
        if (openPrev !== undefined && openPrev !== open) {
          const openChange: PlayerChange =
            openPrev > open ? "rising" : "falling";
          this.owner.openCell.attachView().classList.add(openChange);
          changes.open = openChange;
        }
      }
      if (high !== undefined) {
        this.owner.highCell.attachTrait().set({
          content: formatPrice(high),
        });
        if (highPrev !== undefined && highPrev !== high) {
          const highChange: PlayerChange =
            highPrev > high ? "rising" : "falling";
          this.owner.highCell.attachView().classList.add(highChange);
          changes.high = highChange;
        }
      }
      if (low !== undefined) {
        this.owner.lowCell.attachTrait().set({
          content: formatPrice(low),
        });
        if (lowPrev !== undefined && lowPrev !== low) {
          const lowChange: PlayerChange = lowPrev > low ? "rising" : "falling";
          this.owner.lowCell.attachView().classList.add(lowChange);
          changes.low = lowChange;
        }
      }
      if (close !== undefined) {
        this.owner.closeCell.attachTrait().set({
          content: formatPrice(close),
        });
        if (closePrev !== undefined && closePrev !== close) {
          const closeChange: PlayerChange =
            closePrev > close ? "rising" : "falling";
          this.owner.closeCell.attachView().classList.add(closeChange);
          changes.close = closeChange;
        }
      }
      if (volume !== undefined) {
        console.log("volume is not undefined");
        this.owner.volumeCell.attachTrait().set({
          content: formatPrice(volume),
        });
        if (volumePrev !== undefined && volumePrev !== volume) {
          console.log("volume value HAS changed");
          const volumeChange: PlayerChange =
            volumePrev > volume ? "rising" : "falling";
          console.log("volumeChange type:", volumeChange);
          this.owner.volumeCell.attachView().classList.add(volumeChange);
          console.log(
            "this.owner.volumeCell.attachView().classList:",
            this.owner.volumeCell.attachView().classList
          );
          console.log(
            "this.owner.volumeCell.attachView().classList.toString():",
            this.owner.volumeCell.attachView().classList.toString()
          );
          changes.volume = volumeChange;
        } else {
          console.log("volume value has NOT changed");
        }
      } else {
        console.log("volume is undefined");
      }

      if (!Object.keys(changes).length) {
        return;
      }

      const that = this;
      const timeoutCallback = function () {
        console.log("timeoutCallback");
        Object.entries(changes).forEach(function ([cellKey, className]) {
          that.owner[`${cellKey}Cell` as "priceCell"]
            .attachView()
            .classList.remove(className);
        });
      };

      setTimeout(timeoutCallback, 25000);
    },
  })
  readonly stockHistoryDownlink!: MapDownlink<this, Value>;
}
