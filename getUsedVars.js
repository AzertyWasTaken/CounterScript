"use strict";
export function getUsedVars(prog) {
    let usedVars = new Set();

    for (const instr of prog) {
        usedVars.add(instr.var);

        if (instr.type === "while") {
            for (const v of getUsedVars(instr.body)) {
                usedVars.add(v);
            }
        }
    }

    return usedVars;
}