"use strict";
import {log} from "./log.js";
import {execute, exeOp, getVar, isVarPos, getPosVars, cloneStack} from "./execute.js";
import {isLoopNonhalting} from "./isLoopNonhalting.js";
import {canRepeatTwice, isLoopNested} from "./getProgData.js";

// Helpers
// ================================================================

function compareVars(vars, id) {
    return id > 0 && getVar(vars, id) === getVar(vars, id - 1);
}

function skipInstr(ctx, instr) {
    return !ctx.inLoop && (
        // Check equivalence outside of loops
        instr.type === "dec" && instr.var + 1 > ctx.maxVar
        || compareVars(ctx.vars, instr.var)
    )
    // Check equivalence with loops order
    // || ctx.allowed && !ctx.allowed.has(instr.var);
}

function skipLoopBody(ctx, body, varId) {
    return isLoopNonhalting(body, varId) === 1
    || !ctx.inLoop && !canRepeatTwice(body, varId)
    || isLoopNested(body, varId);
}

function skipLoopVar(ctx, varId) {
    return !ctx.inLoop && (
        varId + 1 > ctx.maxVar
        || compareVars(ctx.vars, varId)
    );
}

// Core instructions
// ================================================================

export function* genInstructions(len, ctx) {
    for (let instrId = ctx.minInstr; instrId < (ctx.maxVar + 1) * 2; instrId++) {
        const instr = {
            type: instrId % 2 === 0 ? "dec" : "inc",
            var: Math.floor(instrId / 2)
        };

        if (skipInstr(ctx, instr)) continue;

        const nextMaxVar = Math.max(instr.var + 1, ctx.maxVar);

        // Execute instruction
        const newVars = exeOp([...ctx.vars], instr);

        ctx.prog.push(instr);

        yield* enumerate(len - 1, {
            prog: ctx.prog, vars: newVars, steps: ctx.steps,
            maxVar: nextMaxVar, minInstr: instrId,
            inLoop: ctx.inLoop,
        });

        ctx.prog.pop();
    }
}

// Core while loops
// ================================================================

export function* genWhileLoops(len, ctx) {
    for (let varId = 0; varId < (ctx.maxVar + 1); varId++) {
        if (skipLoopVar(ctx, varId)) continue;

        const nextMaxVar = Math.max(varId + 1, ctx.maxVar);

        // Add while loops of various body lengths
        const instr = {type: "while", var: varId, body: undefined};

        ctx.prog.push(instr);

        for (let bodyLength = 1; bodyLength < len; bodyLength++) {
            instr.len = bodyLength;

            if (isVarPos(ctx.vars, varId))
                yield* genLoopBody(instr, [], len - bodyLength - 1, {
                    prog: ctx.prog, vars: ctx.vars, steps: ctx.steps,
                    maxVar: nextMaxVar,
                    inLoop: ctx.inLoop,
                });
            else
                yield* enumerate(len - bodyLength - 1, {
                    prog: ctx.prog, vars: ctx.vars, steps: ctx.steps,
                    maxVar: nextMaxVar, minInstr: 0,
                    inLoop: ctx.inLoop,
                });
        }

        ctx.prog.pop();
    }
}

function* genLoopBody(instr, stack, len, ctx) {
    for (
        const [body, bodyHalted, bodyVars, bodySteps, bodyMaxVarId]
        of enumerate(instr.len, {
            prog: [], vars: ctx.vars, steps: ctx.steps,
            maxVar: ctx.maxVar, minInstr: 0,
            inLoop: true,
        })
    ) {
        if (skipLoopBody(ctx, body, instr.var)) continue;

        const tailMaxVarId = Math.max(bodyMaxVarId, ctx.maxVar);
        instr.body = body;

        function appStack() {
            const newStack = cloneStack(stack);
            newStack.push({
                block: body,
                pc: 0,
                loopVar: instr.var,
                posVars: getPosVars(bodyVars),
                prevVars: [...bodyVars]
            });
            return newStack;
        }

        // Execute instruction
        const [halted, state] = bodyHalted === true && isVarPos(bodyVars, instr.var)
        ? execute({maxSteps: 100, deciders: true}, {vars: [...bodyVars], steps: bodySteps, stack: appStack()})
        : [bodyHalted, {vars: bodyVars, steps: bodySteps, stack: stack}];

        if (halted === true) {
            yield* enumerate(len, {
                prog: ctx.prog, vars: state.vars, steps: state.steps,
                maxVar: tailMaxVarId, minInstr: 0,
                inLoop: ctx.inLoop,
            });
        }
        else if (halted === undefined) {
            const frame = state.stack.at(-1);
            const loopInstr = frame.block[frame.pc];

            yield* genLoopBody(loopInstr, state.stack, len, {
                prog: ctx.prog, vars: state.vars, steps: state.steps,
                maxVar: tailMaxVarId,
                inLoop: ctx.inLoop,
            });
            loopInstr.body = undefined;
        }
        else if (len <= 0) {
            yield [ctx.prog, halted, state.vars, state.steps, ctx.maxVar];
        }
    }
}

// Main functions
// ================================================================

export function* enumerate(len, ctx = {
    prog: [], vars: [], steps: 0,
    maxVar: 0, minInstr: 0,
    inLoop: false,
}) {
    if (len <= 0) {
        yield [ctx.prog, true, ctx.vars, ctx.steps, ctx.maxVar];
        return;
    }

    yield* genInstructions(len, ctx);
    yield* genWhileLoops(len, ctx);
}