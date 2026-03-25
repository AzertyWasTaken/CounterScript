"use strict";
export function execute(prog, maxSteps, vars = {}, steps = 0) {
    for (const instr of prog) {
        if (instr.type === "inc") {
            vars[instr.var] = (vars[instr.var] ?? 0) + 1;

        } else if (instr.type === "dec") {
            vars[instr.var] = Math.max((vars[instr.var] ?? 0) - 1, 0);

        } else if (instr.type === "while") {
            while ((vars[instr.var] ?? 0) > 0) {
                const result = execute(instr.body, maxSteps, vars, steps);

                vars = result.vars;
                steps = result.steps + 1;

                if (steps > maxSteps || !result.halted) {
                    return {halted: false, vars, steps};
                }
            }
        }
    }

    return {halted: true, vars, steps};
}