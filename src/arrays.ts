export function groupBy<T, U>(xs: T[], eq: (v1: T, v2: T) => boolean): T[][] {
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

export function eqArray<T>(a1: T[], a2: T[], eq?: (v1: T, v2: T) => boolean): boolean {
  if (eq === undefined) {
    eq = (v1, v2) => v1 === v2;
  }
  if (a1.length !== a2.length) {
    return false;
  }

  for (let i = 0; i < a1.length; i++) {
    if (!eq(a1[i], a2[i])) {
      return false;
    }
  }

  return true;
}

export function eqMaybe<T>(v1: T | undefined, v2: T | undefined, eq?: (v1: T, v2: T) => boolean): boolean {
  if (eq === undefined) {
    eq = (v1, v2) => v1 === v2;
  }
  if (v1 == undefined) {
    return v2 == undefined;
  }
  if (v2 == undefined) {
    return false; // v1 isn't undefined, that was checked above
  }
  return eq(v1, v2);
}

export function replicate<T>(n: number, v: T): T[] {
  const result = []
  for (let i = 0; i < n; i++) {
    result.push(v);
  }
  return result;
}

export function transpose<T>(xss: T[][]): T[][] {
  const res: T[][] = [];
  const rowLen = Math.max(...xss.map(xs => (xs ?? []).length));
  for (let y = 0; y < xss.length; y++) {
    for (let x = 0; x < rowLen; x++) {
      if (res[x] === undefined) {
        res[x] = [];
      }
      res[x][y] = xss[y]?.[x];
    }
  }
  return res;
}

export function pad<T>(arr: T[], len: number, x: T) {
  const result = arr.slice();
  for (let i = arr.length; i < len; i++) {
    arr.unshift(x)
  }
  return arr;
}

export function setIndex<T>(ix: number, v: T, arr: T[]) {
  if (ix >= arr.length) {
    const newArr = arr.slice();
    newArr[ix] = v;
    return newArr;
  } else {
    return arr.with(ix, v);
  }
}
