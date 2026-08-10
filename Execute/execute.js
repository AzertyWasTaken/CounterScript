"use strict";
import {log} from "../log.js";
import {parse, unparse} from "../parser.js";
import {isTransCycler} from "./decider.js";
import {Counters} from "./counters.js";
import {ExeStack} from "./exeStack.js";

// Mutate a to a.intersection(b)
function intersect(a, b) {
    a.forEach((i) => {
        if (!b.has(i)) a.delete(i);
    })
}

// Execute instructions
// ================================================================

function handleProgramEnd(config, ctx, frame) {
    ctx.steps++;

    // Check if loop condition still holds to repeat body
    if (
        frame.loopVar !== undefined
        && !Counters.isZero(ctx.vars, frame.loopVar)
    ) {
        // Cycle detection (only if enabled)
        if (config.deciders) {
            if (isTransCycler(ctx.vars, frame.prevVars, frame.prevPrevVars, frame.posVars))
                return false;
        }

        // Go to next iteration
        ExeStack.updateFrame(frame, ctx.vars);
    } else {
        // End the loop
        ctx.stack.pop();
        if (ctx.stack.length === 0) return true;

        const prevFrame = ExeStack.getFrame(ctx);
        prevFrame.pc++;

        if (prevFrame.posVars)
            intersect(prevFrame.posVars, frame.posVars);
    }

    return null;
}

// Execute `while # {...}` (mutate `ctx`)
function executeWhileInstruction(config, ctx, frame, instr) {
    if (Counters.isZero(ctx.vars, instr.var)) return false;

    if (!instr.body) return undefined;

    ctx.stack.push(ExeStack.newFrame(instr.body, instr.var, ctx.vars));
    // Keep running with new frame
    return true;
}

export function executeBasicInstr(vars, instr, frame = {}) {
    if (instr.type === "inc") {
        Counters.inc(vars, instr.var);
    }
    else if (instr.type === "dec") {
        Counters.dec(vars, instr.var);
    }
    else {
        throw new Error(`Unknown instruction: ${instr.type}`);
    }

    if (frame.posVars && Counters.isZero(vars, instr.var))
        frame.posVars.delete(instr.var);

    return vars;
}

// Run programs
// ================================================================

export function executeNext(config, ctx) {
    const frame = ExeStack.getFrame(ctx);

    // Check if pc have reached the end of the program
    if (frame.pc >= frame.block.length) {
        return handleProgramEnd(config, ctx, frame);
    } else {
        const instr = ExeStack.getInstruction(frame);

        // Execute the instruction
        if (instr.type === "while") {
            const status = executeWhileInstruction(config, ctx, frame, instr);
            if (status === undefined) return undefined;
            // Skip loop if it do not run
            if (status === false) frame.pc++;
        } else {
            executeBasicInstr(ctx.vars, instr, frame);
            frame.pc++;
        }

        return null;
    }
}

// Execution mutates `ctx`
// Increment step counts when a while-loop iteration is completed
export function execute(config, ctx) {
    if (ctx.stack.length === 0) return [true, ctx];

    while (ctx.steps < config.maxSteps) {
        const status = executeNext(config, ctx);

        // If `status` is true, `ctx.stack` must be empty
        if (status !== null) return [status, ctx];
    }

    return [null, ctx];
}

export function run(program, config = {maxSteps: 10000, deciders: false}) {
    return execute(config, ExeStack.getCtx(program));
}
