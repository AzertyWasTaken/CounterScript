"use strict";
import {log} from "./log.js";
import {execute, exeOp, getVar, isVarPos, getPosVars, cloneStack} from "./execute.js";
import {isLoopNonhalting} from "./isLoopNonhalting.js";
import {canRepeatTwice, isLoopNested} from "./getProgData.js";

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

// Check if two adjacent variables are equal.
function compareVars(vars, id) {
    return id > 0 && getVar(vars, id) === getVar(vars, id - 1);
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
    return isLoopNonhalting(body, varId) === 1
    // Cannot repeat twice (only enforced outside loops)
    || !ctx.inLoop && !canRepeatTwice(body, varId)
    // Nested in a way that would duplicate behavior
    || isLoopNested(body, varId);
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
        const newVars = exeOp([...ctx.vars], instr);

        ctx.prog.push(instr);

        // Recurse with one less remaining instruction.
        yield* enumerate(len - 1, {
            ...ctx,
            vars: newVars,
            maxVar: nextMaxVar,
            // Ensure we don't permute instruction order unnecessarily.
            minInstr: instrId,
        });

        ctx.prog.pop();
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

        for (let bodyLength = 1; bodyLength <= (len - 1); bodyLength++) {
            instr.len = bodyLength;

            // If the loop condition variable is not in the required position,
            // the while-block has no effect; just skip the loop body.
            if (isVarPos(ctx.vars, varId))
                yield* genLoopBody(instr, [], len - bodyLength - 1, {
                    ...ctx,
                    maxVar: nextMaxVar,
                    minInstr: 0,
                });
            else
                yield* enumerate(len - bodyLength - 1, {
                    ...ctx,
                    maxVar: nextMaxVar,
                    minInstr: 0,
                });
        }

        ctx.prog.pop();
    }
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
    for (
        // Enumerate the loop body itself; recursion is marked as `inLoop`.
        const [bodyHalted, bodyCtx] of enumerate(instr.len, {
            ...ctx,
            prog: [],
            inLoop: true,
        })
    ) {
        if (skipLoopBody(ctx, bodyCtx.prog, instr.var)) continue;

        // Max var after concatenating loop body with the remaining tail.
        const tailMaxVarId = Math.max(bodyCtx.maxVar, ctx.maxVar);
        instr.body = bodyCtx.prog;

        // Create a new stack frame so the interpreter can execute the loop.
        function appStack() {
            const newStack = cloneStack(stack);
            newStack.push({
                block: bodyCtx.prog,
                pc: 0,
                loopVar: instr.var,
                // Cache positional info used by the interpreter.
                posVars: getPosVars(bodyCtx.vars),
                prevVars: [...bodyCtx.vars]
            });
            return newStack;
        }

        // If the body enumeration halted and the loop condition still holds,
        // execute one step of the interpreter to decide whether:
        // - The program fully halts
        // - Or execution continues inside a nested loop
        const [halted, state] = bodyHalted === true && isVarPos(bodyCtx.vars, instr.var)
        ? execute(
            {maxSteps: 100, deciders: true},
            {vars: [...bodyCtx.vars], steps: bodyCtx.steps, stack: appStack()}
        )
        : [bodyHalted, {vars: bodyCtx.vars, steps: bodyCtx.steps, stack: stack}];

        if (halted === true) {
            // Fully halted: enumerate the remainder (tail) under the final state.
            yield* enumerate(len, {
                ...ctx,
                vars: state.vars,
                steps: state.steps,
                maxVar: tailMaxVarId,
            });
        }
        else if (halted === undefined) {
            // Execution is "in progress" inside the stack: expand the next loop.
            // Instruction that is pointed to by the top frame's pc.
            const frame = state.stack.at(-1);
            const loopInstr = frame.block[frame.pc];

            yield* genLoopBody(loopInstr, state.stack, len, {
                ...ctx,
                vars: state.vars,
                steps: state.steps,
                maxVar: tailMaxVarId,
            });

            // Important: clear `.body` before continuing sibling enumerations.
            loopInstr.body = undefined;
        }
        else if (len <= 0) {
            // Terminal case: no more instructions left; yield final program/state.
            yield [halted, {...ctx, vars: state.vars, steps: state.steps}];
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
    maxVar: 0, minInstr: 0, inLoop: false,
}) {
    if (len <= 0) {
        // Base case: with no remaining instructions, the current construction is
        // considered a halted program under this enumeration scheme.
        yield [true, ctx];
        return;
    }

    // Either start with a simple instruction or start with a while-loop.
    yield* genInstructions(len, ctx);
    yield* genWhileLoops(len, ctx);
}
