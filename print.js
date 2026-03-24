"use strict";
function toPrintStr(str) {
    return typeof str === "object" ? JSON.stringify(str) : str;
}

export function print() {
    const args = Array.from(arguments);
    console.log(...args.map(toPrintStr));
    return true;
}