import "./types.js"
import { setIndex } from "./arrays.js"

export function setValue(rowIx: number, colIx: number, newVal: Value, values: Value[][]): Value[][] {
  return setIndex(rowIx, setIndex(colIx, newVal, values[rowIx] ?? []), values);
}
