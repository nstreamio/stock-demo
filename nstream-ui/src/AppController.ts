import { BoardController } from "@swim/panel";
import { View, ViewRef } from "@swim/view";
import { HtmlView } from "@swim/dom";
import { HtmlIconView, VectorIcon } from "@swim/graphics";
import { StockController } from "./stock/StockController";

export class AppController extends BoardController {
  constructor() {
    super();

    // insert appBar view
    this.initBoard();
  }

  protected initBoard() {
    const boardView = this.sheet.attachView().set({
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        boxSizing: "border-box",
      },
    });
    boardView.node.style.backgroundColor = "#181818";
    this.appBarView.insertView(boardView);
    const stockController = new StockController();
    stockController.sheet.insertView(this.sheet.attachView(), null, null, "stockController");
  }

  @ViewRef({
    viewType: HtmlView,
    createView() {
      const nav = document.createElement("nav");
      nav.style.backgroundColor = "#181818";
      return new HtmlView(nav).set({
        style: {
          width: "100%",
          height: "auto",
          flexGrow: 0,
          flexShrink: 0,
          flexBasis: "auto",
          boxSizing: "border-box",
          paddingTop: "16px",
          paddingRight: "48px",
          paddingBottom: "16px",
          paddingLeft: "16px",
        },
      });
    },
    initView(appBarView: HtmlView): void {
      const container = appBarView.appendChild("div").set({
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          boxSizing: "border-box",
        },
      });
      // insert NStream logo icon
      container.insertChild(HtmlIconView, null, "nStreamIcon").setIntrinsic({
        graphics: VectorIcon.create(
          64,
          64,
          "M0,0H64V64H0Z M5,5V59H59V5Z M44,38.78V46L25,29.55V46H20V18Z M39,25V18H44V29.33Z"
        ),
        style: {
          width: "48px",
          height: "48px",
          marginRight: "16px",
        },
        classList: ["n-stream-icon"],
      });

      // insert details container
      const detailsContainer = container.appendChild("div", "app-bar-details-container").setIntrinsic({
        style: {
          height: "100%",
          display: "flex",
          flexDirection: "column",
          flexBasis: "0px",
          flexGrow: 1,
          flexShrink: 1,
          justifyContent: "space-between",
          alignItems: "flex-start",
        },
      });

      const detailsTopRow = detailsContainer.appendChild("div").set({
        style: {
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          width: "100%",
        },
      });

      // insert NStream title text
      const demoTitle = detailsTopRow.appendChild("h1").set({
        style: {
          width: "auto",
          fontWeight: "400",
          fontSize: "18px",
          lineHeight: "24px",
          color: "#FFFFFF",
          margin: "0px",
          boxSizing: "border-box",
        },
      });
      demoTitle.node.innerText = "Stock Demo";

      // insert NStream title text
      const indexTitle = detailsTopRow.appendChild("h1").set({
        style: {
          width: "auto",
          fontWeight: "600",
          fontSize: "20px",
          lineHeight: "24px",
          color: "#FFFFFF",
          margin: "0px",
          boxSizing: "border-box",
        },
      });
      indexTitle.node.innerText = "S&P 500";

      const detailsBottomRow = detailsContainer.appendChild("div").set({
        style: {
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          width: "100%",
        },
      });

      // insert NStream subtitle text
      const subtitle = detailsBottomRow.appendChild("p").set({
        style: {
          fontWeight: "400",
          fontSize: "12px",
          lineHeight: "17px",
          color: "#FFFFFF",
          boxSizing: "border-box",
          marginTop: "8px",
          marginRight: "0px",
          marginBottom: "0px",
          marginLeft: "0px",
        },
      });
      subtitle.node.innerText = "v1.0.0";
    },
  })
  readonly appBarView!: ViewRef<this, View>;
}
