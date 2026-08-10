"use strict";
import {hasWhileLoop} from "./scanner.js";

// Check if a loop is unecessary nested
export function isLoopNested(body, loopVars) {
    if (!body) return false;
    if (body.length !== 1) return false;

    const instr = body[0];
    if (instr.type !== "while") return false;

    // Check if nested loop is cyclic
    if (loopVars.has(instr.var)) return true;

    // Check is nested loop is equivalent
    const hasWhileVar = hasWhileLoop(instr.body, loopVars);
    if (hasWhileVar === false) return true;

    loopVars.add(instr.var);
    return isLoopNested(instr.body, loopVars);
}
