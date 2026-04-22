"use strict";
import {log} from "./log.js";
import {
    getInactiveVars, filterOutVars, canLoopHalt, isLoopNonhalting,
    getUsedVars
} from "./getProgData.js";

// Pure functions for variable manipulation
export function getVar(vars, id) {
    return vars[id] ?? 0;
}

function compareVars(prev, curr, varsSet, loopVarId) {
    return Array.from(varsSet).every((id) => getVar(prev, id) === getVar(curr, id))
    && getVar(curr, loopVarId) >= getVar(prev, loopVarId);
}

function incrementVar(vars, id) {
    vars[id] = getVar(vars, id) + 1;
}

function decrementVar(vars, id) {
    if (getVar(vars, id) <= 1) {delete vars[id];}
    else {vars[id] = getVar(vars, id) - 1;}
}

// Process zero variables in a loop body
function processZeroVars(copyLoop, inactiveVars, vars) {
    let newCopyLoop = copyLoop;

    // Get a set of vars recently set to 0
    const zeroVars = new Set();
    inactiveVars.forEach((varId) => {
        // log(varId)
        if (!vars[varId]) {zeroVars.add(varId);}
    });

    const update = zeroVars.size > 0;

    // Filter for each vars recently set to 0
    if (update) {
        newCopyLoop = filterOutVars(structuredClone(newCopyLoop), zeroVars);
        zeroVars.forEach((varId) => {inactiveVars.delete(varId);});
    }

    return [newCopyLoop, update];
}

export function run(program, maxSteps, deciders = false, vars = {}, steps = 0) {
    function execute(block) {
        for (const instr of block) {
            if (instr.type === "inc") {
                incrementVar(vars, instr.var);
            }
            else if (instr.type === "dec") {
                decrementVar(vars, instr.var);
            }
            else if (instr.type === "while") {
                if (getVar(vars, instr.var) === 0) {continue;}

                const usedWhileVars = getUsedVars(instr.body, "while");

                const inactiveVars = getInactiveVars(instr.body);
                inactiveVars.delete(instr.var);

                let copyLoop = instr.body;

                while (getVar(vars, instr.var) > 0) {
                    const lastVars = {...vars};

                    // Execute the loop body
                    const halted = execute(instr.body);

                    // Check execution status
                    if (!halted) {return halted;}
                    if (steps >= maxSteps) {return null;}

                    const [newCopyLoop, update] =
                    processZeroVars(copyLoop, inactiveVars, vars);
                    copyLoop = newCopyLoop;

                    if (deciders) {
                        // Compare current and previous counters
                        if (compareVars(lastVars, vars, usedWhileVars, instr.var)) {
                            return false;
                        }

                        // Check loop body structure
                        if (update) {
                            if (
                                !canLoopHalt(copyLoop, instr.var)
                                || isLoopNonhalting(copyLoop, instr.var)
                            ) {return false;}
                        }
                    }

                    steps++;
                }
            }
            else {
                throw new Error(`Unknown instruction: ${instr.type}`);
            }
        }

        return true;
    }

    const halted = execute(program);

    return [halted, vars];
}