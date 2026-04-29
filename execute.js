"use strict";
import {log} from "./log.js";
import {
    getInactiveVars, filterOutVars, isLoopNonhalting, getUsedVars
} from "./getProgData.js";

// Helpers
// ================================================================

export function getVar(vars, id) {
    return vars[id] ?? 0;
}

export function incVar(vars, id) {
    vars[id] = getVar(vars, id) + 1;
}

export function decVar(vars, id) {
    vars[id] = Math.max(getVar(vars, id) - 1, 0);
}

export function isVarPos(vars, id) {
    return vars[id] > 0;
}

function assignSet(a, b) {
    b.forEach((i) => a.add(i));
}

// Deciders
// ================================================================

function isTransCycler(prevVars, currVars, newlyZeroVars) {
    const maxLength = Math.max(prevVars.length, currVars.length);

    for (let i = 0; i < maxLength; i++) {
        const prevVal = getVar(prevVars, i);
        const currVal = getVar(currVars, i);

        if (newlyZeroVars.has(i))
            // Variables that became zero must be equal
            if (prevVal !== currVal) return false;

        else
            // Other variables must not decrease
            if (prevVal > currVal) return false;
    }

    return true;
}

function isNonhalting(prevVars, currVars, instr, newlyZeroVars) {
    // Loop variable must not decrease (additional safety check)
    if (
        isTransCycler(prevVars, currVars, newlyZeroVars)
        && getVar(currVars, instr.var) >= getVar(prevVars, instr.var)
    ) return true;
}

// Block Execution
// ================================================================

function runWhileLoop(instr, vars, ctx, zeroVars) {
    // Skip if loop condition is false
    if (!isVarPos(vars, instr.var)) return true;

    // Execute loop iterations
    do {
        const newlyZeroVars = new Set();
        const prevVars = [...vars];

        // Execute the loop body
        const halted = runBlock(instr.body, vars, ctx, newlyZeroVars);
        assignSet(zeroVars, newlyZeroVars);
        if (!isVarPos(vars, instr.var)) return true;

        // Check execution status
        if (!halted) return halted;
        if (ctx.steps >= ctx.maxSteps) return null;

        // Cycle detection (only if enabled)
        if (ctx.deciders)
            if (isNonhalting(prevVars, vars, instr, newlyZeroVars))
                return false;

        ctx.steps++;
    }
    while (isVarPos(vars, instr.var))

    return true;
}

function runInstr(instr, vars, ctx, newlyZeroVars) {
    if (instr.type === "while")
        return runWhileLoop(instr, vars, ctx, newlyZeroVars);

    if (instr.type === "inc")
        incVar(vars, instr.var);

    else if (instr.type === "dec")
        decVar(vars, instr.var);

    else throw new Error(`Unknown instruction: ${instr.type}`);

    if (!isVarPos(vars, instr.var))
        newlyZeroVars.add(instr.var);

    return true;
}

function runBlock(block, vars, ctx, newlyZeroVars = new Set()) {
    for (const instr of block) {
        const halted = runInstr(instr, vars, ctx, newlyZeroVars);
        if (halted !== true)
            return halted;
    }

    return true;
}

export function run(program, maxSteps, deciders = false, vars = [], steps = 0) {
    // Create execution context (should not clone during recursion)
    const ctx = {
        deciders: deciders,
        maxSteps: maxSteps,
        steps: steps
    };

    const halted = runBlock(program, vars, ctx);

    return [halted, vars];
}