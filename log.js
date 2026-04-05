"use strict";
function strValue(val) {
    if (Array.isArray(val)) {return `[${strArray(val)}]`;}
    if (val instanceof Map) {return `Map(${strMap(val)})`;}
    if (typeof val === "object") {return `{${strObject(val)}}`;}
    return val;
}

function strArray(arr) {
    return arr.map((value) =>
        strValue(value)
    ).join(", ");
}

function strMap(map) {
    return Array.from(map).map(([key, value]) =>
        `${key} => ${strValue(value)}`
    ).join(", ");
}

function strObject(obj) {
    return Object.entries(obj).map(([key, value]) =>
        `${key}: ${strValue(value)}`
    ).join(", ");
}

export function log() {
    const args = Array.from(arguments);
    console.log(...args.map(strValue));
    return true;
}