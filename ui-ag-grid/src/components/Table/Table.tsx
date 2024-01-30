import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Value } from "@swim/structure";
import { AgGridReact } from "ag-grid-react";
import { CellStyle, ColDef, GridOptions, RowStyle } from "ag-grid-community";
import { TableProps, Stock } from "./Table.types";
import { useValueDownlink } from "../../lib/hooks/useValueDownlink";
import { numValueFormatter } from "../../lib/helpers/numFormatting";
import "ag-grid-community/styles/ag-grid.css";

const getRowStyle: GridOptions<Stock>["getRowStyle"] = (params) => {
  const styles: RowStyle = {
    backgroundColor: params.rowIndex % 2 === 0 ? "var(--app-background)" : "var(--row-background-secondary)",
  };
  if (params?.data?.state != null) {
    styles.color = params.data.state === "falling" ? "var(--red-alert)" : "var(--green-alert)";
  }
  return styles;
};

const cellStyle: CellStyle = {
  height: "100%",
  display: "flex ",
  justifyContent: "center",
  alignItems: "center ",
};
const headerClass = "text-center text-white/50 text-sm";
const COLUMN_DEFS: ColDef[] = [
  { field: "key", cellStyle, headerClass },
  { field: "price", valueFormatter: numValueFormatter, cellStyle, headerClass },
  { field: "volume", valueFormatter: numValueFormatter, cellStyle, headerClass },
  { field: "movement", valueFormatter: numValueFormatter, cellStyle, headerClass },
];

export const Table: FC<TableProps> = (props) => {
  const { search } = props;

  const [stocks, setStocks] = useState<Record<string, Stock>>({});
  const stocksRef = useRef<typeof stocks>({});
  stocksRef.current = stocks;
  const gridRef = useRef<AgGridReact>(null);
  const timersRef = useRef<Record<string, NodeJS.Timeout | null>>({});

  // callback for handling incoming stock price updates
  const didSet = useCallback(
    (newValue: Value) => {
      const update = newValue.getAttr("update");
      if (!update.isDefinite() || !update.get("key").stringValue("")) {
        return;
      }

      /* For more on working with Value and recon, see these links:
         Value: https://docs.swimos.org/js/4.0.0/classes/_swim_structure.Value.html
         Recon: https://www.swimos.org/backend/recon/ */
      const key = update.get("key").stringValue("");
      const stock: Stock = {
        key,
        price: newValue.get("price").numberValue(undefined),
        volume: newValue.get("volume").numberValue(undefined),
        movement: newValue.get("movement").numberValue(undefined),
        state: null,
      };

      const existingStock = stocksRef.current[key];

      if (existingStock) {
        // clear existing timeout which will update row styles
        if (timersRef.current[key] != null) {
          clearTimeout(timersRef.current[key]!);
          timersRef.current[key] = null;
        }

        // determine direction of price change, if any
        if (stock.price && existingStock.price) {
          if (stock.price > existingStock.price) {
            stock.state = "rising";
          } else if (stock.price < existingStock.price) {
            stock.state = "falling";
          }
        }

        // callback for resetting row styles
        const clearRowChangeState = () => {
          setStocks((currentStocks) => ({
            ...currentStocks,
            [key]: {
              ...currentStocks[key],
              state: null,
            },
          }));
          timersRef.current[key] = null;
        };

        // clear row styles after a delay
        timersRef.current[key] = setTimeout(clearRowChangeState, 2000);
      }

      // update data for this stock symbol
      setStocks((currentStocks) => ({
        ...currentStocks,
        [key]: stock,
      }));
    },
    [setStocks]
  );

  // open downlink to stream stock pricing data
  const downlinkValue = useValueDownlink({
    hostUri: "localhost:9001",
    nodeUri: "/symbols",
    laneUri: "stocks",
    didSet,
  });

  // downlink cleanup
  useEffect(() => {
    return () => {
      downlinkValue?.close();
    };
  }, [downlinkValue]);

  // filter table rows on user search input
  useEffect(() => {
    gridRef.current?.api?.setGridOption("quickFilterText", search);
  }, [search]);

  const rowData = useMemo(() => Object.values(stocks), [stocks]);

  return (
    <div className="h-full px-4 lg:px-8 justify-center">
      <AgGridReact
        ref={gridRef}
        rowData={rowData}
        rowHeight={44}
        getRowStyle={getRowStyle}
        columnDefs={COLUMN_DEFS}
        getRowId={(params) => params.data.key}
        deltaSort
        autoSizeStrategy={{
          type: "fitGridWidth",
          defaultMinWidth: 80,
          columnLimits: [
            {
              colId: "key",
              maxWidth: 160,
            },
          ],
        }}
      />
    </div>
  );
};
