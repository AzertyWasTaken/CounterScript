"use strict";
import {loopHasIncVar} from "./loopHasIncVar.js";

export function isLoopUseful(prog, targetVar) {
    for (let index = prog.length - 1; index >= 0; index--) {
        const instr = prog[index];

        if (instr.type === "while") {
            if (
                instr.var === targetVar ||
                !isLoopUseful(instr.body, targetVar)
            ) {
                return false;

            } else if (loopHasIncVar(instr.body).has(targetVar)) {
                return true;
            }
        }
    }

    return true;
}