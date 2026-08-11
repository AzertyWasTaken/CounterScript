"use strict";
import {executeBasicInstr} from "../Execute/execute.js";
import {ENUM} from "../config.js";
import {Value} from "../Pruning/valueProps.js";

// State
// ================================================================

// Estimate the number of variables a program of `length` can have.
function maxVarsCount(length) {
    return Math.floor((length + 1) / 3);
}

// Bound the allowed variable id to avoid exploring symmetric equivalents.
function getMaxVarId(varId, state) {
    return Math.min(
        Math.max(maxVarsCount(ENUM.MAX_LENGTH) - 1, 0),
        Math.max(varId + 1, state.maxVar)
    );
}

// Encode a basic instruction as an integer index.
function encodeInstr(obj) {
    return obj.var * 2
    + (obj.type === "dec" ? 0 : 1);
}

// Methods to update enumeration state
export const NextState = {
    // Return the initial enumeration state
    default() {
        return {
            vars: [], // Current counter values (runtime state)
            steps: 0, // Total execution steps performed
            progLength: 0, // Length of the partially-built program
            maxVar: 0, // Highest variable id used so far
            minInstr: 0 // Minimum encoded instruction id to try next (ordering)
        };
    },

    // Apply a basic instruction {inc/dec} and produce the new state.
    // Creates a fresh copy of `vars` so callers can undo.
    basicInstr(state, instr) {
        return {
            ...state,
            vars: executeBasicInstr([...state.vars], instr),
            progLength: state.progLength + 1,
            maxVar: getMaxVarId(instr.var, state),
            minInstr: encodeInstr(instr)
        };
    },

    // Apply a while-loop header.
    loopVar(state, instr, bodyLength) {
        return {
            ...state,
            // `bodyLength` is the size of the loop body (0 if empty, > 0 if being expanded).
            progLength: state.progLength + bodyLength + 1,
            maxVar: getMaxVarId(instr.var, state),
            // `minInstr` resets to 0 because after a loop we must re-consider all instruction types.
            minInstr: 0
        };
    },

    // Exit a loop body after executing it.
    loopBody(state, exeState, bodyLength) {
        return {
            ...state,
            // We adopt the post-loop counter state.
            vars: exeState.vars,
            steps: exeState.steps + 1,
            // The body's instructions are removed from progLength.
            progLength: state.progLength - bodyLength,
            minInstr: 0
        };
    },

    // Final state when a program is held out (timed out without halting).
    holdout(state, exeState) {
        return {
            ...state,
            // Adopts the execution state's vars and steps.
            vars: exeState.vars,
            steps: exeState.steps
        };
    },
}

// Stack
// ================================================================

// Methods to update enumeration stack
export const NextStack = {
    default() {
        return [{program: []}];
    },

    frame(instr, exeStack, analysis) {
        return {
            program: instr.body,
            loopVar: instr.var,
            callStack: exeStack,
            analysis: Value.default(instr.var)
        };
    },
}
