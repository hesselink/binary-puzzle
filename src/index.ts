const GRIDSIZE = 800;
const BOXWIDTH = GRIDSIZE / 10;
const u = undefined;

window.addEventListener("DOMContentLoaded", e => {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(0.5, 0.5);

  let state: GameState = {
    clues: [ [1,u,u,u,u,u,u,u,1]
           , [u,u,u,0,u,1,1]
           , [0,u,u,0,u,u,1,0]
           , [u,u,u,u,1,u,u,u,0,0]
           , [0,1,u,0]
           , [u,u,1,u,u,u,u,0,0]
           , [u,u,u,u,u,u,u,1]
           , [0,u,u,1,1,u,u,u,u,1]
           , [u,u,u,u,1,u,0,0,u,1]
           , [u,u,1]
           ],
    answers: [],
    selected: undefined,
    mistakes: []
  };

  render(ctx, state);

  canvas.addEventListener("click", e => {
    state = setSelected(state, e);
    render(ctx, state);
  });

  document.addEventListener("keydown", e => {
    state = handleKeyPress(state, e);
    render(ctx, state);
  });

  const checkBtn = document.getElementById("check") as HTMLButtonElement;
  checkBtn.addEventListener("click", e => {
    const mistakes = check(state);
    if (mistakes.length > 0) {
      alert("Dat ziet er niet goed uit...");
    } else if (filled(state)) {
      alert("Helemaal goed!");
    } else {
      alert("Je bent op de goede weg!");
    }
    console.log("Mistakes", mistakes);
  });
});


function render(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.clearRect(0, 0, GRIDSIZE, GRIDSIZE);
  drawGrid(ctx);
  drawState(ctx, state);
}

function drawState(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (state.selected != undefined) {
    let [x, y] = state.selected;
    ctx.fillStyle = "yellow";
    ctx.fillRect(x * BOXWIDTH + 1, y * BOXWIDTH + 1, BOXWIDTH - 2, BOXWIDTH - 2);
  }

  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      const clue = state.clues[y]?.[x];
      if (clue != undefined) {
        ctx.font = "48px Arial"
        ctx.fillStyle = "black";
        ctx.fillText("" + clue, BOXWIDTH * (x + 0.35), BOXWIDTH * (y + 0.7));
      }

      const answer = state.answers[y]?.[x];
      if (answer != undefined) {
        ctx.font = "48px Arial"
        ctx.fillStyle = "blue";
        ctx.fillText("" + answer, BOXWIDTH * (x + 0.35), BOXWIDTH * (y + 0.7));
      }
    }
  }
}

function drawGrid(ctx: CanvasRenderingContext2D): void {
  for (let i=0; i<=GRIDSIZE; i+=GRIDSIZE/10) {
    line(ctx, 0, i, GRIDSIZE, i);
    line(ctx, i, 0, i, GRIDSIZE);
  }
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
};

function setSelected(state: GameState, e: MouseEvent): GameState {
  const x = Math.floor(e.offsetX / BOXWIDTH);
  const y = Math.floor(e.offsetY / BOXWIDTH);
  if (x > 9 || y > 9) {
    return state;
  }
  console.debug("Setting selected to", [x,y]);
  return { ...state, selected: [x, y] }
}

function handleKeyPress(state: GameState, e: KeyboardEvent): GameState {
  switch(e.code) {
    case "Digit0":
      return setSelectedValue(state, 0);
      break;
    case "Digit1":
      return setSelectedValue(state, 1);
      break;
    case "Backspace":
      return clearSelectValue(state);
      break;
    case "ArrowLeft":
      return moveSelectionLeft(state);
    case "ArrowRight":
      return moveSelectionRight(state);
    case "ArrowUp":
      return moveSelectionUp(state);
    case "ArrowDown":
      return moveSelectionDown(state);
    default:
      console.log("keypress", e.code);
  }
  return state;
}

function setSelectedValue(state: GameState, value: Value): GameState {
  if (state.selected != undefined) {
    const [x, y] = state.selected;
    if (state.clues[y]?.[x] == undefined) {
      const row = state.answers[y]?.slice() || [];
      console.log("old answers", state.answers);
      console.debug("old row", row)
      row[x] = value;
      let newAnswers = [...state.answers];
      newAnswers[y] = row;
      console.debug("new row", row);
      console.log("new answers", newAnswers);
      return { ...state, answers: newAnswers }
    }
  }
  return state;
}

