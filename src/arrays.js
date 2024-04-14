export function groupBy(xs, eq) {
    let cur = [];
    const result = [];
    for (let x of xs) {
        if (cur.length === 0 || eq(cur[0], x)) {
            cur.push(x);
        }
        else {
            result.push(cur);
            cur = [x];
        }
    }
    if (cur.length > 0) {
        result.push(cur);
    }
    return result;
}
export function eqArray(a1, a2, eq) {
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
export function eqMaybe(v1, v2, eq) {
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
export function replicate(n, v) {
    const result = [];
    for (let i = 0; i < n; i++) {
        result.push(v);
    }
    return result;
}
export function transpose(xss) {
    var _a;
    const res = [];
    for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
            if (((_a = xss[y]) === null || _a === void 0 ? void 0 : _a[x]) !== undefined) {
                if (res[x] === undefined) {
                    res[x] = [];
                }
                res[x][y] = xss[y][x];
            }
        }
    }
    return res;
}
export function pad(arr, len, x) {
    const result = arr.slice();
    for (let i = arr.length; i < len; i++) {
        arr.unshift(x);
    }
    return arr;
}
export function setIndex(ix, v, arr) {
    if (ix >= arr.length) {
        const newArr = arr.slice();
        newArr[ix] = v;
        return newArr;
    }
    else {
        return arr.with(ix, v);
    }
}
