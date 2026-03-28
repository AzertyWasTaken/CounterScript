"use strict";
function scan(program) {
    let usedVars = new Set();

    for (const instr of program) {
        if (instr.type === "while") {
            usedVars = usedVars.union(scan(instr.body));

        } else {
            usedVars.add(instr.var);
        }
    }

    return usedVars;
}

export function checkStatements(program) {
    let usedVars = null;

    for (const instr of program) {
        if (instr.type === "while") {
            usedVars = scan(instr.body);

        } else{
            if (usedVars && !usedVars.has(instr.var)) {return false;}
        }
    }

    return true;
}