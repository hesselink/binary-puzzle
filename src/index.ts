import "./types.js"
import { solve } from "./solver.js"
import { groupBy, eqArray, transpose, pad } from "./arrays.js"
import { check, filled} from "./check.js"
import { generate } from "./generator.js"
import { setValue } from "./grid.js"

const GRIDSIZE = 800;
const u = undefined;
const defaultGameState: GameState =
  { clues: [ [1,u,u,u,u,u,u,u,1,u]
           , [u,u,u,0,u,1,1,u,u,u]
           , [0,u,u,0,u,u,1,0,u,u]
           , [u,u,u,u,1,u,u,u,0,0]
           , [0,1,u,0,u,u,u,u,u,u]
           , [u,u,1,u,u,u,u,0,0,u]
           , [u,u,u,u,u,u,u,1,u,u]
           , [0,u,u,1,1,u,u,u,u,1]
           , [u,u,u,u,1,u,0,0,u,1]
           , [u,u,1,u,u,u,u,u,u,u]
           ],
    answers: [],
  };
const defaultState: AppState =
  { stateVersion: 1,
    gameState: defaultGameState,
    selected: undefined,
    showInputPopup: false,
    undoStack: [],
    redoStack: []
  }

window.addEventListener("DOMContentLoaded", e => {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(0.5, 0.5);

  let state: AppState = loadState();

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
    const mistakes = check(state.gameState);
    if (mistakes.length > 0) {
      alert("Dat ziet er niet goed uit...");
    } else if (filled(state.gameState)) {
      alert("Helemaal goed!");
    } else {
      alert("Je bent op de goede weg!");
    }
    console.log("Mistakes", mistakes);
  });

  const clearBtn = document.getElementById("clear") as HTMLButtonElement;
  clearBtn.addEventListener("click", e => {
    const newState = { ...defaultGameState, clues: state.gameState.clues }
    state = { ...defaultState,
              gameState: newState,
              undoStack: [ { type: "clear-all",
                             selected: state.selected,
                             oldState: state.gameState,
                             newState: newState
                           },
                           ...state.undoStack
                         ]
            };
    saveState(state);
    render(ctx, state);
  });

  /*
  const solveBtn = document.getElementById("solve") as HTMLButtonElement;
  solveBtn.addEventListener("click", e => {
    const solved = solve(state.clues);
    state = { ...state, answers: solved };
    saveState(state);
    render(ctx, state);
  });
  */

  const generateBtn = document.getElementById("generate") as HTMLButtonElement;
  generateBtn.addEventListener("click", e => {
    const sizeSelect = document.getElementById("grid-size") as HTMLSelectElement;
    const selectedSize = +sizeSelect.options[sizeSelect.selectedIndex].value;
    const generated = generate(selectedSize);
    state = { ...state,
              gameState: { ...state.gameState, clues: generated, answers: [] },
              undoStack: [ { type: "generate-new",
                             selected: state.selected,
                             oldState: state.gameState,
                             newClues: generated
                           },
                           ...state.undoStack
                         ]
            };
    saveState(state);
    render(ctx, state);
  });

  const undoBtn = document.getElementById("undo") as HTMLButtonElement;
  undoBtn.addEventListener("click", e => {
    state = undoAction(state);
    saveState(state);
    render(ctx, state);
  });

  const redoBtn = document.getElementById("redo") as HTMLButtonElement;
  redoBtn.addEventListener("click", e => {
    state = redoAction(state);
    saveState(state);
    render(ctx, state);
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

function loadState(): AppState {
  try {
    const storedState = localStorage.getItem("gameState");
    if (storedState !== null) {
      const deserialized = JSON.parse(storedState);
      return migrate(deserialized);
    }
  } catch (e) {
  }

  return defaultState;
}

function saveState(state: AppState): void {
  localStorage.setItem("gameState", JSON.stringify(state));
}

function migrate(deserialized: any): AppState {
  if (deserialized.stateVersion === 1) {
    return deserialized;
  } else if (!Object.hasOwn(deserialized, "stateVersion")) {
    return { stateVersion: 1,
      gameState: { clues: deserialized.clues,
                   answers: deserialized.answers
                 },
      selected: deserialized.selected,
      showInputPopup: deserialized.showInputPopup,
      undoStack: [],
      redoStack: []
    }
  } else {
    console.error("Unknown state", deserialized);
    return defaultState;
  }
}

function render(ctx: CanvasRenderingContext2D, state: AppState) {
  ctx.clearRect(0, 0, GRIDSIZE, GRIDSIZE);
  drawGrid(ctx, state.gameState.clues.length);
  drawState(ctx, state);
  showInputPopup(state);
}

function drawState(ctx: CanvasRenderingContext2D, state: AppState): void {
  const BOXWIDTH = GRIDSIZE / state.gameState.clues.length;
  if (state.selected != undefined) {
    let [x, y] = state.selected;
    ctx.fillStyle = "yellow";
    ctx.fillRect(x * BOXWIDTH + 1, y * BOXWIDTH + 1, BOXWIDTH - 2, BOXWIDTH - 2);
  }

  const size = state.gameState.clues.length;
  const offsetX = 0.35
  const offsetY = 0.70
  const fontSize = Math.floor(480 / size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const answer = state.gameState.answers[y]?.[x];
      if (answer != undefined) {
        ctx.font = fontSize + "px Arial"
        ctx.fillStyle = "blue";
        ctx.fillText("" + answer, BOXWIDTH * (x + offsetX), BOXWIDTH * (y + offsetY));
      }

      const clue = state.gameState.clues[y]?.[x];
      if (clue != undefined) {
        ctx.font = fontSize + "px Arial"
        ctx.fillStyle = "black";
        ctx.fillText("" + clue, BOXWIDTH * (x + offsetX), BOXWIDTH * (y + offsetY));
      }
    }
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, boardSize: number): void {
  for (let i=0; i<=boardSize; i++) {
    const px = i * GRIDSIZE/boardSize;
    line(ctx, 0, px, GRIDSIZE, px);
    line(ctx, px, 0, px, GRIDSIZE);
  }
}

function showInputPopup(state: AppState) {
  const BOXWIDTH = GRIDSIZE / state.gameState.clues.length;
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

function setSelectedMouse(state: AppState, e: MouseEvent): AppState {
  return setSelected(state, e.offsetX, e.offsetY);
}

function setSelectedTouch(state: AppState, e: TouchEvent): AppState {
  if (state.showInputPopup) {
    return { ...state, showInputPopup: false }
  }
  const rect = (e.target! as Element).getBoundingClientRect();
  const bodyRect = document.body.getBoundingClientRect();
  const offsetX = e.changedTouches[0].pageX - (rect.left - bodyRect.left);
  const offsetY = e.changedTouches[0].pageY - (rect.top - bodyRect.top);
  return { ...setSelected(state, offsetX, offsetY), showInputPopup: true };
}

function setSelected(state: AppState, offsetX: number, offsetY: number): AppState {
  const BOXWIDTH = GRIDSIZE / state.gameState.clues.length;
  const x = Math.floor(offsetX / BOXWIDTH);
  const y = Math.floor(offsetY / BOXWIDTH);
  if (x > state.gameState.clues[0].length - 1 || y > state.gameState.clues.length - 1) {
    return state;
  }
  console.debug("Setting selected to", [x,y]);
  return { ...state, selected: [x, y] }
}

function handleKeyPress(state: AppState, e: KeyboardEvent): AppState {
  switch(e.key) {
    case "0":
      return setSelectedValue(state, 0);
      break;
    case "1":
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
    case "z":
      if (e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.shiftKey) {
          return redoAction(state);
        } else {
          return undoAction(state);
        }
      }
    default:
      console.log("keypress", e.code);
  }
  return state;
}

function setSelectedValue(state: AppState, value: Value): AppState {
  if (state.selected != undefined) {
    const [x, y] = state.selected;
    if (state.gameState.clues[y]?.[x] == undefined) {
      const row = state.gameState.answers[y]?.slice() || [];
      console.log("old answers", state.gameState.answers);
      console.debug("old row", row)
      const oldValue = row[x];
      if (oldValue === value) {
        return state;
      }
      row[x] = value;
      let newAnswers = [...state.gameState.answers];
      newAnswers[y] = row;
      console.debug("new row", row);
      console.log("new answers", newAnswers);
      return { ...state,
               gameState: { ...state.gameState, answers: newAnswers },
               undoStack: [{ type: "set-value", position: [x, y], oldValue: oldValue, newValue: value }, ...state.undoStack ],
               redoStack: []
             }
    }
  }
  return state;
}

function clearSelectValue(state: AppState): AppState {
  return setSelectedValue(state, undefined);
}

function moveSelectionLeft(state: AppState): AppState {
  if (state.selected === undefined || state.selected[0] === 0) {
    return state;
  }
  return { ...state, selected: [state.selected[0] - 1, state.selected[1]] }
}

function moveSelectionRight(state: AppState): AppState {
  if (state.selected === undefined || state.selected[0] === state.gameState.clues[0].length - 1) {
    return state;
  }
  return { ...state, selected: [state.selected[0] + 1, state.selected[1]] }
}

function moveSelectionUp(state: AppState): AppState {
  if (state.selected === undefined || state.selected[1] === 0) {
    return state;
  }
  return { ...state, selected: [state.selected[0], state.selected[1] - 1] }
}

function moveSelectionDown(state: AppState): AppState {
  if (state.selected === undefined || state.selected[1] === state.gameState.clues.length - 1) {
    return state;
  }
  return { ...state, selected: [state.selected[0], state.selected[1] + 1] }
}

function undoAction(state: AppState): AppState {
  const action = state.undoStack[0];
  if (action === undefined) {
    return state;
  }
  switch (action.type) {
    case "set-value":
      const [x, y] = action.position;
      return { ...state,
        gameState: { ...state.gameState,
                     answers: setValue(y, x, action.oldValue, state.gameState.answers)
                   },
        selected: action.position,
        undoStack: state.undoStack.slice(1),
        redoStack: [action, ...state.redoStack]
      }
    case "clear-all":
      return { ...defaultState,
        gameState: action.oldState,
        selected: action.selected,
        undoStack: state.undoStack.slice(1),
        redoStack: [action, ...state.redoStack]
      }
    case "generate-new":
      return { ...defaultState,
        gameState: action.oldState,
        selected: action.selected,
        undoStack: state.undoStack.slice(1),
        redoStack: [action, ...state.redoStack]
      }
    default:
      console.error("Unknown action", action);
      return state;
  }
}

function redoAction(state: AppState): AppState {
  console.log("redoAction")
  const action = state.redoStack[0];
  if (action === undefined) {
    return state;
  }
  switch (action.type) {
    case "set-value":
      const [x, y] = action.position;
      return { ...state,
        gameState: { ...state.gameState,
                     answers: setValue(y, x, action.newValue, state.gameState.answers)
                   },
        selected: action.position,
        undoStack: [action, ...state.undoStack],
        redoStack: state.redoStack.slice(1)
      }
    case "clear-all":
      return { ...defaultState,
        gameState: { ...defaultGameState, clues: state.gameState.clues },
        undoStack: [{ ...action, selected: state.selected} , ...state.undoStack],
        redoStack: state.redoStack.slice(1)
      }
    case "generate-new":
      return { ...defaultState,
        gameState: { ...defaultGameState, clues: action.newClues },
        undoStack: [{ ...action, selected: state.selected} , ...state.undoStack],
        redoStack: state.redoStack.slice(1)
      }
    default:
      console.error("Unknown action", action);
      return state;
  }
}

function newStateFromHash(hash: string): AppState {
  const newClues = decodeClues(hash);
  return { ...defaultState, gameState: { ...defaultGameState, clues: newClues } }
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

function clueToTernary(clue: Value): string {
  return clue == undefined ? "2" : ("" + clue);
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
