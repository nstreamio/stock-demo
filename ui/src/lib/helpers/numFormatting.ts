import { ValueFormatterFunc } from "ag-grid-community";
import { Stock } from "../../components/Table";

const DATA_PLACHOLDER = "--";

export const numValueFormatter: ValueFormatterFunc<Stock, number | undefined> = (param) =>
  param.value ? formatNum(param.value) : DATA_PLACHOLDER;

function formatNum(num: number): string {
  const result = num.toFixed(3);
  return result.endsWith("0") && result.length > 4 && result.at(-4) === "." ? result.slice(0, -1) : result;
}
