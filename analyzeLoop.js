"use strict";
function getValue(state, varId) {
    return state.eq[varId] ?? state.def;
}

function setValue(state, varId, val) {
    return state.eq[varId] = val;
}

function isLoopNonhalting(state, loopVar) {
    const value = getValue(state, loopVar);
    return value === "isEqualToSelf" || value === "isGreaterThanZero";
}

/**
 * Performs abstract interpretation to determine loop termination properties
 * 
 * Abstract values represent possible runtime states:
 * - "isZero": counter is def zero
 * - "isGreaterThanZero": counter is def greater than zero
 * - "true": counter value is unknown
 * - "isEqualToSelf": counter value does not change
 * 
 * Return analysis result, or null if:
 * - Proven non-halting
 * - Equivalent to another (possibly smaller) program
 */
export function analyzeLoop(program) {
    // Undefined program state is unknown
    if (!program) return {eq: [], def: "true"};

    // State does not change by default
    const state = {eq: [], def: "isEqualToSelf"};

    for (const instr of program) {
        if (instr.type === "inc") {
            // Incrementing a counter makes it def > 0
            setValue(state, instr.var, "isGreaterThanZero");
        }
        else if (instr.type === "dec") {
            // Cannot decrement a def-0 counter
            if (getValue(state, instr.var) === "isZero") return null;
            // Decrementing an unknown/positive counter makes it uncertain
            setValue(state, instr.var, "true");
        }
        else if (instr.type === "while") {
            const loopVar = instr.var;
            const loopValue = getValue(state, loopVar);

            // Cannot execute a def-0 while-loop counter
            if (loopValue === "isZero") return null;

            // Analyze loop body independently
            const bodyState = analyzeLoop(instr.body);
            if (bodyState === null || isLoopNonhalting(bodyState, loopVar)) return null;
            // Check if loop always repeat exactly once
            if (loopValue === "isGreaterThanZero" && getValue(bodyState, loopVar) === "isZero") return null;

            // If body can always terminate with "true", propagate upward
            if (bodyState.def === "true") state.def = "true";

            const maxVarId = Math.max(state.eq.length, bodyState.eq.length);

            for (let varId = 0; varId < maxVarId; varId++) {
                const bodyValue = getValue(bodyState, varId);
                // Ignore variables that remain unchanged in the body
                if (bodyValue === "isEqualToSelf") continue;

                // Check if loop body is always executed at least once
                if (loopValue === "isGreaterThanZero") {
                    // Use loop body results directly
                    setValue(state, varId, bodyValue);
                } else {
                    const currValue = getValue(state, varId);
                    // Set value to "true" if it may change
                    if (bodyValue !== currValue) setValue(state, varId, "true");
                }
            }

            // After loop completes, its counter is def 0
            setValue(state, loopVar, "isZero");
        }
        else {
            throw new Error(`Unknown instruction: ${instr.type}`);
        }
    }

    return state;
}

// Return true if while-loop is proven non-halting or equivalent
export function filterLoop(program, loopVar) {
    const state = analyzeLoop(program);
    if (state === null) return true;

    return isLoopNonhalting(state, loopVar);
}
