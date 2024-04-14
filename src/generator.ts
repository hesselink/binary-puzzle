import "./types.js"
import { solve } from "./solver.js"
import { filledValues, checkValues } from "./check.js"
import { setIndex, replicate } from "./arrays.js"

export function generate(): Value[][] {
  return generate_(replicate(10, []));
}

function generate_(clues: Value[][]): Value[][] {
  const solved = solve(clues);
  if (filledValues(clues, solved)) {
    return clues;
  }
  const [rowIx, colIx] = unfilledPosition(solved);
  const newVal = randomInt(2);
  const newClues = setValue(rowIx, colIx, newVal, clues);
  const ok = sanityCheck(newClues);
  if (ok) {
    return generate_(newClues);
  } else {
    console.error("Generated invalid puzzle from {} by setting ({}, {}) to {}.", clues, rowIx, colIx, newVal);
    return generate();
  }
}

function sanityCheck(clues: Value[][]): boolean {
  return checkValues(clues, solve(clues)).length === 0;
}

function unfilledPosition(grid: Value[][]): [number, number] {
  let rowIx, colIx;
  do {
    rowIx = randomInt(10);
    colIx = randomInt(10);
  } while (grid[rowIx]?.[colIx] != undefined)
  return [rowIx, colIx]
}

function setValue(rowIx: number, colIx: number, newVal: Value, values: Value[][]): Value[][] {
  return setIndex(rowIx, setIndex(colIx, newVal, values[rowIx] ?? []), values);
}

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}
