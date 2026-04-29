"use strict";
import {log} from "./log.js";
import {run, incVar, decVar, getVar, isVarPos} from "./execute.js";
import {
    isLoopNonhalting, hasActiveVarForEach, getUsedVars, canRepeatTwice,
    isLoopNested
} from "./getProgData.js";

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
    || ctx.allowed && !ctx.allowed.has(instr.var);
}

function skipLoopBody(ctx, body, varId) {
    return isLoopNonhalting(body, varId)
    || !ctx.inLoop && !canRepeatTwice(body, varId)
    || isLoopNested(body, varId);
}

function skipLoopVar(ctx, varId) {
    return !ctx.inLoop && (
        varId + 1 > ctx.maxVar
        || compareVars(ctx.vars, varId)
    );
}

function runInstr(vars, instr) {
    if (instr.type === "inc")
        incVar(vars, instr.var);

    else if (instr.type === "dec")
        decVar(vars, instr.var);

    return vars;
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
        const newVars = ctx.tnf
        ? runInstr([...ctx.vars], instr)
        : ctx.vars;

        // Add the operation
        ctx.prog.push(instr);
        yield* generate(len - 1, {
            prog: ctx.prog, root: ctx.root, vars: newVars, steps: ctx.steps,
            maxVar: nextMaxVar, minInstr: instrId, allowed: ctx.allowed,
            inLoop: ctx.inLoop, tnf: ctx.tnf
        });
        ctx.prog.pop();
    }
}

// Core while loops
// ================================================================

export function* genWhileLoops(len, ctx) {
    for (let varId = 0; varId <= ctx.maxVar; varId++) {
        // Skip not allowed vars
        if (skipLoopVar(ctx, varId)) continue;

        const nextMaxVar = Math.max(varId + 1, ctx.maxVar);

        for (let bodyLength = 1; bodyLength < len; bodyLength++) {
            const tailLength = len - bodyLength - 1;

            // Enumerate all possible bodies for the while loop
            for (
                const [body, , bodyVars, bodySteps, bodyMaxVar]
                of generate(bodyLength, {
                    prog: [], root: ctx.root, vars: ctx.vars, steps: ctx.steps,
                    maxVar: nextMaxVar, minInstr: 0, allowed: null,
                    inLoop: true, tnf: isVarPos(ctx.vars, varId)
                })
            ) {
                // Skip not allowed bodies
                if (skipLoopBody(ctx, body, varId)) continue;

                const instr = {type: "while", var: varId, body};

                // Execute instruction
                const [halted, newVars, newSteps] = ctx.tnf
                ? run([instr], 100, true, [...bodyVars], bodySteps)
                : [true, bodyVars, bodySteps];

                ctx.prog.push(instr);

                // Filter out programs that have inactive vars (always stay at 0)
                if (ctx.inLoop || hasActiveVarForEach(ctx.prog))
                    if (halted === true) {
                        const tailMaxVar = Math.max(bodyMaxVar, ctx.maxVar);
                        const usedVarsInBody = getUsedVars(body);

                        yield* generate(tailLength, {
                            prog: ctx.prog, root: ctx.root, vars: newVars, steps: newSteps,
                            maxVar: tailMaxVar, minInstr: 0, allowed: usedVarsInBody,
                            inLoop: ctx.inLoop, tnf: ctx.tnf
                        });

                    } else if (tailLength === 0)
                        yield [ctx.root, halted, newVars, newSteps, ctx.maxVar];

                ctx.prog.pop();
            }
        }
    }
}

// Main functions
// ================================================================

export function* generate(len, ctx) {
    if (len <= 0) {
        yield [ctx.prog, true, ctx.vars, ctx.steps, ctx.maxVar];
        return;
    }

    yield* genInstructions(len, ctx);
    yield* genWhileLoops(len, ctx);
}

export function* enumerate(len) {
    const prog = [];

    yield* generate(len, {
        prog: prog, root: prog, vars: [], steps: 0,
        maxVar: 0, minInstr: 0, allowed: null,
        inLoop: false, tnf: true
    });
}