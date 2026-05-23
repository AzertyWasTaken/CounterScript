"use strict";
import {log} from "./log.js";

// Core recursive search helpers
// ================================================================

// Check if `targetVar` can increase when `program` executes
export function canVarInc(program, targetVar) {
    for (const instr of program) {
        if (instr.type === "inc") {
            if (instr.var === targetVar) return true;
        }
        else if (instr.type === "while") {
            if (!instr.body) return null;

            if (canVarInc(instr.body, targetVar)) return true;
        }
    }

    return false;
}

// Check if for each `var` in `program`, it also has `while var`
// Assume that `program` does not have any undefined loop
export function areEachVarUseful(program) {
    const vars = new Set();
    const whiles = new Set();

    function scan(block) {
        for (const instr of block) {
            vars.add(instr.var);

            if (instr.type === "while") {
                whiles.add(instr.var);
                scan(instr.body);
            }
        }
    }

    scan(program);

    return vars.isSubsetOf(whiles);
}

// Check if program has an undefined loop
export function hasUndefinedLoop(program) {
    for (const instr of program) {
        if (instr.type === "while")
            if (instr.body === undefined || hasUndefinedLoop(instr.body))
                return true;
    }

    return false;
}

// Loop structure deciders
// ================================================================

// Check if a loop is unecessary nested
export function isLoopNested(body, targetVar) {
    if (!body) return null;

    return body.length === 1
    && body[0].type === "while"
    && body[0].var === targetVar;
}
