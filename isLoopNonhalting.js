"use strict";
export function analyzeLoop(program, targetVar, loopVar = targetVar) {
    if (!program) return -1;

    for (let i = program.length - 1; i >= 0; i--) {
        const instr = program[i];

        if (instr.type === "inc") {
            if (instr.var === targetVar) return 1;
        }
        else if (instr.type === "dec") {
            if (instr.var === targetVar) return -1;
        }
        else if (instr.type === "while") {
            const bodyRes = analyzeLoop(instr.body, targetVar, instr.var);

            if (bodyRes === -1) {
                return -1;
            }
            else if (bodyRes === 1) {
                if (analyzeLoop(program.slice(0, i), instr.var, loopVar) === 1)
                    return 1;
            }
        }
    }

    return targetVar === loopVar ? 1 : 0;
}

export function isLoopNonhalting(program, loopVar) {
    const analysis = analyzeLoop(program, loopVar);
    return analysis === 1 || analysis === 0;
}
