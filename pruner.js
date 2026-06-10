"use strict";
import {counters} from "./counters.js";
import {isLoopNonhalting} from "./isLoopNonhalting.js";
import {isLoopNested, hasUndefinedLoop, areEachVarUseful, canEachVarInc, hasRowWhileVars, areVarsOrdered} from "./getProgData.js";

export const prune = {
    program(halted, program, state) {
        // Keep only max length prorams
        return state.progLength !== state.maxLength
        // Ignore programs with useless counters
        || hasUndefinedLoop(program)
        || (
            halted === true
            ? canEachVarInc(program) === false
            : areEachVarUseful(program) === false
        )
        || hasRowWhileVars(program)
        || !areVarsOrdered(program);
    },

    basicInstr(stack, state, instr) {
        return stack.length <= 1 && (
            // Unused decrements (when the counter equals 0)
            instr.type === "dec" && counters.isZero(state.vars, instr.var)
            // Equivalence (adjacent-variable symmetry)
            || counters.isEqualToPrev(state.vars, instr.var)
        )
    },

    loopBody(stack, state, frame) {
        // Nonhalting loop bodies
        return isLoopNonhalting(frame.program, frame.loopVar) === 1
        // Cannot repeat twice (only enforced outside loops)
        || stack.length <= 2 && counters.isZero(state.vars, frame.loopVar)
        || isLoopNested(frame.program, frame.loopVar)
        || hasRowWhileVars(frame.program)
        || !areVarsOrdered(frame.program);
    },

    loopVar(stack, state, instr) {
        return stack.length <= 1 && (
            // Unused loops (when the counter equals 0)
            counters.isZero(state.vars, instr.var)
            // Equivalence (adjacent-variable symmetry)
            || counters.isEqualToPrev(state.vars, instr.var)
        );
    },

    undefinedLoop(halted, stack, frame) {
        return halted !== true
        && stack.length <= 1
        && hasUndefinedLoop(frame.program);
    },
}
