export type ValueChange = "none" | "rising" | "falling";

export type SymbolUpdate =
  | {
      "@update"?: {
        key?: string;
      };
    }
  | undefined;

// export interface StockHistoryEntry {
//   open: number;
//   high: number;
//   low: number;
//   close: number;
//   volume: number;
// }
