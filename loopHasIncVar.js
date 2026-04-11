"use strict";
export function loopHasIncVar(prog, targetVar) {
    let usedVars = new Set();

    for (const instr of prog) {
        if (instr.type === "inc") {
            usedVars.add(instr.var);
        }

        if (instr.type === "while") {
            for (const v of loopHasIncVar(instr.body, targetVar)) {
                usedVars.add(v);
            }
        }
    }

    return usedVars;
}