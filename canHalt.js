"use strict";
function hasDec(prog, targetVar) {
    for (const instr of prog) {
        if (instr.type === "dec") {
            if (instr.var === targetVar) {return true;}

        } else if (instr.type === "while") {
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