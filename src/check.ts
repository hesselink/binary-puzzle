import "./types.js"
import { groupBy, eqArray, transpose } from "./arrays.js"

export function check(state: GameState): Mistake[] {
  return checkValues(state.clues, state.answers);
}

export function checkValues(clues: Value[][], answers: Value[][]) {
  return checkRows(clues, answers).concat(checkColumns(clues, answers));
}

export function isValidRow(row: Value[]): boolean {
  return checkRow(row, 0).length === 0;
}

function checkRows(clues: Value[][], answers: Value[][]): Mistake[] {
  let mistakes: Mistake[] = [];
  const rows = [];
  for (let i = 0; i < clues.length; i++) {
    const row = makeRow(clues[i], answers[i] || []);
    rows.push(row);
    mistakes = mistakes.concat(checkRow(row, i));
  }
  mistakes = mistakes.concat(findDuplicates(rows));
  return mistakes;
}

function checkRow(row: Value[], ix: number): Mistake[] {
  let zeroes = 0;
  let ones = 0;
  let consecutiveZeroes = 0;
  let consecutiveOnes = 0;
  const maxCount = row.length / 2;
  const mistakes: Mistake[] = [];
  for (var i = 0; i < row.length; i++) {
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
    } else if (row[i] === 1) {
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
    } else { // nothing yet
      consecutiveZeroes = 0;
      consecutiveOnes = 0;
    }
  }
  if (zeroes > maxCount) {
    mistakes.push({
      type: "too-many-in-row",
      value: 0,
      row: ix
    });
  } else if (ones > maxCount) {
    mistakes.push({
      type: "too-many-in-row",
      value: 1,
      row: ix
    });
  }
  return mistakes;
}

function findDuplicates(rows: Value[][]): Mistake[] {
  return groupBy(
    rows.map((row, ix) => [row, ix] as [Value[], number]) // add row index
        .filter(t => t[0].every(x => x != undefined)) // remove incomplete rows
        .sort(), // sort for grouping
    (t1, t2) => eqArray(t1[0], t2[0])
  ).filter(g => g.length > 1)
   .map(g => ({
     type: "duplicate-row",
     rows: g.map(v => v[1])
   }));
}

function checkColumns(clues: Value[][], answers: Value[][]): Mistake[] {
  // TODO rows to cols in result
  return checkRows(transpose(clues), transpose(answers));
}

function makeRow(clues: Value[] | undefined, answers: Value[] | undefined): Value[] {
  clues = clues || [];
  answers = answers || [];
  const row = [];
  for (var i = 0; i < clues.length; i++) {
    if (clues[i] != undefined) {
      row[i] = clues[i];
    } else {
      row[i] = answers[i];
    }
  }
  return row;
}

export function filled(state: GameState) : boolean {
  return filledValues(state.clues, state.answers);
}

export function filledValues(clues: Value[][], answers: Value[][]) {
  for (let i = 0; i < clues.length; i++) {
    if (makeRow(clues[i], answers[i]).filter(x => x != undefined).length !== clues[0].length) {
      return false;
    }
  }

  return true;
}
