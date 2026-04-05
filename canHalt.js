"use strict";
export function hasDec(prog, targetVar) {
    for (let index = prog.length - 1; index >= 0; index--) {
        const instr = prog[index];

        if (instr.var === targetVar) {return instr.type !== "inc";}

        if (instr.type === "while") {
            if (hasDec(instr.body, targetVar)) {return true;}
        }
    }

    return false;
}

export function canHalt(prog) {
    for (const instr of prog) {
        if (instr.type === "while") {
            if (
                !hasDec(instr.body, instr.var) ||
                !canHalt(instr.body)
            ) {return false;}
        }
    }

    return true;
}