"use strict";
import {Value} from "./valueProps.js";

// Analyzer
// ================================================================

// Apply a while-loop instruction to the analysis state.
// Returns null if the loop is proven non-halting, equivalent, or invalid.
function applyWhile(state, loopVar, body) {
    const parentValue = Value.get(state, loopVar);

    // Cannot execute a def-0 while-loop counter.
    if (Value.isZero(parentValue)) return null;

    // Analyze loop body independently.
    const bodyState = analyzeLoop(body, loopVar);
    if (bodyState === null) return null;

    // Check if loop is nonhalting.
    const bodyValue = Value.get(bodyState, loopVar);
    if (Value.isNonhalting(bodyValue)) return null;

    // Check if loop always repeats exactly once.
    const iterations = Value.countIterations(parentValue, bodyValue);
    if (Value.isOne(iterations)) return null;

    // Merge current state and loop body state.
    Value.loopBody(state, bodyState, iterations, loopVar);
    return state;
}

// Apply a single instruction to the analysis state.
// Returns null if the analysis fails (e.g., decrementing a zero counter).
function applyInstr(state, instr) {
    switch (instr.type) {
        case "inc": {
            const value = Value.get(state, instr.var);
            Value.set(state, instr.var, Value.decAndInc(value, 0, 1));
            return state;
        }

        case "dec": {
            const value = Value.get(state, instr.var);
            // Cannot decrement a def-0 counter.
            if (Value.isZero(value)) return null;

            Value.set(state, instr.var, Value.decAndInc(value, 1, 0));
            return state;
        }

        case "while":
            return applyWhile(state, instr.var, instr.body);

        default:
            throw new Error(`Unknown instruction: ${instr.type}`);
    }
}

export function analyzeLoop(program, whileVar) {
    // Undefined program state is unknown.
    if (!program) return {eq: [], def: {t: "isAtLeast", v: 0}};

    // State does not change by default.
    const state = Value.default(whileVar);

    for (let i = 0; i < program.length; i++) {
        if (applyInstr(state, program[i]) === null) return null;
    }

    return state;
}

// Filterer
// ================================================================

// Return true if while-loop is proven non-halting or equivalent.
export function filterLoop(program, loopVar) {
    const state = analyzeLoop(program, loopVar);
    if (state === null) return true;

    const bodyValue = Value.get(state, loopVar);
    return Value.isNonhalting(bodyValue);
}
