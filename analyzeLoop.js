"use strict";
/**
 * Performs abstract interpretation to determine loop termination properties
 * 
 * Abstract values represent possible runtime states:
 * - t="isEqualTo", v=<int>: counter is def equal to `int`
 * - t="isAtLeast", v=<int>: counter is at least `int`
 * - t="isEqualToSelf": counter value does not change
 * - t="isEqualToSelfAndIsGreaterThanZero":
 *   counter value does not change and is greater than 0
 * 
 * Return analysis result, or null if:
 * - Proven non-halting
 * - Equivalent to another (possibly smaller) program
 */

// Helpers
// ================================================================

function getValue(state, varId) {
    return state.eq[varId] ?? state.def;
}

function setValue(state, varId, val) {
    return state.eq[varId] = val;
}

function isZero(value) {
    return value.t === "isEqualTo" && value.v === 0;
}

function isGreaterThanZero(value) {
    return value.t === "isAtLeast" && value.v > 0
    || value.t === "isEqualTo" && value.v > 0
    || value.t === "isEqualToSelfAndIsGreaterThanZero";
}

function isValueStatic(value) {
    return value.t === "isEqualToSelf"
    || value.t === "isEqualToSelfAndIsGreaterThanZero";
}

function getRange(value) {
    if (value.t === "isAtLeast") {
        return value.v;
    }
    else if (value.t === "isEqualTo") {
        return value.v;
    }
    else if (value.t === "isEqualToSelfAndIsGreaterThanZero") {
        return 1;
    }
    else {
        return 0;
    }
}

function compare(a, b) {
    const key_a = Object.keys(a);
    const key_b = Object.keys(b);
    if (key_a.length !== key_b.length) return false;
    
    for (const k of key_a) {
        if (a[k] !== b[k]) return false;
    }
    return true;
}

function isLoopNonhalting(state, loopVar) {
    const value = getValue(state, loopVar);
    return value.t === "isEqualToSelf" || isGreaterThanZero(value);
}

// States updater
// ================================================================

function incInstr(value) {
    if (value.t === "isEqualTo") {
        return {t: "isEqualTo", v: value.v + 1};
    }
    else if (value.t === "isAtLeast") {
        return {t: "isAtLeast", v: value.v + 1};
    }
    else if (value.t === "isEqualToSelfAndIsGreaterThanZero") {
        return {t: "isAtLeast", v: 2};
    }
    else {
        // Incrementing a counter makes it def > 0
        return {t: "isAtLeast", v: 1};
    }
}

function decInstr(value) {
    if (value.t === "isEqualTo") {
        return {t: "isEqualTo", v: Math.max(value.v - 1, 0)};
    }
    else if (value.t === "isAtLeast") {
        return {t: "isAtLeast", v: Math.max(value.v - 1, 0)};
    }
    else {
        // Decrementing an unknown/positive counter makes it uncertain
        return {t: "isAtLeast", v: 0};
    }
}

function loopBody(state, bodyState, cannotSkipLoop) {
    // If body can always terminate with "true", propagate upward
    if (bodyState.def.t !== "isEqualToSelf") state.def = bodyState.def;

    const maxVarId = Math.max(state.eq.length, bodyState.eq.length);

    for (let varId = 0; varId < maxVarId; varId++) {
        // Ignore variables that remain unchanged in the body
        const bodyValue = getValue(bodyState, varId);
        if (isValueStatic(bodyValue)) continue;

        // Ignore variables that stay in the same state
        const headValue = getValue(state, varId);
        if (compare(headValue, bodyValue)) continue;

        // Check if loop body is always executed at least once
        if (cannotSkipLoop) {
            // Use loop body results directly
            setValue(state, varId, bodyValue);
        } else {
            const headRange = getRange(headValue);
            const bodyRange = getRange(bodyValue);

            setValue(state, varId,
                {t: "isAtLeast", v: Math.min(headRange, bodyRange)}
            );
        }
    }
}

// Analyzer
// ================================================================

export function analyzeLoop(program, whileVar) {
    // Undefined program state is unknown
    if (!program) return {eq: [], def: {t: "isAtLeast", v: 0}};

    // State does not change by default
    const state = {eq: [], def: {t: "isEqualToSelf"}};
    if (Number.isInteger(whileVar))
        setValue(state, whileVar, {t: "isEqualToSelfAndIsGreaterThanZero"});

    for (const instr of program) {
        if (instr.type === "inc") {
            const value = getValue(state, instr.var);

            setValue(state, instr.var, incInstr(value));
        }
        else if (instr.type === "dec") {
            const value = getValue(state, instr.var);
            // Cannot decrement a def-0 counter
            if (isZero(value)) return null;

            setValue(state, instr.var, decInstr(value));
        }
        else if (instr.type === "while") {
            const loopVar = instr.var;
            const headValue = getValue(state, loopVar);

            // Cannot execute a def-0 while-loop counter
            if (isZero(headValue)) return null;

            // Analyze loop body independently
            const bodyState = analyzeLoop(instr.body, loopVar);
            if (
                bodyState === null
                || isLoopNonhalting(bodyState, loopVar)
            ) return null;

            // Check if loop always repeat exactly once
            const bodyValue = getValue(bodyState, loopVar);
            const cannotSkipLoop = isGreaterThanZero(headValue);
            if (cannotSkipLoop && isZero(bodyValue)) return null;

            // Merge current state and loop body state
            loopBody(state, bodyState, cannotSkipLoop);
            // After loop completes, its counter is def 0
            setValue(state, loopVar, {t: "isEqualTo", v: 0});
        }
        else {
            throw new Error(`Unknown instruction: ${instr.type}`);
        }
    }

    return state;
}

// Filterer
// ================================================================

// Return true if while-loop is proven non-halting or equivalent
export function filterLoop(program, loopVar) {
    const state = analyzeLoop(program, loopVar);
    if (state === null) return true;

    return isLoopNonhalting(state, loopVar);
}
