"use strict";
import {getUsedVars} from "./getUsedVars.js";

export function isLoopUseful(prog, targetVar) {
    for (let index = prog.length - 1; index >= 0; index--) {
        const instr = prog[index];

        if (instr.type === "while") {
            if (instr.var === targetVar) {
                return false;

            } else if (getUsedVars(instr.body).has(targetVar)) {
                return true;
            }
        }
    }

    return true;
}