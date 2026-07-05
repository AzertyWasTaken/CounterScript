"use strict";
import {log} from "./log.js";
/**
 * Performs abstract interpretation to determine loop termination properties
 * 
 * Abstract values represent possible runtime states:
 * - t="isEqualTo", v=<int>: counter is def equal to `int`
 * - t="isAtLeast", v=<int>: counter is at least `int`
 * - t="isEqualToSelf", d=<int>, i=<int>:
 *   counter value decreases by `int` then increases by `int`
 * - t="isEqualToSelfAndIsPositive":
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

function isOne(value) {
    return value.t === "isEqualTo" && value.v === 1;
}

function isPositive(value) {
    return getRange(value) > 0;
}

function getRange(value) {
    if (value.t === "isAtLeast") return value.v;
    if (value.t === "isEqualTo") return value.v;
    if (value.t === "isEqualToSelf") return value.i;
    if (value.t === "isEqualToSelfAndIsPositive") return 1;
}

function isLoopNonhalting(value) {
    return isPositive(value)
    || value.t === "isEqualToSelf" && value.d === 0;
}

function loopRepeatCount(headValue, bodyValue) {
    if (bodyValue.t === "isEqualToSelf") {
        // `bodyValue` must be strictly decreasing (no nonhalting loop)
        if (headValue.t === "isEqualTo")
            return {t: "isEqualTo", v: Math.ceil(headValue.v / bodyValue.d)};

        const headMinValue = getRange(headValue);
        if (headMinValue > 0)
            return {t: "isAtLeast", v: Math.ceil(headMinValue / bodyValue.d)};
    }

    if (isPositive(headValue)) {
        if (isZero(bodyValue)) return {t: "isEqualTo", v: 1};
        return {t: "isAtLeast", v: 1};
    }

    if (isZero(headValue)) return {t: "isEqualTo", v: 0};

    return {t: "isAtLeast", v: 0};
}

function isStatic(value) {
    return value.t === "isEqualToSelf" && value.d === 0 && value.i === 0
    || value.t === "isEqualToSelfAndIsPositive";
}

// States updater
// ================================================================

function incInstr(value) {
    if (value.t === "isEqualTo")
        return {t: "isEqualTo", v: value.v + 1};

    if (value.t === "isAtLeast")
        return {t: "isAtLeast", v: value.v + 1};

    if (value.t === "isEqualToSelf")
        return {t: "isEqualToSelf", d: value.d, i: value.i + 1};

    if (value.t === "isEqualToSelfAndIsPositive")
        return {t: "isEqualToSelf", d: 0, i: 1};
}

function decInstr(value) {
    if (value.t === "isEqualTo")
        return {t: "isEqualTo", v: Math.max(value.v - 1, 0)};

    if (value.t === "isAtLeast")
        return {t: "isAtLeast", v: Math.max(value.v - 1, 0)};

    if (value.t === "isEqualToSelf")
        return value.i > 0
        ? {t: "isEqualToSelf", d: value.d, i: value.i - 1}
        : {t: "isEqualToSelf", d: value.d + 1, i: value.i};
    
    if (value.t === "isEqualToSelfAndIsPositive")
        return {t: "isEqualToSelf", d: 1, i: 0};
}

function loopInstr(headValue, bodyValue, repeatCount) {
    // Ignore variables that remain unchanged in the body
    if (isStatic(bodyValue)) return headValue;

    if (bodyValue.t === "isEqualToSelf" && bodyValue.d === 0) {
        if (repeatCount.t === "isEqualTo") {
            const product = bodyValue.i * repeatCount.v;
        
            if (headValue.t === "isEqualTo")
                return {t: "isEqualTo", v: headValue.v + product};

            if (headValue.t === "isEqualToSelf")
                return {t: "isEqualToSelf", d: headValue.d, i: headValue.i + product};

            if (headValue.t === "isEqualToSelfAndIsPositive")
                return {t: "isEqualToSelf", d: headValue.d, i: product};
        }

        const headRange = getRange(headValue);
        const loopRange = getRange(repeatCount);

        return {t: "isAtLeast", v: headRange + bodyValue.i * loopRange};
    }

    if (bodyValue.t === "isEqualToSelf" && bodyValue.i === 0 && repeatCount.t === "isEqualTo") {
        const product = bodyValue.d * repeatCount.v;

        if (headValue.t === "isAtLeast")
            return {t: "isAtLeast", v: Math.max(headValue.v - product, 0)};

        if (headValue.t === "isEqualTo")
            return {t: "isEqualTo", v: Math.max(headValue.v - product, 0)};

        if (headValue.t === "isEqualToSelf")
            return {t: "isEqualToSelf", d: headValue.d + Math.max(product - headValue.i, 0), i: Math.max(headValue.i - product, 0)};

        if (headValue.t === "isEqualToSelfAndIsPositive")
            return {t: "isEqualToSelf", d: product, i: 0};
    }

    // Check if loop body is always executed at least once
    if (isPositive(repeatCount)) {
        if (bodyValue.t === "isEqualTo" || bodyValue.t === "isAtLeast") return bodyValue;

        if (bodyValue.t === "isEqualToSelf") return {t: "isAtLeast", v: bodyValue.i};
    }

    const headRange = getRange(headValue);
    const bodyRange = getRange(bodyValue);

    return {t: "isAtLeast", v: Math.min(headRange, bodyRange)};
}

function loopBody(state, bodyState, repeatCount) {
    // If body can always terminate with "true", propagate upward
    if (bodyState.def.t !== "isEqualToSelf") state.def = bodyState.def;

    const maxVarId = Math.max(state.eq.length, bodyState.eq.length);

    for (let varId = 0; varId < maxVarId; varId++) {
        const headValue = getValue(state, varId);
        const bodyValue = getValue(bodyState, varId);

        setValue(state, varId, loopInstr(headValue, bodyValue, repeatCount));
    }
}

// Analyzer
// ================================================================

export function analyzeLoop(program, whileVar) {
    // Undefined program state is unknown
    if (!program) return {eq: [], def: {t: "isAtLeast", v: 0}};

    // State does not change by default
    const state = {eq: [], def: {t: "isEqualToSelf", d: 0, i: 0}};
    if (Number.isInteger(whileVar))
        setValue(state, whileVar, {t: "isEqualToSelfAndIsPositive"});

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
            if (bodyState === null) return null;

            // Check if loop is nonhalting
            const bodyValue = getValue(bodyState, loopVar);
            if (isLoopNonhalting(bodyValue)) return null;

            // Check if loop always repeat exactly once
            const repeatCount = loopRepeatCount(headValue, bodyValue);
            if (isOne(repeatCount)) return null;

            // Merge current state and loop body state
            loopBody(state, bodyState, repeatCount);
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

    const bodyValue = getValue(state, loopVar);
    return isLoopNonhalting(bodyValue);
}
