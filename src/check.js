import "./types.js";
import { groupBy, eqArray, transpose } from "./arrays.js";
export function check(state) {
    return checkValues(state.clues, state.answers);
}
export function checkValues(clues, answers) {
    return checkRows(clues, answers).concat(checkColumns(clues, answers));
}
export function isValidRow(row) {
    return checkRow(row, 0).length === 0;
}
function checkRows(clues, answers) {
    let mistakes = [];
    const rows = [];
    for (let i = 0; i < 10; i++) {
        const row = makeRow(clues[i], answers[i] || []);
        rows.push(row);
        mistakes = mistakes.concat(checkRow(row, i));
    }
    mistakes = mistakes.concat(findDuplicates(rows));
    return mistakes;
}
function checkRow(row, ix) {
    let zeroes = 0;
    let ones = 0;
    let consecutiveZeroes = 0;
    let consecutiveOnes = 0;
    const mistakes = [];
    for (var i = 0; i < 10; i++) {
        if (row[i] === 0) {
            zeroes++;
            consecutiveZeroes++;
            consecutiveOnes = 0;
            if (consecutiveZeroes === 3) {
                mistakes.push({
                    type: "too-many-consecutive-in-row",
                    value: 0,
                    row: ix
                });
            }
        }
        else if (row[i] === 1) {
            ones++;
            consecutiveOnes++;
            consecutiveZeroes = 0;
            if (consecutiveOnes === 3) {
                mistakes.push({
                    type: "too-many-consecutive-in-row",
                    value: 1,
                    row: ix
                });
            }
        }
        else { // nothing yet
            consecutiveZeroes = 0;
            consecutiveOnes = 0;
        }
    }
    if (zeroes > 5) {
        mistakes.push({
            type: "too-many-in-row",
            value: 0,
            row: ix
        });
    }
    else if (ones > 5) {
        mistakes.push({
            type: "too-many-in-row",
            value: 1,
            row: ix
        });
    }
    return mistakes;
}
function findDuplicates(rows) {
    return groupBy(rows.map((row, ix) => [row, ix]) // add row index
        .filter(t => t[0].length === 10 && t[0].every(x => x != undefined)) // remove incomplete rows
        .sort(), // sort for grouping
    (t1, t2) => eqArray(t1[0], t2[0])).filter(g => g.length > 1)
        .map(g => ({
        type: "duplicate-row",
        rows: g.map(v => v[1])
    }));
}
function checkColumns(clues, answers) {
    // TODO rows to cols in result
    return checkRows(transpose(clues), transpose(answers));
}
function makeRow(clues, answers) {
    clues = clues || [];
    answers = answers || [];
    const row = [];
    for (var i = 0; i < 10; i++) {
        if (clues[i] != undefined) {
            row[i] = clues[i];
        }
        else {
            row[i] = answers[i];
        }
    }
    return row;
}
export function filled(state) {
    return filledValues(state.clues, state.answers);
}
export function filledValues(clues, answers) {
    for (let i = 0; i < 10; i++) {
        if (makeRow(clues[i], answers[i]).filter(x => x != undefined).length !== 10) {
            return false;
        }
    }
    return true;
}
