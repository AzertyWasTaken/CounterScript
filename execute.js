"use strict";
import {getUsedVars, filterOutWhiles, canLoopHalt, isLoopNonhalting} from "./getProgData.js";

function compareObj(a, b) {
    const [ka, kb] = [Object.keys(a), Object.keys(b)];
    return ka.length === kb.length &&
    ka.every((key) => a[key] === b[key]);
}

export function getVar(vars, id) {return vars[id] ?? 0;}

function decideLoopStructure(instr, usedIncVars, currVars) {
    const filtered = filterOutWhiles(instr.body, usedIncVars, currVars);
    return !canLoopHalt(filtered, instr.var)
    || isLoopNonhalting(filtered, instr.var);
}

export function run(program, maxSteps, deciders = false, vars = {}, steps = 0) {
    function execute(block) {
        for (const instr of block) {
            if (instr.type === "inc") {
                vars[instr.var] = getVar(vars, instr.var) + 1;

            } else if (instr.type === "dec") {
                vars[instr.var] = Math.max(getVar(vars, instr.var) - 1, 0);
                if (vars[instr.var] === 0) {delete vars[instr.var];}

            } else if (instr.type === "while") {
                const usedIncVars = getUsedVars(instr.body, "inc");

                while (getVar(vars, instr.var) > 0) {
                    // Store current counters
                    const lastVars = {...vars};

                    // Execute the loop body
                    const halted = execute(instr.body);

                    // Check execution status
                    if (!halted) {return halted;}
                    if (steps >= maxSteps) {return null;}

                    // Decide cyclers and some translated cyclers
                    if (deciders) {
                        const isNonhalting = compareObj(vars, lastVars)
                        || decideLoopStructure(instr, usedIncVars, vars);
                        if (isNonhalting) {return false;}
                    }

                    steps++;
                }

            } else {
                throw new Error(`Unknown instruction: ${instr.type}`);
            }
        }

        return true;
    }

    const halted = execute(program);

    return [halted, vars];
}