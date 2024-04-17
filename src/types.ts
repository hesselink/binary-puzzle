interface GameState {
  clues: Value[][]; // y,x or rows of cells. Always fully filled
  answers: Value[][]; // y,x or rows of cells. Rows or cells can be omitted
}

interface AppState {
  stateVersion: number,
  gameState: GameState;
  selected?: [number, number]; // x,y
  showInputPopup: boolean;
  undoStack: Action[];
  redoStack: Action[];
}

// can be null after deserialization...
type Value = number | undefined | null;

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

type Action = SetValue | ClearAll | GenerateNew

type SetValue = {
  type: "set-value",
  position: [number, number],
  oldValue: Value,
  newValue: Value
}

type ClearAll = {
  type: "clear-all",
  selected?: [number, number],
  oldState: GameState,
  newState: GameState
}

type GenerateNew = {
  type: "generate-new",
  selected?: [number, number],
  oldState: GameState,
  newClues: Value[][]
}