function clearSelectValue(state: GameState): GameState {
  return setSelectedValue(state, undefined);
}

function moveSelectionLeft(state: GameState): GameState {
  if (state.selected === undefined || state.selected[0] === 0) {
    return state;
  }
  return { ...state, selected: [state.selected[0] - 1, state.selected[1]] }
}

function moveSelectionRight(state: GameState): GameState {
  if (state.selected === undefined || state.selected[0] === 9) {
    return state;
  }
  return { ...state, selected: [state.selected[0] + 1, state.selected[1]] }
}

function moveSelectionUp(state: GameState): GameState {
  if (state.selected === undefined || state.selected[1] === 0) {
    return state;
  }
  return { ...state, selected: [state.selected[0], state.selected[1] - 1] }
}

function moveSelectionDown(state: GameState): GameState {
  if (state.selected === undefined || state.selected[1] === 9) {
    return state;
  }
  return { ...state, selected: [state.selected[0], state.selected[1] + 1] }
}

function check(state: GameState): Mistake[] {
  return checkRows(state).concat(checkColumns(state));
}

function checkRows(state: GameState): Mistake[] {
  return checkRows_(state.clues, state.answers);
}

function checkRows_(clues: Value[][], answers: Value[][]): Mistake[] {
  let mistakes: Mistake[] = [];
  const rows = [];
  for (let i = 0; i < 10; i++) {
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
  const mistakes: Mistake[] = [];
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
  if (zeroes > 5) {
    mistakes.push({
      type: "too-many-in-row",
      value: 0,
      row: ix
    });
  } else if (ones > 5) {
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
        .filter(t => t[0].length === 10 && t[0].every(x => x !== undefined)) // remove incomplete rows
        .sort(), // sort for grouping
    (t1, t2) => eqArray(t1[0], t2[0])
  ).filter(g => g.length > 1)
   .map(g => ({
     type: "duplicate-row",
     rows: g.map(v => v[1])
   }));
}

function checkColumns(state: GameState): Mistake[] {
  // TODO rows to cols in result
  return checkRows_(transpose(state.clues), transpose(state.answers));
}

function makeRow(clues: Value[] | undefined, answers: Value[] | undefined): Value[] {
  clues = clues || [];
  answers = answers || [];
  const row = [];
  for (var i = 0; i < 10; i++) {
    if (clues[i] != undefined) {
      row[i] = clues[i];
    } else {
      row[i] = answers[i];
    }
  }
  return row;
}

function filled(state: GameState) : boolean {
  for (let i = 0; i < 10; i++) {
    if (makeRow(state.clues[i], state.answers[i]).filter(x => x !== undefined).length !== 10) {
      return false;
    }
  }

  return true;
}

function groupBy<T, U>(xs: T[], eq: (v1: T, v2: T) => boolean): T[][] {
  let cur: T[] = [];
  const result = [];
  for (let x of xs) {
    if (cur.length === 0 || eq(cur[0], x)) {
      cur.push(x);
    } else {
      result.push(cur);
      cur = [x];
    }
  }
  if (cur.length > 0) {
    result.push(cur);
  }
  return result;
}

function eqArray<T>(a1: T[], a2: T[]): boolean {
  if (a1.length !== a2.length) {
    return false;
  }

  for (let i = 0; i < a1.length; i++) {
    if (a1[i] !== a2[i]) {
      return false;
    }
  }

  return true;
}

function transpose<T>(xss: T[][]): T[][] {
  const res: T[][] = [];
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      if (xss[y]?.[x] !== undefined) {
        if (res[x] === undefined) {
          res[x] = [];
        }
        res[x][y] = xss[y][x];
      }
    }
  }
  return res;
}

interface GameState {
  clues: Value[][]; // y,x or rows of cells
  answers: Value[][]; // y,x or rows of cells
  selected?: [number, number]; // x,y
  mistakes: Mistake[];
}

type Value = number | undefined;

type Mistake = TooManyInRow | TooManyConsecutiveInRow | DuplicateRow;

interface TooManyInRow {
  type: "too-many-in-row";
  value: number;
  row: number;
}

interface TooManyConsecutiveInRow {
  type: "too-many-consecutive-in-row";
  value: number;
  row: number;
}

interface DuplicateRow {
  type: "duplicate-row";
  rows: number[];
}
