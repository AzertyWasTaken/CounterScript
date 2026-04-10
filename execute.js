"use strict";
import {compareObj} from "./compare.js";

export function getVar(vars, index) {
    return vars[index] ?? 0;
}

export function execute(prog, maxSteps, vars = {}, steps = 0) {
    for (const instr of prog) {
        if (instr.type === "inc") {
            vars[instr.var] = getVar(vars, instr.var) + 1;

        } else if (instr.type === "dec") {
            vars[instr.var] = Math.max(getVar(vars, instr.var) - 1, 0);
            if (vars[instr.var] === 0) {delete vars[instr.var];}

        } else if (instr.type === "while") {
            while (getVar(vars, instr.var) > 0) {
                let lastVars = {...vars};
                const result = execute(instr.body, maxSteps, vars, steps);

                if (compareObj(lastVars, vars)) {return {halted: false, vars, steps};}

                steps = result.steps + 1;
                if (steps > maxSteps || !result.halted) {
                    return {halted: null, vars, steps};
                }
            }
        }
    }

    return {halted: true, vars, steps};
}