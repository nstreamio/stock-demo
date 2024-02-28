import { FC, useCallback, useEffect, useRef, useState } from "react";
import { WarpClient } from "@swim/client";
import { Form } from "@swim/structure";
import { AgGridReact } from "ag-grid-react";
import { CellStyle, ColDef, GridOptions, RowStyle } from "ag-grid-community";
import { TableProps, Cusip, CusipRow, PriceChangeState, CusipMeta } from "./Table.types";
import { numValueFormatter } from "../../lib/helpers/numFormatting";
import { CusipForm } from "./CusipForm";
import "ag-grid-community/styles/ag-grid.css";

const NEW_CUSIP_METADATA: CusipMeta = { timer: null, priceLastUpdated: 0, prevDisplayedPrice: 0 };
const UPDATED_ROW_STYLE_DURATION_MS = 2000;
const MAX_UI_REFRESH_INTERVAL_MS = 16; // ~60/sec

const getRowStyle: GridOptions<CusipRow>["getRowStyle"] = (params) => {
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
  { field: "price", valueFormatter: numValueFormatter, cellStyle, headerClass, getQuickFilterText: () => '' },
  { field: "volume", valueFormatter: numValueFormatter, cellStyle, headerClass, getQuickFilterText: () => '' },
  { field: "movement", valueFormatter: numValueFormatter, cellStyle, headerClass, getQuickFilterText: () => '' },
];

export const Table: FC<TableProps> = (props) => {
  const { search } = props;

  /* Row data for passing to AGGridReact element; derived from cusipsRef
     Updates to this value trigger a rerender */
  const [rowData, setRowData] = useState<CusipRow[]>([]);
  // Cusip data for display in table; updates to this value do not trigger rerenders
  const cusipsRef = useRef<Record<string, CusipRow>>({});
  // Cusip metadata to help with styling; updates to this value do not trigger rerenders
  const cusipsMetaRef = useRef<Record<string, CusipMeta>>({});

  // Flag representing whether cusipsRef contains more up-to-date data than what is being displayed in the UI
  const needsRerenderRef = useRef<boolean>(false);
  const lastRowDataUpdatedAt = useRef<number>(0);
  const setRowDataIntervalRef = useRef<NodeJS.Timeout | null>(null); // used for cleanup

  // callback which handles individual Cusip updates
  const didUpdate: (key: string, newCusip: Cusip | undefined, oldCusip: Cusip | undefined) => void = useCallback(
    (key, newCusip) => {
      // handle update in unexpected format
      if (!newCusip) {
        return;
      }

      let state: PriceChangeState = null;

      if (cusipsRef.current[key]) {
        const newCusipMeta: CusipMeta = cusipsMetaRef.current[key] ?? { ...NEW_CUSIP_METADATA };
        // if present, cancel existing timeout for resetting row styles
        if (newCusipMeta.timer != null) {
          clearTimeout(newCusipMeta.timer);
          newCusipMeta.timer = null;
        }

        /* Ensure correct price is being used for determining direction of price change. Must use last
           *displayed* price since we're batching updates, instead of simply last price on record */
        if (newCusipMeta.priceLastUpdated! < lastRowDataUpdatedAt.current) {
          newCusipMeta.prevDisplayedPrice = cusipsRef.current[key].price;
        }

        // determine direction of price change, if any
        if (newCusip.price && newCusipMeta.prevDisplayedPrice) {
          if (newCusip.price > newCusipMeta.prevDisplayedPrice) {
            state = "rising";
          } else if (newCusip.price < newCusipMeta.prevDisplayedPrice) {
            state = "falling";
          }
        }

        // define callback for resetting row styles
        const resetRowStyle = () => {
          cusipsRef.current[key] = {
            ...cusipsRef.current[key],
            state: null,
          }
          cusipsMetaRef.current[key].timer = null;
        };

        // clear row styles after a delay; set newCusip metadata
        newCusipMeta.timer = setTimeout(resetRowStyle, UPDATED_ROW_STYLE_DURATION_MS);
        newCusipMeta.priceLastUpdated = newCusip.timestamp;
        cusipsMetaRef.current[key] = newCusipMeta;
      }


      // Update data for this newCusip key in cusipsRef. This will not trigger a rerender.
      cusipsRef.current[key] = {
        ...newCusip,
        key,
        state,
      };
      // alert component that new newCusip data has been received
      needsRerenderRef.current = true;
    },
    []
  );

  // callback which handles individual Cusip updates
  const didRemove: (key: string, oldCusip: Cusip | undefined) => void = useCallback(
    (key, cusip) => {
      // handle invalid message
      if (!cusip) {
        return;
      }

      // Delete key for this cusip key in cusipsRef and cusipsMetaRef. This will not trigger a rerender.
      delete cusipsMetaRef.current[key];
      delete cusipsRef.current[key];
      // alert component that a cusip record has been removed and a rerender is needed
      needsRerenderRef.current = true;
    },
    []
  );

  // Periodically update rowData with the more up-to-date data in cusipsRef. Will trigger a rerender.
  useEffect(() => {
    setRowDataIntervalRef.current = setInterval(() => {
      if (needsRerenderRef.current && cusipsRef.current) {
        needsRerenderRef.current = false;
        lastRowDataUpdatedAt.current = Date.now();
        setRowData(Object.values(cusipsRef.current));
      }
    }, MAX_UI_REFRESH_INTERVAL_MS);

    return (() => {
      // cleanup
      if (setRowDataIntervalRef.current) {
        clearInterval(setRowDataIntervalRef.current);
      }
    })
  }, []);

  useEffect(() => {
    const client = new WarpClient();

    const urlParams = new URLSearchParams(window.location.search);
    let hostUri = urlParams.get("host");

    if (!hostUri) {
      const protocol = window.location.protocol.startsWith("https") ? "warps:" : "warp:";
      let hostFragment = window.location.host;

      /* If the UI is being served from localhost and no host is explicitly provided,
         then fall back to the default Swim server port, localhost:9001 */
      if (hostFragment.startsWith("localhost:") || hostFragment.startsWith("127.0.0.1:")) {
        hostFragment = "localhost:9001";
      }

      hostUri = `${protocol}//${hostFragment}`;
    }

    const downlink = client.downlinkMap<string, Cusip | undefined>({
      hostUri,
      nodeUri: "/symbols",
      laneUri: "stocks",
      keyForm: Form.forString(),
      valueForm: new CusipForm(), // coerces content of WARP message to strongly-typed JS object
      didUpdate,
      didRemove
    })
    .open();

    return () => {
      if (downlink) {
        downlink.close();
      }
    };
  }, [didUpdate, didRemove]);

  return (
    <div className="h-full px-4 lg:px-8 justify-center">
      <AgGridReact
        rowData={rowData}
        rowHeight={44}
        getRowStyle={getRowStyle}
        columnDefs={COLUMN_DEFS}
        getRowId={(params) => params.data.key}
        deltaSort
        quickFilterText={search}
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
