"use strict";
import {log} from "./log.js";
import {parse, unparse} from "./parser.js";
import {counters} from "./counters.js";

// Helpers
// ================================================================

export function getCtx(program) {
    return {vars: [], steps: 0, stack: [{block: program, pc: 0}]};
}

// Mutate a to a.intersection(b)
function intersect(a, b) {
    a.forEach((i) => {
        if (!b.has(i)) a.delete(i);
    })
}

// Clone every keys of `stack` items except block
export function cloneStack(stack) {
    const clone = [];

    for (const item of stack) {
        clone.push({
            block: item.block,
            pc: item.pc,
            loopVar: item.loopVar,
            posVars: new Set(item.posVars),
            prevVars: [...item.prevVars],
        });
    }

    return clone;
}

export function getFrame(ctx) {
    return ctx.stack.at(-1);
}

export function getInstruction(frame) {
    return frame.block[frame.pc];
}

// Deciders
// ================================================================

function isTransCycler(currVars, prevVars, posVars) {
    const maxLength = Math.max(currVars.length, prevVars.length);

    for (let i = 0; i < maxLength; i++) {
        const currVal = counters.get(currVars, i);
        const prevVal = counters.get(prevVars, i);

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

// Execute instructions
// ================================================================

function handleProgramEnd(config, ctx, frame) {
    ctx.steps++;

    // Check if loop condition still holds to repeat body
    if (
        frame.loopVar !== undefined
        && !counters.isZero(ctx.vars, frame.loopVar)
    ) {
        // Cycle detection (only if enabled)
        if (config.deciders)
            if (isTransCycler(ctx.vars, frame.prevVars, frame.posVars))
                return false;

        // Go to next iteration
        frame.pc = 0;
        frame.posVars = counters.getPosSet(ctx.vars);
        frame.prevVars = [...ctx.vars];
    } else {
        // End the loop
        ctx.stack.pop();
        if (ctx.stack.length === 0) return true;

        const prevFrame = getFrame(ctx);
        prevFrame.pc++;

        if (prevFrame.posVars)
            intersect(prevFrame.posVars, frame.posVars);
    }

    return null;
}

// Execute `while # {...}` (mutate `ctx`)
function executeWhileInstruction(config, ctx, frame, instr) {
    if (counters.isZero(ctx.vars, instr.var)) return false;

    if (!instr.body) return undefined;

    ctx.stack.push({
        block: instr.body,
        pc: 0,
        loopVar: instr.var,
        posVars: counters.getPosSet(ctx.vars),
        prevVars: [...ctx.vars],
    });

    // Keep running with new frame
    return true;
}

export function executeBasicInstruction(vars, instr, frame = {}) {
    if (instr.type === "inc") {
        counters.inc(vars, instr.var);
    }
    else if (instr.type === "dec") {
        counters.dec(vars, instr.var);
    }
    else {
        throw new Error(`Unknown instruction: ${instr.type}`);
    }

    if (frame.posVars && counters.isZero(vars, instr.var))
        frame.posVars.delete(instr.var);

    return vars;
}

// Run programs
// ================================================================

export function executeNext(config, ctx) {
    // log("State:", ctx);
    const frame = getFrame(ctx);

    // Check if pc have reached the end of the program
    if (frame.pc >= frame.block.length) {
        return handleProgramEnd(config, ctx, frame);
    } else {
        const instr = getInstruction(frame);

        // Execute the instruction
        if (instr.type === "while") {
            const status = executeWhileInstruction(config, ctx, frame, instr);
            if (status === undefined) return undefined;
            // Skip loop if it do not run
            if (status === false) frame.pc++;
        } else {
            executeBasicInstruction(ctx.vars, instr, frame);
            frame.pc++;
        }

        return null;
    }
}

// Execution mutates `ctx`
// Increment step counts when a while-loop iteration is completed
export function execute(config, ctx) {
    // log("Init:", ctx.stack);
    if (ctx.stack.length === 0) return [true, ctx];

    while (ctx.steps < config.maxSteps) {
        const status = executeNext(config, ctx);

        // If `status` is true, `ctx.stack` must be empty
        if (status !== null) return [status, ctx];
    }

    return [null, ctx];
}

export function run(program, config = {maxSteps: 10000, deciders: false}) {
    return execute(config, getCtx(program));
}
