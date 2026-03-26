"use strict";
function hasDec(prog, targetVar) {
    for (let index = prog.length - 1; index >= 0; index--) {
        const instr = prog[index];

        if (instr.type === "inc") {
            if (instr.var === targetVar) {return false;}

        } else if (instr.type === "dec") {
            if (instr.var === targetVar) {return true;}

        } else if (instr.type === "while") {
            if (instr.var === targetVar) {return true;}

            if (hasDec(instr.body, targetVar)) {return true;}
        }

        if (instr.var === targetVar) {return instr.type !== "inc";}
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