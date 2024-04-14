import "./types.js";
import { transpose, eqArray, eqMaybe, setIndex } from "./arrays.js";
import { isValidRow } from "./check.js";
export function solve(clues) {
    const state = solveColumns(solveRows(clues));
    if (eqArray(clues, state, (a1, a2) => eqMaybe(a1, a2, eqArray))) {
        return state;
    }
    return solve(state);
}
function solveRows(clues) {
    const usedRows = clues.filter(row => row.length === 10 && row.every(v => v != undefined)); // remove incomplete rows
    return clues.map(row => solveRow(row, usedRows));
}
function solveRow(row, usedRows) {
    let zeroes = row.filter(v => v === 0).length;
    let ones = row.filter(v => v === 1).length;
    const result = [];
    for (var i = 0; i < 10; i++) {
        if (row[i] == undefined) {
            if (i > 1 && row[i - 1] === row[i - 2] && row[i - 1] != undefined) {
                result.push(invert(row[i - 1]));
            }
            else if (i < 8 && row[i + 1] === row[i + 2] && row[i + 1] != undefined) {
                result.push(invert(row[i + 1]));
            }
            else if (i > 0 && i < 9 && row[i - 1] === row[i + 1] && row[i - 1] != undefined) {
                result.push(invert(row[i - 1]));
            }
            else if (zeroes === 5) {
                result.push(1);
            }
            else if (ones === 5) {
                result.push(0);
            }
            else if (zeroes === 4 && !isValidRow(fill(1, setIndex(i, 0, row)))) {
                result.push(1);
            }
            else if (ones === 4 && !isValidRow(fill(0, setIndex(i, 1, row)))) {
                result.push(0);
            }
            else if (zeroes === 4 && isDuplicate(fill(1, setIndex(i, 0, row)), usedRows)) {
                console.log("used duplicates");
                result.push(1);
            }
            else if (ones === 4 && isDuplicate(fill(0, setIndex(i, 1, row)), usedRows)) {
                console.log("used duplicates");
                result.push(0);
            }
            else {
                result.push(undefined);
            }
        }
        else {
            result.push(row[i]);
        }
    }
    return result;
}
function invert(v) {
    if (v == undefined) {
        return undefined;
    }
    return 1 - v;
}
function fill(fillV, row) {
    return row.map(v => v == undefined ? fillV : v);
}
function solveColumns(clues) {
    return transpose(solveRows(transpose(clues)));
}
function isDuplicate(row, usedRows) {
    return usedRows.some(usedRow => eqArray(row, usedRow));
}
