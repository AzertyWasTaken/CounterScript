"use strict";
export function getUsedVars(prog) {
    let usedVars = new Set();

    for (const instr of prog) {
        usedVars.add(instr.var);

        if (instr.type === "while") {
            usedVars = usedVars.union(getUsedVars(instr.body));
        }
    }

    return usedVars;
}