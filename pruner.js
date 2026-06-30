"use strict";
import {log} from "./log.js";
import {Counters} from "./counters.js";
import {isLoopNonhalting} from "./isLoopNonhalting.js";
import {areVarsOrdered} from "./areVarsOrdered.js";
import {filterLoop} from "./analyzeLoop.js";
import {scanVars, hasUndefinedLoop} from "./scanner.js";
import {CONFIG} from "./enumerate.js";
import {unparse} from "./parser.js";

// Check if a loop is unecessary nested
function isLoopNested(body) {
    if (!body) return null;
    return body.length === 1
    && body[0].type === "while";
}

export const Prune = {
    // Prune completed programs
    program(halted, program, state) {
        if (state.progLength !== CONFIG.MAX_LENGTH) return true;

        const {isValid, incs, decs, whiles} = scanVars(program);
        if (
            !isValid
            // Assume that every while-loop have run at least once
            || decs.difference(whiles).size > 0
            || incs.difference(whiles).size > (halted === true ? 1 : 0)
        ) return true;

        return !areVarsOrdered(program);
    },

    // Prune new basic intructions
    basicInstr(stack, state, instr) {
        return stack.length <= 1 && (
            // Unused decrements (when the counter equals 0)
            instr.type === "dec" && Counters.isZero(state.vars, instr.var)
            // Equivalence (adjacent-variable symmetry)
            || Counters.isEqualToPrev(state.vars, instr.var)
        )
    },

    // Prune new while loops
    loopVar(stack, state, instr) {
        return stack.length <= 1 && (
            // Unused loops (when the counter equals 0)
            Counters.isZero(state.vars, instr.var)
            // Equivalence (adjacent-variable symmetry)
            || Counters.isEqualToPrev(state.vars, instr.var)
        );
    },

    // Prune new loop bodies
    newLoopBody(stack, state) {
        const frame = stack.at(-1);
        const program = frame.program;

        // Check if the program is a root while-loop
        if (stack.length <= 2) {
            // Check if loop cannot repeat twice
            if (Counters.isZero(state.vars, frame.loopVar)) return true;

            const tailLength = CONFIG.MAX_LENGTH - state.progLength;
            if (tailLength > 0 && tailLength < 4) return true;
        }
        // Nonhalting loop bodies (do not have to decide nested loops)
        return isLoopNested(program)
        || isLoopNonhalting(program, frame.loopVar)
        || !areVarsOrdered(program)
        || filterLoop(program, frame.loopVar);
    },

    // Prune loop bodies (when a nested body is generated)
    loopBody(stack) {
        const callStack = stack.at(-1).callStack;

        for (const item of callStack) {
            const program = item.block;
            if (
                isLoopNonhalting(program, item.loopVar)
                || !areVarsOrdered(program)
                || filterLoop(program, item.loopVar)
            )
            return true;
        }
        return false;
    },

    // Prune nested holdouts
    holdout(stack) {
        for (const frame of stack.slice(1)) {
            const program = frame.program;
            if (
                isLoopNested(program)
                || isLoopNonhalting(program, frame.loopVar)
                || !areVarsOrdered(program)
                || filterLoop(program, frame.loopVar)
            )
            return true;
        }
        return false;
    },

    // Prune root loop bodies that have undefined loop bodies
    undefinedLoop(halted, stack, frame) {
        return halted === true
        && stack.length <= 2
        && hasUndefinedLoop(frame.program);
    },
}
