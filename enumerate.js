﻿"use strict";
import {log} from "./log.js";
import {parse, unparse} from "./parser.js";
import {execute, executeBasicInstruction, getVar, isVarPos, getPosVars, cloneStack} from "./execute.js";
import {isLoopNonhalting} from "./isLoopNonhalting.js";
import {isLoopNested, hasUndefinedLoop, areEachVarUseful, hasRowWhileVars, areVarsOrdered} from "./getProgData.js";

function compareInstr(instr, type, varId) {
    return instr.type === type && instr.var === varId;
}

function testLog(parsed, ctx, bodyCtx, ...args) {
    if (
        !ctx.inLoop
        && unparse(ctx.prog) === parsed
    ) {
        log("Context:", ctx, "&", bodyCtx, "&", ...args);
    }
}

/**
 * CounterScript programs enumerator for the Busy Beaver style search space.
 *
 * The main export, `enumerate(len, ctx)`, is a generator that yields tuples:
 *   [program, haltedFlag, vars, steps, maxVar]
 *
 * Various pruning helpers (`skip`*) reduce equivalent/invalid constructions
 * using information from `getProgData.js` and `isLoopNonhalting.js`.
 */

// Helpers
// ================================================================

// Check if programs should be printed after full execution.
export function skipProgram(maxLen, ctx, halted) {
    // Keep only max length prorams
    return ctx.progLen !== maxLen
    // Ignore programs with useless counters
    || halted !== true && areEachVarUseful(ctx.prog) === false
    || hasRowWhileVars(ctx.prog)
    || !areVarsOrdered(ctx.prog);
}

// Check if two adjacent variables are equal.
function compareVars(vars, id) {
    if (id <= 0) return null;
    return getVar(vars, id) === getVar(vars, id - 1);
}

// Prune candidate non-loop instructions.
function skipInstr(ctx, instr) {
    return !ctx.inLoop && (
        // Unused decrements (when the counter equals 0)
        instr.type === "dec" && !isVarPos(ctx.vars, instr.var)
        // Equivalence (adjacent-variable symmetry)
        || compareVars(ctx.vars, instr.var)
    )
    // Equivalence with loops order (disabled)
    // || ctx.allowed && !ctx.allowed.has(instr.var);
}

// Prune candidate while-loop bodies.
// Bodies are enumerated independently, then stitched into the program.
function skipLoopBody(ctx, body, varId) {
    // Nonhalting loop bodies
    return isLoopNonhalting(body.prog, varId) === 1
    // Cannot repeat twice (only enforced outside loops)
    || !ctx.inLoop && !isVarPos(body.vars, varId)
    || isLoopNested(body.prog, varId)
    || hasRowWhileVars(body.prog)
    || !areVarsOrdered(body.prog);
}

// Prune candidate loop-variable choices for a "while" instruction.
function skipLoopVar(ctx, varId) {
    return !ctx.inLoop && (
        // Unused loops (when the counter equals 0)
        !isVarPos(ctx.vars, varId)
        // Equivalence (adjacent-variable symmetry)
        || compareVars(ctx.vars, varId)
    );
}

// Core instructions
// ================================================================

/**
 * Generate all programs of length `len` that begin with a non-loop instruction.
 *
 * `ctx.prog` is mutated via push/pop so we can reuse the same array during
 * backtracking, while the generator yields deeper results via `yield*`.
 */
export function* genInstructions(len, ctx) {
    for (let instrId = ctx.minInstr; instrId < (ctx.maxVar + 1) * 2; instrId++) {
        const instr = {
            // Even ids -> "dec", odd ids -> "inc"
            type: instrId % 2 === 0 ? "dec" : "inc",
            // Each variable gets two instruction ids (dec/inc)
            var: Math.floor(instrId / 2)
        };

        if (skipInstr(ctx, instr)) continue;

        // `maxVar` tracks the highest variable index that is reachable/considered.
        const nextMaxVar = Math.max(instr.var + 1, ctx.maxVar);
        // Apply the instruction to the current state.
        const newVars = executeBasicInstruction([...ctx.vars], instr);

        ctx.prog.push(instr);
        ctx.progLen++;

        // Recurse with one less remaining instruction.
        yield* enumerate(len, {
            ...ctx,
            vars: newVars,
            maxVar: nextMaxVar,
            // Ensure we don't permute instruction order unnecessarily.
            minInstr: instrId,
        });

        ctx.prog.pop();
        ctx.progLen--;
    }
}

// Core while loops
// ================================================================

/**
 * Generate "while" programs for length `len`.
 *
 * For each possible loop variable `varId`, we:
 * - Create a `while` instruction stub pushed into `ctx.prog`
 * - Enumerate all valid body lengths
 * - Either:
 *   - immediately proceed if the loop condition is false in the current state
 *   - or enumerate a concrete loop body via `genLoopBody`
 */
