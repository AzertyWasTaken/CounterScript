"use strict";
import {log} from "./log.js";
import {
    getInactiveVars, filterOutVars, canLoopHalt, isLoopNonhalting,
    getUsedVars
} from "./getProgData.js";

// Check if the counters in varsSet has changed
function compareVars(prev, curr, varsSet) {
    return Array.from(varsSet).every((id) =>
        getVar(prev, id) === getVar(curr, id)
    );
}

// Process zero variables in a loop body
function processZeroVars(data, vars) {
    // Get a set of vars recently set to 0
    const zeroVars = new Set();
    data.inactiveVars.forEach((varId) => {
        if (!vars[varId]) zeroVars.add(varId);
    });

    const update = zeroVars.size > 0;

    // Filter for each vars recently set to 0
    if (update) {
        data.copyLoop = filterOutVars(structuredClone(data.copyLoop), zeroVars);
        zeroVars.forEach((varId) => data.inactiveVars.delete(varId));
    }

    return update;
}

function isNonhalting(data, lastVars, vars, instr, update) {
    // Compare current and previous counters
    if (
        compareVars(lastVars, vars, data.usedWhileVars)
        && getVar(vars, instr.var) >= getVar(lastVars, instr.var)
    ) return true;

    // Check loop body structure after optimization
    if (update) {
        if (
            !canLoopHalt(data.copyLoop, instr.var) ||
            isLoopNonhalting(data.copyLoop, instr.var)
        ) return true;
    }
}

// Pure functions for variable manipulation
export function getVar(vars, id) {
    return vars[id] ?? 0;
}

export function incrementVar(vars, id) {
    vars[id] = getVar(vars, id) + 1;
}

export function decrementVar(vars, id) {
    if (getVar(vars, id) <= 1) {delete vars[id];}
    else {vars[id] = getVar(vars, id) - 1;}
}

function executeWhileLoop(instr, vars, ctx, execute) {
    // Skip if loop condition is false
    if (getVar(vars, instr.var) === 0) return true;

    // Get optimization data for this loop
    const data = {
        usedWhileVars: getUsedVars(instr.body, "while"),
        inactiveVars: getInactiveVars(instr.body),
        copyLoop: instr.body,
    }

    data.inactiveVars.delete(instr.var);

    // Execute loop iterations
    while (getVar(vars, instr.var) > 0) {
        const lastVars = {...vars};

        // Execute the loop body
        const halted = execute(instr.body);
        if (getVar(vars, instr.var) === 0) return true;

        // Check execution status
        if (!halted) return halted;
        if (ctx.steps >= ctx.maxSteps) return null;

        // Optimize loop by removing irrelevant instructions
        const update = processZeroVars(data, vars);

        // Cycle detection (only if enabled)
        if (
            ctx.deciders
            && isNonhalting(data, lastVars, vars, instr, update)
        ) return false;

        ctx.steps++;
    }

    return true;
}

export function run(program, maxSteps, deciders = false, vars = {}, steps = 0) {
    // Create execution context
    const ctx = {
        steps: steps,
        maxSteps: maxSteps,
        deciders: deciders
    };

    function execute(block) {
        for (const instr of block) {
            if (instr.type === "inc") {
                incrementVar(vars, instr.var);
            }
            else if (instr.type === "dec") {
                decrementVar(vars, instr.var);
            }
            else if (instr.type === "while") {
                const result = executeWhileLoop(instr, vars, ctx, execute);

                if (result !== true) return result;
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