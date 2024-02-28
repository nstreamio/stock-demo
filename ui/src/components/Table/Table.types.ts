export interface TableProps {
  search: string;
}

export type PriceChangeState = "falling" | "rising" | null | undefined;

export type Cusip = {
  price: number;
  volume?: number;
  movement?: number;
  timestamp: number;
  state: PriceChangeState;
};

// for use determining correct row style to apply
export type CusipMeta = {
  timer: NodeJS.Timeout | null;
  prevDisplayedPrice?: number;
  priceLastUpdated?: number;
}

export type CusipRow = Cusip & { key: string };