export function* genWhileLoops(len, ctx) {
    for (let varId = 0; varId < (ctx.maxVar + 1); varId++) {
        if (skipLoopVar(ctx, varId)) continue;

        const nextMaxVar = Math.max(varId + 1, ctx.maxVar);

        const instr = {type: "while", var: varId, body: undefined};

        ctx.prog.push(instr);

        const nextCtx = {
            ...ctx,
            // Loop body length is 1 by default.
            progLen: ctx.progLen + 2,
            maxVar: nextMaxVar,
            minInstr: 0,
        };

        // If the loop condition variable is not in the required position,
        // the while-block has no effect; just skip the loop body.
        if (isVarPos(ctx.vars, varId))
            yield* genLoopBody(instr, [], len, nextCtx);
        else
            yield* enumerate(len, nextCtx);

        ctx.prog.pop();
    }
}

// Create a new stack frame so the interpreter can execute the loop.
function appStack(loopVar, stack, bodyCtx) {
    const newStack = cloneStack(stack);

    newStack.push({
        block: bodyCtx.prog,
        pc: 0,
        loopVar: loopVar,
        // Cache positional infos used by deciders.
        posVars: getPosVars(bodyCtx.vars),
        prevVars: [...bodyCtx.vars]
    });

    return newStack;
}

function exeLoop(bodyHalted, bodyCtx, instrVar, stack) {
    // Check if the body enumeration halted and the loop condition still holds.
    const shouldExec = bodyHalted === true
    && isVarPos(bodyCtx.vars, instrVar);

    // Execute the loop.
    return shouldExec
    ? execute({maxSteps: 100, deciders: true}, {
        vars: [...bodyCtx.vars],
        steps: bodyCtx.steps,
        stack: appStack(instrVar, stack, bodyCtx)
    })
    : [bodyHalted, {
        vars: [...bodyCtx.vars],
        steps: bodyCtx.steps,
        stack: stack
    }];
}

/**
 * Enumerate and simulate loop bodies for a specific `while` instruction.
 *
 * Parameters:
 * - `instr`: the outer while instruction whose `.len` is known and `.body`
 *   will be filled in during enumeration
 * - `stack`: an execution stack representing nested loop frames
 * - `len`: remaining program length after the loop body portion
 * - `ctx`: outer enumeration context (program/progress info)
 */
function* genLoopBody(instr, stack, len, ctx) {
    ctx.steps++;
    ctx.progLen--;
    for (
        // Enumerate the loop body itself; recursion is marked as `inLoop`.
        const [bodyHalted, bodyCtx] of enumerate(len - ctx.progLen, {
            ...ctx,
            prog: [],
            progLen: 0,
            inLoop: true,
        })
    ) {
        if (skipLoopBody(ctx, bodyCtx, instr.var)) continue;
    
        const [halted, state] = exeLoop(bodyHalted, bodyCtx, instr.var, stack);
        instr.body = bodyCtx.prog;

        // Ignore loops that have unused loops.
        if (halted === true && !ctx.inLoop && hasUndefinedLoop(ctx.prog)) continue;

        // testLog(
        //     "A++; while A {while A {A++;}}",
        //     ctx, bodyCtx, bodyHalted, instr.var, halted, state
        // );

        // Create context for enumerating tail
        const nextCtx = {
            ...ctx,
            progLen: ctx.progLen + bodyCtx.progLen,
            vars: state.vars,
            steps: state.steps,
            // Max var after concatenating loop body with the remaining tail.
            maxVar: Math.max(bodyCtx.maxVar, ctx.maxVar),
        };

        if (halted === true) {
            // Fully halted: enumerate the remainder (tail) under the final state.
            yield* enumerate(len, nextCtx);
        }
        else if (halted === undefined) {
            // Execution is "in progress" inside the stack: expand the next loop.
            // Instruction that is pointed to by the top frame's pc.
            const frame = state.stack.at(-1);
            const loopInstr = frame.block[frame.pc];

            yield* genLoopBody(loopInstr, state.stack, len, nextCtx);

            // Important: clear `.body` before continuing sibling enumerations.
            loopInstr.body = undefined;
        }
        else {
            // Terminal case: no more instructions left; yield final program/state.
            yield [halted, nextCtx];
        }
    }
}

// Main functions
// ================================================================

/**
 * Enumerate all programs of exactly `len` instructions.
 *
 * `ctx` holds the current partial program (`prog`),
 * machine state (`vars`, `steps`), and bounds/pruning controls (`maxVar`, `minInstr`, `inLoop`).
 */
export function* enumerate(len, ctx = {
    prog: [], vars: [], steps: 0,
    progLen: 0, maxVar: 0,
    minInstr: 0, inLoop: false,
}) {
    // `ctx` must not mutate when enumerating loop bodies.
    if (ctx.progLen > 0) yield [true, ctx];

    // Append a simple instruction.
    if (ctx.progLen + 1 <= len) {
        yield* genInstructions(len, ctx);

        // Append a while loop.
        if (ctx.progLen + 2 <= len)
            yield* genWhileLoops(len, ctx);
    }
}
