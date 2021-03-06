const GRIDSIZE = 800;
const BOXWIDTH = GRIDSIZE / 10;
const u = undefined;
const defaultState: GameState =
  { clues: [ [1,u,u,u,u,u,u,u,1]
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
    mistakes: [],
    showInputPopup: false,
  };

window.addEventListener("DOMContentLoaded", e => {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(0.5, 0.5);

  let state = loadState();

  if (location.hash) {
    state = newStateFromHash(location.hash.substring(1));
  }

  window.addEventListener("hashchange", e => {
    state = newStateFromHash(location.hash.substring(1));
    render(ctx, state);
  });

  render(ctx, state);

  canvas.addEventListener("click", e => {
    state = setSelectedMouse(state, e);
    saveState(state);
    render(ctx, state);
  });

  canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    state = setSelectedTouch(state, e);
    saveState(state);
    render(ctx, state);
  });

  document.addEventListener("keydown", e => {
    state = handleKeyPress(state, e);
    saveState(state);
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

  const clearBtn = document.getElementById("clear") as HTMLButtonElement;
  clearBtn.addEventListener("click", e => {
    const ok = confirm("Weet je zeker dat je alles wil wissen?");
    if (ok) {
      state = defaultState;
      saveState(state);
      render(ctx, state);
    }
  });

  const zeroBtn = document.getElementById("input-zero") as HTMLButtonElement;
  zeroBtn.addEventListener("click", e => {
    e.stopPropagation();
    e.preventDefault();
    state = { ...setSelectedValue(state, 0), showInputPopup: false };
    render(ctx, state);
  });

  const oneBtn = document.getElementById("input-one") as HTMLButtonElement;
  oneBtn.addEventListener("click", e => {
    state = { ...setSelectedValue(state, 1), showInputPopup: false };
    render(ctx, state);
  });

  const inputClearBtn = document.getElementById("input-clear") as HTMLButtonElement;
  inputClearBtn.addEventListener("click", e => {
    state = { ...clearSelectValue(state), showInputPopup: false };
    render(ctx, state);
  });
});

function loadState(): GameState {
  try {
    const storedState = localStorage.getItem("gameState");
    if (storedState !== null) {
      return JSON.parse(storedState);
    }
  } catch (e) {
  }

  return defaultState;
}

function saveState(state: GameState): void {
  localStorage.setItem("gameState", JSON.stringify(state));
}

function render(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.clearRect(0, 0, GRIDSIZE, GRIDSIZE);
  drawGrid(ctx);
  drawState(ctx, state);
  showInputPopup(state);
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

function showInputPopup(state: GameState) {
  if (!state.selected) {
    return;
  }
  const inputPopup = document.getElementById("input-popup")!;
  const inputClasses = inputPopup.classList;
  if (state.showInputPopup) {
    inputClasses.add("visible");
  } else {
    inputClasses.remove("visible");
  }
  const [x,y] = state.selected;
  const newLeft = x * BOXWIDTH;
  const newTop = y * BOXWIDTH;
  inputPopup.style.left = newLeft + "px";
  inputPopup.style.top = newTop + "px";
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
};

function setSelectedMouse(state: GameState, e: MouseEvent): GameState {
  return setSelected(state, e.offsetX, e.offsetY);
}

function setSelectedTouch(state: GameState, e: TouchEvent): GameState {
  if (state.showInputPopup) {
    return { ...state, showInputPopup: false }
  }
  const rect = (e.target! as Element).getBoundingClientRect();
  const bodyRect = document.body.getBoundingClientRect();
  const offsetX = e.changedTouches[0].pageX - (rect.left - bodyRect.left);
  const offsetY = e.changedTouches[0].pageY - (rect.top - bodyRect.top);
  return { ...setSelected(state, offsetX, offsetY), showInputPopup: true };
}

function setSelected(state: GameState, offsetX: number, offsetY: number): GameState {
  const x = Math.floor(offsetX / BOXWIDTH);
  const y = Math.floor(offsetY / BOXWIDTH);
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

function newStateFromHash(hash: string): GameState {
  const newClues = decodeClues(hash);
  return {
    clues: newClues,
    answers: [],
    selected: undefined,
    mistakes: [],
    showInputPopup: false,
  }
}

function encodeClues(clues: Value[][]): string {
  let row = "";
  let str = "";
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      row += clueToTernary(clues[y]?.[x]);
    }
    console.log("row", row, parseInt(row, 3))
    str += encodeRowNum(parseInt(row, 3));
    row = "";
  }
  return str;
}

function clueToTernary(clue: number | undefined): string {
  return clue === undefined ? "2" : ("" + clue);
}

function encodeRowNum(rowNum: number): string {
  let str = ""
  while (rowNum !== 0) {
    const part = rowNum % 64;
    console.log("encoding", part, "to", numToChar(part));
    str += numToChar(part);
    rowNum = rowNum >> 6;
  }
  return str;
}

function numToChar(num: number): string {
  return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"[num];
}

function decodeClues(input: string): Value[][] {
  const rows: Value[][] = [];
  while (input !== "") {
    const num = decodeRowNum(input.substring(0, 3));
    rows.push(rowNumToRow(num));
    input = input.substring(3);
  }
  return rows;
}

function decodeRowNum(input: string): number {
  let val = 0;
  let ix = 0;
  while (input !== "") {
    const chr = input.substring(0, 1);
    console.log("decoding", chr);
    const num = charToNum(chr);
    console.log("decoded", num);
    val += num << ix;
    ix += 6;
    input = input.substring(1);
  }
  return val;
}

function rowNumToRow(num: number): Value[] {
  const vals: Value[] = [];
  for (let chr of num.toString(3)) {
    vals.push(chr === "2" ? undefined : parseInt(chr));
  }
  pad(vals, 10, 0);
  return vals;
}

function charToNum(chr: string): number {
  return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".indexOf(chr);
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

function pad<T>(arr: T[], len: number, x: T) {
  const result = arr.slice();
  for (let i = arr.length; i < len; i++) {
    arr.unshift(x)
  }
  return arr;
}

interface GameState {
  clues: Value[][]; // y,x or rows of cells
  answers: Value[][]; // y,x or rows of cells
  selected?: [number, number]; // x,y
  mistakes: Mistake[];
  showInputPopup: boolean;
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
