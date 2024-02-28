import { BoardController, BoardView } from "@swim/panel";
import { ControllerRef, TraitViewRef } from "@swim/controller";
import { Model, Trait } from "@swim/model";
import { ViewRef } from "@swim/view";
import { PanelView } from "@swim/panel";
import { TableTrait, TextColTrait } from "@swim/ux";
import { Look } from "@swim/theme";
import { StockTableController } from "./StockTableController";

export class StockController extends BoardController {
  constructor() {
    super();

    const boardView = this.sheet.attachView();
    const panelView = this.panel.insertView(boardView);
    this.tablePanel.insertView(panelView);

    this.tableController.attachController();
  }

  @TraitViewRef({
    extends: true,
    createView(): BoardView {
      const mainElement = document.createElement("main");
      const boardView = new BoardView(mainElement).set({
        style: {
          width: "100%",
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: "0px",
          margin: "0px",
          backgroundColor: "#181818",
          overflowX: "scroll",
        },
      });

      return boardView;
    },
  })
  override readonly sheet!: TraitViewRef<this, Trait, BoardView> & BoardController["sheet"];

  @ViewRef({
    viewType: PanelView,
    initView(panelView: PanelView) {
      panelView.node.classList.add("stock-panel");
      this.owner.tablePanel.insertView(panelView);
    },
  })
  readonly panel!: ViewRef<this, PanelView>;

  @ViewRef({
    extends: true,
    createView(): PanelView {
      return PanelView.create();
    },
    initView(panelView: PanelView): void {
      super.initView(panelView);
      panelView.node.classList.add("stock-tablePanel");
      panelView.node.style.backgroundColor = "#181818";
      panelView.node.style.overflowY = "scroll";
      panelView.set({
        unitWidth: 1,
        unitHeight: 1,
        minFrameWidth: 600,
      });
    },
  })
  readonly tablePanel!: ViewRef<this, PanelView>;

  @ControllerRef({
    controllerType: StockTableController,
    extends: true,
    initController(controller: StockTableController): void {
      const tableModel = new Model();
      tableModel.mount();
      const tableTrait = new TableTrait();
      tableModel.setTrait("table", tableTrait);
      tableTrait.header.insertTrait();
      tableTrait.appendTrait(TextColTrait, "symbol").set({
        layout: { key: "symbol", grow: 3, textColor: Look.labelColor },
        label: "Symbol",
      });
      tableTrait.appendTrait(TextColTrait, "price").set({
        layout: { key: "price", grow: 3, textColor: Look.labelColor },
        label: "Price",
      });
      tableTrait.appendTrait(TextColTrait, "volume").set({
        layout: { key: "volume", grow: 4, textColor: Look.labelColor },
        label: "Volume",
      });
      tableTrait.appendTrait(TextColTrait, "movement").set({
        layout: { key: "movement", grow: 3, textColor: Look.labelColor },
        label: "Movement",
      });

      controller.mount();
      controller.tableModel.set(tableModel);
      controller.table.insertView(this.owner.tablePanel.attachView());
      controller.table.setTrait(tableTrait);
    },
  })
  readonly tableController!: ControllerRef<this, StockTableController>;
}
