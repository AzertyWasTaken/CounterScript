"use strict";
export function compareObj(a, b) {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) {return false;}

    for (const k of ka) {if (a[k] !== b[k]) {return false;}}
    return true;
}