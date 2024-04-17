import "./types.js"
import { transpose, eqArray, eqMaybe, setIndex } from "./arrays.js"
import { isValidRow } from "./check.js"

export function solve(clues: Value[][]): Value[][] {
  const state = solveColumns(solveRows(clues));
  if (eqArray(clues, state, (a1, a2) => eqMaybe(a1, a2, eqArray))) {
    return state;
  }
  return solve(state);
}

function solveRows(clues: Value[][]): Value[][] {
  const usedRows = clues.filter(row => row.length === 10 && row.every(v => v != undefined)) // remove incomplete rows
  return clues.map(row => solveRow(row, usedRows));
}

function solveRow(row: Value[], usedRows: Value[][]): Value[] {
  let zeroes = row.filter(v => v === 0).length;
  let ones = row.filter(v => v === 1).length;
  const result: Value[] = [];
  for (var i = 0; i < 10; i++) {
    if (row[i] == undefined) {
      if (i > 1 && row[i-1] === row[i-2] && row[i-1] != undefined) {
        result.push(invert(row[i-1]));
      } else if (i < 8 && row[i+1] === row[i+2] && row[i+1] != undefined) {
        result.push(invert(row[i+1]));
      } else if (i > 0 && i < 9 && row[i-1] === row[i+1] && row[i-1] != undefined) {
        result.push(invert(row[i-1]));
      } else if (zeroes === 5) {
        result.push(1);
      } else if (ones === 5) {
        result.push(0);
      } else if (zeroes === 4 && !isValidRow(fill(1, setIndex(i, 0, row)))) {
        result.push(1);
      } else if (ones === 4 && !isValidRow(fill(0, setIndex(i, 1, row)))) {
        result.push(0);
      } else if (zeroes === 4 && isDuplicate(fill(1, setIndex(i, 0, row)), usedRows)) {
        console.log("used duplicates")
        result.push(1);
      } else if (ones === 4 && isDuplicate(fill(0, setIndex(i, 1, row)), usedRows)) {
        console.log("used duplicates")
        result.push(0);
      } else {
        // One extra strategy we could add is try to see if adding a value results in a duplicate row. See e.g. https://www.binarypuzzle.com/solving_binary_puzzles.php
        // Another strategy: in the row "..100101..0." (from a 12x12) we need to place three more 1's. Each open stretch can have a max of one 1, otherwise we'd get a trio. So the last empty spot needs to be a one.
        result.push(undefined);
      }
    } else {
      result.push(row[i]);
    }
  }
  return result;
}

function invert(v: Value): Value {
  if (v == undefined) {
    return undefined;
  }
  return 1 - v;
}

function fill(fillV: Value, row: Value[]) {
  return row.map(v => v == undefined ? fillV : v);
}

function solveColumns(clues: Value[][]): Value[][] {
  return transpose(solveRows(transpose(clues)));
}

function isDuplicate(row: Value[], usedRows: Value[][]) {
  return usedRows.some(usedRow => eqArray(row, usedRow));
}
