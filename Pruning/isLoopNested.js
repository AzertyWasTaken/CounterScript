"use strict";
import {hasWhileLoop} from "./scanner.js";

// Check if a loop is unecessary nested
export function isLoopNested(body, loopVars) {
    if (!body) return null;
    if (body.length !== 1) return false;

    const instr = body[0];
    if (instr.type !== "while") return false;

    if (loopVars.has(instr.var)) return true;
    if (!hasWhileLoop(instr.body, loopVars)) return true;

    loopVars.add(instr.var);
    return isLoopNested(instr.body, loopVars);
}
