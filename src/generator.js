import "./types.js";
import { solve } from "./solver.js";
import { filledValues, checkValues } from "./check.js";
import { setIndex, replicate } from "./arrays.js";
export function generate() {
    return generate_(replicate(10, []));
}
function generate_(clues) {
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
    }
    else {
        console.error("Generated invalid puzzle from {} by setting ({}, {}) to {}.", clues, rowIx, colIx, newVal);
        return generate();
    }
}
function sanityCheck(clues) {
    return checkValues(clues, solve(clues)).length === 0;
}
function unfilledPosition(grid) {
    var _a;
    let rowIx, colIx;
    do {
        rowIx = randomInt(10);
        colIx = randomInt(10);
    } while (((_a = grid[rowIx]) === null || _a === void 0 ? void 0 : _a[colIx]) != undefined);
    return [rowIx, colIx];
}
function setValue(rowIx, colIx, newVal, values) {
    var _a;
    return setIndex(rowIx, setIndex(colIx, newVal, (_a = values[rowIx]) !== null && _a !== void 0 ? _a : []), values);
}
function randomInt(max) {
    return Math.floor(Math.random() * max);
}
