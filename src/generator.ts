import "./types.js"
import { solve } from "./solver.js"
import { filledValues, checkValues } from "./check.js"
import { replicate } from "./arrays.js"
import { setValue } from "./grid.js"

export function generate(size: number): Value[][] {
  return generate_(replicate(size, replicate(size, undefined)));
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
    return generate(clues.length);
  }
}

function sanityCheck(clues: Value[][]): boolean {
  return checkValues(clues, solve(clues)).length === 0;
}

function unfilledPosition(grid: Value[][]): [number, number] {
  let rowIx, colIx;
  do {
    rowIx = randomInt(grid.length);
    colIx = randomInt(grid[0].length);
  } while (grid[rowIx]?.[colIx] != undefined)
  return [rowIx, colIx]
}

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}
