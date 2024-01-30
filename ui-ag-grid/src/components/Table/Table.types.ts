export interface TableProps {
  search: string;
}

export type PriceChangeState = "falling" | "rising" | null | undefined;

export interface Stock {
  key: string;
  price?: number;
  volume?: number;
  movement?: number;
  state: PriceChangeState;
}

