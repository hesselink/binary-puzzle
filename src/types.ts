interface GameState {
  clues: Value[][]; // y,x or rows of cells
  answers: Value[][]; // y,x or rows of cells
  selected?: [number, number]; // x,y
  mistakes: Mistake[];
  showInputPopup: boolean;
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
