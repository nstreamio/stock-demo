import { ValueDownlink } from "@swim/client";
import {
  TraitViewControllerRef,
  TraitViewControllerSet,
  TraitViewRef,
} from "@swim/controller";
import {
  HeaderController,
  HeaderTrait,
  HeaderView,
  RowController,
  RowTrait,
  TableController,
  TableTrait,
  TableView,
  TextCellTrait,
  TextCellView,
} from "@swim/table";
import { Observes } from "@swim/util";
import { StockRowController } from "../row/StockRowController";
import { Record as SwimRecord } from "@swim/structure";
import { Uri } from "@swim/uri";
import { Model } from "@swim/model";
import { Property } from "@swim/component";
import { StockRowView } from "../row/StockRowView";
import { StockRowTrait } from "../row/StockRowTrait";
import { PlayerChange, SymbolUpdate } from "../types";

export class StockTableController extends TableController {
  _didSync: boolean = false;

  constructor() {
    super();
    StockTableController.initFasteners(this);

    const urlParams = new URLSearchParams(window.location.search);

    let host = urlParams.get("host");
    const baseUri = Uri.parse(document.location.href);
    if (!host) {
      host = baseUri
        .base()
        .withScheme(baseUri.schemeName === "https" ? "warps" : "warp")
        .toString();
    }
    const nodeUri = "/symbols";

    // set up and open status downlink
    this.symbolsDownlink.setHostUri(host);
    this.symbolsDownlink.setNodeUri(nodeUri);
    console.log("about to open symbolsDownlink");
    this.symbolsDownlink.open();
  }

  @Property({
    valueType: Model,
  })
  readonly tableModel!: Property<this, Model>;

  @TraitViewRef({
    extends: true,
    traitWillAttachRow(rowTrait, targetTrait) {
      this.owner.rows.addTrait(rowTrait, targetTrait, rowTrait.key);
    },
  })
  override readonly table!: TraitViewRef<this, TableTrait, TableView> &
    Observes<TableTrait> &
    Observes<TableView>;

  @TraitViewControllerRef({
    extends: true,
  })
  override readonly header!: TraitViewControllerRef<
    this,
    HeaderTrait,
    HeaderView,
    HeaderController
  > &
    TableController["header"];

  @TraitViewControllerSet({
    extends: true,
    controllerDidEnterLeafView(leafView, rowController) {
      leafView.hover.focus(false);
    },
    controllerDidLeaveLeafView(leafView, rowController) {
      leafView.hover.unfocus(false);
    },
    controllerDidPressLeafView(input, event, leafView, rowController) {
      leafView.highlight.toggle();
    },
    attachCellView(cellView, cellController, rowController) {
      super.attachCellView(cellView, cellController, rowController);
      if (cellView.key === "a") {
        cellView.style.color.set("#989898");
      }
    },
    createController(trait) {
      const traitKey = trait?.key ?? "";
      console.log("traitKey:", traitKey);

      if (trait && traitKey) {
        const stockRowController = new StockRowController(trait, traitKey);
        stockRowController.setKey(traitKey);
        return stockRowController;
      }

      return super.createController(trait);
    },
  })
  override readonly rows!: TraitViewControllerSet<
    this,
    StockRowTrait,
    StockRowView,
    StockRowController
  > &
    Observes<RowController> &
    TableController["rows"];

  @ValueDownlink({
    laneUri: `stocks`,
    consumed: true,
    didSet(value: SwimRecord): void {
      const obj = value.toObject() as SymbolUpdate;
      const symbol = obj?.["@update"]?.key ?? "";
      console.log("symbol:", symbol);

      const rowController = this.owner.getChild(symbol, StockRowController);

      if (rowController) {
        let change: PlayerChange = "none";

        return;
      } else {
        const rowModel = new Model();
        const rowTrait = new StockRowTrait();
        rowModel.setTrait(symbol, rowTrait);

        // Create cells in trait before appending to model to display being set to 'none'
        const symbolCell = rowTrait.getOrCreateCell("symbol", TextCellTrait);
        const priceCell = rowTrait.getOrCreateCell("price", TextCellTrait);
        const openCell = rowTrait.getOrCreateCell("open", TextCellTrait);
        const highCell = rowTrait.getOrCreateCell("high", TextCellTrait);
        const lowCell = rowTrait.getOrCreateCell("low", TextCellTrait);
        const closeCell = rowTrait.getOrCreateCell("close", TextCellTrait);
        const volumeCell = rowTrait.getOrCreateCell("volume", TextCellTrait);

        this.owner.tableModel.value.appendChild(rowModel);

        const newStockRowController = Object.values(
          this.owner.rows.controllers
        ).find((c) => c?.key === symbol) as StockRowController | undefined;

        if (newStockRowController) {
          newStockRowController.symbolCell.setTrait(symbolCell);
          newStockRowController.priceCell.setTrait(priceCell);
          newStockRowController.openCell.setTrait(openCell);
          newStockRowController.highCell.setTrait(highCell);
          newStockRowController.lowCell.setTrait(lowCell);
          newStockRowController.closeCell.setTrait(closeCell);
          newStockRowController.volumeCell.setTrait(volumeCell);

          ["symbol", "price", "open", "high", "low", "close", "volume"].forEach(
            function (key) {
              const view = Object.values(
                newStockRowController.row.attachView().leaf.attachView().cells
                  .views
              ).find((v) => v?.key === key) as TextCellView | undefined;
              if (view) {
                (
                  newStockRowController[
                    `${key}Cell` as "priceCell"
                  ] as TraitViewRef<
                    StockRowController,
                    TextCellTrait,
                    TextCellView
                  >
                ).setView(view, null, key);
              }
              if (key === "symbol") {
                newStockRowController.symbolCell.attachView().set({
                  content: symbol,
                });
              }
            }
          );
        }
      }
    },
  })
  readonly symbolsDownlink!: ValueDownlink<this>;
}
