"use strict";
import {log} from "./log.js";

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

export function getPosVars(vars) {
    const set = new Set();
    vars.forEach((v, id) => {
        if (v > 0) set.add(id);
    })
    return set;
}

function assignSet(a, b) {
    b.forEach((i) => a.add(i));
}

// Clone every keys of each stack items except block
export function cloneStack(stack) {
    const clone = [];

    for (const item of clone)
        clone.push({
            block: item.block,
            pc: item.pc,
            loopVar: item.var,
            posVars: new Set(item.posVars),
            prevVars: [...item.prevVars],
        });

    return clone;
}

// Deciders
// ================================================================

function isTransCycler(currVars, prevVars, posVars) {
    const maxLength = Math.max(currVars.length, prevVars.length);

    for (let i = 0; i < maxLength; i++) {
        const currVal = getVar(currVars, i);
        const prevVal = getVar(prevVars, i);

        if (posVars.has(i)) {
            // Other variables must not decrease
            if (currVal < prevVal) return false;
        } else {
            // Variables that became zero must be equal
            if (currVal !== prevVal) return false;
        }
    }

    return true;
}

function isNonhalting(currVars, prevVars, loopVar, posVars) {
    // Loop variable must not decrease (additional safety check)
    if (
        isTransCycler(currVars, prevVars, posVars)
        && getVar(currVars, loopVar) >= getVar(prevVars, loopVar)
    ) return true;
}

// Iterative Execution
// ================================================================

export function exeOp(vars, instr, frame = {}) {
    if (instr.type === "inc") {
        incVar(vars, instr.var);
    }
    else if (instr.type === "dec") {
        decVar(vars, instr.var);
    }
    else {
        throw new Error(`Unknown instruction: ${instr.type}`);
    }

    if (frame.posVars && !isVarPos(vars, instr.var))
        frame.posVars.delete(instr.var);

    return vars;
}

export function execute(config, ctx) {
    while (ctx.steps < config.maxSteps) {
        const frame = ctx.stack.at(-1);
        // log(ctx.vars, frame.pc, frame.block[frame.pc]);

        // Check if pc have reached the end of the program
        if (frame.pc >= frame.block.length) {
            ctx.steps++;

            // Check if loop condition still holds to repeat body
            if (
                frame.loopVar !== undefined
                && isVarPos(ctx.vars, frame.loopVar)
            ) {
                // Cycle detection (only if enabled)
                if (config.deciders)
                    if (isNonhalting(ctx.vars, frame.prevVars, frame.loopVar, frame.posVars))
                        return [false, ctx];

                // Go to next iteration
                frame.pc = 0;
                frame.posVars = getPosVars(ctx.vars);
                frame.prevVars = [...ctx.vars];
            }
            else {
                // End the loop
                ctx.stack.pop();
                if (ctx.stack.length === 0)
                    return [true, ctx];

                const prevFrame = ctx.stack.at(-1);
                prevFrame.pc++;
                if (prevFrame.posVars)
                    assignSet(prevFrame.posVars, frame.posVars);
            }

            continue;
        }

        const instr = frame.block[frame.pc];

        // Execute the instruction
        if (instr.type === "while") {
            if (isVarPos(ctx.vars, instr.var)) {
                if (!instr.body)
                    return [undefined, ctx];

                ctx.stack.push({
                    block: instr.body,
                    pc: 0,
                    loopVar: instr.var,
                    posVars: getPosVars(ctx.vars),
                    prevVars: [...ctx.vars],
                });

                continue;
            }

        } else {
            // Execute the basic operation (inc or dec)
            exeOp(ctx.vars, instr, frame);
        }

        frame.pc++;
    }

    return [null, ctx];
}

export function run(program, config = {maxSteps: 10000, deciders: false}) {
    return execute(config, {vars: [], steps: 0, stack: [{block: program, pc: 0}]});
}