import { ValueDownlink } from "@swim/client";
import { TraitViewControllerRef, TraitViewControllerSet, TraitViewRef } from "@swim/controller";
import {
  HeaderController,
  HeaderTrait,
  HeaderView,
  RowController,
  TableController,
  TableTrait,
  TableView,
  TextCellTrait,
  TextCellView,
} from "@swim/table";
import { Observes } from "@swim/util";
import { Record as SwimRecord } from "@swim/structure";
import { Uri } from "@swim/uri";
import { Model } from "@swim/model";
import { Property } from "@swim/component";
import debounce from "lodash-es/debounce";
import { StockRowController } from "../row/StockRowController";
import { StockRowView } from "../row/StockRowView";
import { StockRowTrait } from "../row/StockRowTrait";
import { SymbolUpdate } from "../types";

export class StockTableController extends TableController {
  _didSync: boolean = false;
  _symbolsVisibility: Record<string, boolean> = {};

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
    this.symbolsDownlink.open();

    const that: StockTableController = this;

    setTimeout(() => {
      const searchInput = document.getElementById("search-input");
      searchInput?.addEventListener(
        "input",
        debounce(function (e: Event) {
          const newSearchTerm = (e.target as HTMLInputElement).value.replace(" ", "").toUpperCase();
          console.log("newSearchTerm:", newSearchTerm);
        }, 200)
      );
    }, 500);
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
  override readonly header!: TraitViewControllerRef<this, HeaderTrait, HeaderView, HeaderController> &
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

      if (trait && traitKey) {
        const stockRowController = new StockRowController(trait, traitKey);
        stockRowController.setKey(traitKey);
        return stockRowController;
      }

      return super.createController(trait);
    },
  })
  override readonly rows!: TraitViewControllerSet<this, StockRowTrait, StockRowView, StockRowController> &
    Observes<RowController> &
    TableController["rows"];

  @ValueDownlink({
    laneUri: `stocks`,
    consumed: true,
    didSet(newValue: SwimRecord, oldValue: SwimRecord): void {
      const obj = newValue.toObject() as SymbolUpdate;
      const symbol = obj?.["@update"]?.key ?? "";

      let rowController = this.owner.getChild(symbol, StockRowController);
      const isNew = !rowController;

      if (!rowController) {
        const rowModel = new Model();
        const rowTrait = new StockRowTrait();
        rowModel.setTrait(symbol, rowTrait);

        // Create cells in trait before appending to model to display being set to 'none'
        const symbolCell = rowTrait.getOrCreateCell("symbol", TextCellTrait);
        const priceCell = rowTrait.getOrCreateCell("price", TextCellTrait);
        const volumeCell = rowTrait.getOrCreateCell("volume", TextCellTrait);
        const movementCell = rowTrait.getOrCreateCell("movement", TextCellTrait);

        this.owner.tableModel.value.appendChild(rowModel);

        rowController =
          Object.values(this.owner.rows.controllers).find((c) => c?.key === symbol) ??
          (null as StockRowController | null);

        if (rowController) {
          rowController.symbolCell.setTrait(symbolCell);
          rowController.priceCell.setTrait(priceCell);
          rowController.volumeCell.setTrait(volumeCell);
          rowController.movementCell.setTrait(movementCell);

          ["symbol", "price", "volume", "movement"].forEach(function (key) {
            // get this row's TextCellView for each column
            const cellView = Object.values(
              rowController!.row.attachView().leaf.attachView().cells.views
            ).find((v) => v?.key === key) as TextCellView | undefined;

            if (cellView) {
              (
                rowController![`${key}Cell` as "priceCell"] as TraitViewRef<
                  StockRowController,
                  TextCellTrait,
                  TextCellView
                >
              ).setView(cellView, null, key);
            }
            if (key === "symbol") {
              rowController!.symbolCell.attachView().set({
                content: symbol,
              });
            }
          });
        }
      }

      rowController?.updateRow(newValue, oldValue, isNew);
    },
  })
  readonly symbolsDownlink!: ValueDownlink<this>;
}
