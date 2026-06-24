"use strict";
import {log} from "./log.js";
import {Counters} from "./counters.js";
import {isLoopNonhalting} from "./isLoopNonhalting.js";
import {isLoopNested, hasRowWhileVars, areVarsOrdered} from "./getProgData.js";
import {scanVars, hasUndefinedLoop} from "./scanner.js";

export const Prune = {
    program(halted, program, state) {
        if (state.progLength !== state.maxLength) return true;

        const {isValid, incs, decs, whiles} = scanVars(program);
        if (
            !isValid
            // Assume that every while-loop have run at least once
            || decs.difference(whiles).size > 0
            || incs.difference(whiles).size > (halted === true ? 1 : 0)
        ) return true;

        return !areVarsOrdered(program);
    },

    basicInstr(stack, state, instr) {
        return stack.length <= 1 && (
            // Unused decrements (when the counter equals 0)
            instr.type === "dec" && Counters.isZero(state.vars, instr.var)
            // Equivalence (adjacent-variable symmetry)
            || Counters.isEqualToPrev(state.vars, instr.var)
        )
    },

    loopVar(stack, state, instr) {
        return stack.length <= 1 && (
            // Unused loops (when the counter equals 0)
            Counters.isZero(state.vars, instr.var)
            // Equivalence (adjacent-variable symmetry)
            || Counters.isEqualToPrev(state.vars, instr.var)
        );
    },

    loopBody(stack, state) {
        const frame = stack.at(-1);
        const tailLength = state.maxLength - state.progLength;

        // Check if the program is a root while-loop
        return stack.length <= 2 && (
            // Cannot repeat twice (only enforced outside loops)
            Counters.isZero(state.vars, frame.loopVar)
            || tailLength > 0 && tailLength < 4
        )
        // Nonhalting loop bodies
        || isLoopNonhalting(frame.program, frame.loopVar) === 1
        || isLoopNested(frame.program)
        || hasRowWhileVars(frame.program)
        || !areVarsOrdered(frame.program);
    },

    holdout(stack) {
        // Nonhalting loop bodies
        for (const frame of stack.slice(1)) {
            if (
                isLoopNested(frame.program)
                || hasRowWhileVars(frame.program)
                || !areVarsOrdered(frame.program)
            )
            return true;
        }
        return false;
    },

    undefinedLoop(halted, stack, frame) {
        return halted !== true
        && stack.length <= 2
        && hasUndefinedLoop(frame.program);
    },
}
