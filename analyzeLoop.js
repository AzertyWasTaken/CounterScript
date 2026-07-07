"use strict";
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

// Get the minimum value of `value`
function getRange(value) {
    if (value.t === "isAtLeast") return value.v;
    if (value.t === "isEqualTo") return value.v;
    if (value.t === "isEqualToSelf") return value.i;
    if (value.t === "isEqualToSelfAndIsPositive") return 1;
}

// Check if `value` can reach 0 when iterated
function isLoopNonhalting(value) {
    return isPositive(value) || isStatic(value);
}

// Get how many times a loop iterates
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

// Check if `value` cannot change the value
function isStatic(value) {
    return value.t === "isEqualToSelf" && value.d === 0 && value.i === 0
    || value.t === "isEqualToSelfAndIsPositive";
}

// States updater
// ================================================================

// Converts a basic instr repeated `r` times to a single instr
function iteratedAddSub(d, i, r) {
    if (r === 0) return [0, 0];
    if (d < i) return [d, (i - d) * r + d];
    if (d > i) return [(d - i) * r + i, i];
    return [d, i];
}

function basicInstr(value, d, i) {
    if (value.t === "isEqualTo") {
        return {t: "isEqualTo", v: Math.max(value.v - d, 0) + i};
    }

    if (value.t === "isAtLeast") {
        return {t: "isAtLeast", v: Math.max(value.v - d, 0) + i};
    }

    if (value.t === "isEqualToSelf") {
        return {
            t: "isEqualToSelf",
            d: value.d + Math.max(d - value.i, 0),
            i: Math.max(value.i - d, 0) + i
        };
    }

    if (value.t === "isEqualToSelfAndIsPositive") {
        return {t: "isEqualToSelf", d: d, i: i};
    }
}

function loopInstr(headValue, bodyValue, repeatCount) {
    // Ignore variables that remain unchanged in the body
    if (isStatic(bodyValue)) return headValue;

    // Check if loop body is always executed at least once
    if (isPositive(repeatCount)) {
        if (bodyValue.t === "isEqualTo" || bodyValue.t === "isAtLeast")
            return bodyValue;

        if (bodyValue.t === "isEqualToSelf") {
            if (repeatCount.t === "isEqualTo") {
                const [d, i] = iteratedAddSub(bodyValue.d, bodyValue.i, repeatCount.v);
                return basicInstr(headValue, d, i);
            }

            if (bodyValue.d < bodyValue.i) {
                const headRange = getRange(headValue);
                const loopRange = getRange(repeatCount);

                const [d, i] = iteratedAddSub(bodyValue.d, bodyValue.i, loopRange);

                return {t: "isAtLeast", v: Math.max(headRange - d, 0) + i};
            }

            return {t: "isAtLeast", v: bodyValue.i};
        }
    }

    if (
        headValue.t === "isEqualTo" && bodyValue.t === "isEqualTo"
        && headValue.v === bodyValue.v
    ) return bodyValue;

    const headRange = getRange(headValue);
    const bodyRange = getRange(bodyValue);

    return {t: "isAtLeast", v: Math.min(headRange, bodyRange)};
}

function loopBody(state, bodyState, repeatCount) {
    // If body can always terminate with "true", propagate upward (should ignore other keys)
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

            setValue(state, instr.var, basicInstr(value, 0, 1));
        }
        else if (instr.type === "dec") {
            const value = getValue(state, instr.var);
            // Cannot decrement a def-0 counter
            if (isZero(value)) return null;

            setValue(state, instr.var, basicInstr(value, 1, 0));
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
