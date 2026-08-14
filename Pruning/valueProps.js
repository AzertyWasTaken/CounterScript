"use strict";

// Decrement and increment
// ================================================================

// Apply a decrement of `dec` and an increment of `inc` to an abstract value.
function decAndInc(value, dec, inc) {
    switch (value.t) {
        case "isEqualTo":
            return {t: "isEqualTo", v: Math.max(value.v - dec, 0) + inc};

        case "isAtLeast":
            return {t: "isAtLeast", v: Math.max(value.v - dec, 0) + inc};

        case "isEqualToSelf":
            return {
                t: "isEqualToSelf",
                d: value.d + Math.max(dec - value.i, 0),
                i: Math.max(value.i - dec, 0) + inc,
                p: value.p
            };

        case "isGreaterOrEqualToSelf":
            // An increment makes the value positive; a decrement may zero it.
            if (inc > 0) return {t: "isAtLeast", v: inc + (value.p ? 1 : 0)};
            if (dec > 0) return {t: "isAtLeast", v: 0};
            return {t: "isGreaterOrEqualToSelf", p: value.p};

        default:
            throw new Error(`Invalid value type: ${value.t}`);
    }
}

// Count loop iterations
// ================================================================

// Get how many times a loop iterates, given the head (entry) value of the
// loop variable and the body's effect on it.
function countIterations(parentValue, bodyValue) {
    if (Value.isZero(parentValue)) return {t: "isEqualTo", v: 0};

    // A strictly decreasing body (d > 0, i = 0) bounds the iteration count.
    // (A non-strictly-decreasing body would have been pruned as nonhalting.)
    if (bodyValue.t === "isEqualToSelf") {
        if (bodyValue.d === 0) throw new Error("Loop body cannot decrement.");

        if (parentValue.t === "isEqualTo")
            return {t: "isEqualTo", v: Math.ceil(parentValue.v / bodyValue.d)};

        const headMinValue = Value.getMinRange(parentValue);
        return {t: "isAtLeast", v: Math.ceil(headMinValue / bodyValue.d)};
    }

    if (Value.isPositive(parentValue)) {
        if (Value.isZero(bodyValue)) return {t: "isEqualTo", v: 1};
        return {t: "isAtLeast", v: 1};
    }

    return {t: "isAtLeast", v: 0};
}

// Apply loop body
// ================================================================

// Net effect of repeating a `dec`/`inc` pair `itr` times.
// Returns {dec, inc} describing the combined single-step effect.
function repeatedAddSub(dec, inc, itr) {
    if (itr === 0) return {dec: 0, inc: 0};
    if (dec < inc) return {dec, inc: (inc - dec) * itr + dec};
    if (dec > inc) return {dec: (dec - inc) * itr + inc, inc};
    return {dec, inc};
}

// Result of a loop whose body changes the counter by `bodyValue` per
// iteration, when the loop is known to run at least once.
// Returns null if this case does not apply.
function applyPositiveIterations(parentValue, bodyValue, iterations) {
    if (bodyValue.t === "isEqualTo" || bodyValue.t === "isAtLeast")
        return bodyValue;

    if (bodyValue.t === "isEqualToSelf") {
        if (iterations.t === "isEqualTo") {
            const {dec, inc} =
            repeatedAddSub(bodyValue.d, bodyValue.i, iterations.v);

            return decAndInc(parentValue, dec, inc);
        }

        if (bodyValue.d < bodyValue.i) {
            const headRange = Value.getMinRange(parentValue);
            const loopRange = Value.getMinRange(iterations);
            const {dec, inc} =
            repeatedAddSub(bodyValue.d, bodyValue.i, loopRange);

            return {t: "isAtLeast", v: Math.max(headRange - dec, 0) + inc};
        }

        return {t: "isAtLeast", v: bodyValue.i};
    }

    return null;
}

// Result of a loop whose body never decreases the counter.
function applyNonDecreasingBody(value) {
    if (
        value.t === "isEqualToSelf"
        && value.d === 0 && value.i === 0
    ) {
        return {t: "isGreaterOrEqualToSelf", p: value.p};
    }

    if (value.t === "isGreaterOrEqualToSelf") {
        return {t: "isGreaterOrEqualToSelf", p: value.p};
    }

    return {t: "isAtLeast", v: Value.getMinRange(value)};
}

// Resulting abstract value of a counter after a loop, given the head value,
// the body's effect on it, and the iteration count.
function loopInstr(parentValue, bodyValue, iterations) {
    // Ignore variables that remain unchanged in the body.
    if (Value.isStatic(bodyValue)) return parentValue;

    // A loop that leaves the counter unchanged keeps its head value.
    if (
        parentValue.t === "isEqualTo" && bodyValue.t === "isEqualTo"
        && parentValue.v === bodyValue.v
    ) {
        return parentValue;
    }

    // If the body always runs at least once, its effect dominates.
    if (Value.isPositive(iterations)) {
        const result = applyPositiveIterations(parentValue, bodyValue, iterations);
        if (result !== null) return result;
    }

    // A non-decreasing body can only raise the counter's lower bound.
    if (Value.isNonDecreasing(bodyValue))
        return applyNonDecreasingBody(parentValue);

    // Otherwise, the counter is at least the smaller of the two ranges.
    const headRange = Value.getMinRange(parentValue);
    const bodyRange = Value.getMinRange(bodyValue);
    return {t: "isAtLeast", v: Math.min(headRange, bodyRange)};
}

// Mutate `state` to apply `bodyState`, iterated `iterations` times.
// Do not mutate individual `.eq` values.
function loopBody(headState, bodyState, iterations, loopVar) {
    // Default value is unknown if a loop body is unknown (ignore other keys).
    if (bodyState.def.t !== "isEqualToSelf") headState.def = bodyState.def;

    const maxVarId = Math.max(headState.eq.length, bodyState.eq.length);

    for (let varId = 0; varId < maxVarId; varId++) {
        if (varId === loopVar) {
            // After loop completes, its counter is def 0.
            Value.set(headState, varId, {t: "isEqualTo", v: 0});
            continue;
        }

        const parentValue = Value.get(headState, varId);
        const bodyValue = Value.get(bodyState, varId);

        Value.set(
            headState, varId,
            loopInstr(parentValue, bodyValue, iterations)
        );
    }
}

// Properties
// ================================================================

// Methods to get properties of analysis state values
export const Value = {
    default(loopVar) {
        const state = {eq: [], def: {t: "isEqualToSelf", d: 0, i: 0, p: false}};

        if (Number.isInteger(loopVar))
            Value.set(state, loopVar, {t: "isEqualToSelf", d: 0, i: 0, p: true});

        return state;
    },

    get(state, varId) {
        return state.eq[varId] ?? state.def;
    },

    set(state, varId, val) {
        return state.eq[varId] = val;
    },

    isZero(value) {
        return value.t === "isEqualTo" && value.v === 0;
    },

    isOne(value) {
        return value.t === "isEqualTo" && value.v === 1;
    },

    // Get the minimum value that `value` can have
    getMinRange(value) {
        switch (value.t) {
            case "isEqualTo": return value.v;
            case "isAtLeast": return value.v;

            case "isEqualToSelf":
                return value.i + (value.p && value.d === 0 ? 1 : 0);

            case "isGreaterOrEqualToSelf":
                return value.p ? 1 : 0;

            default:
                throw new Error(`Invalid value type: ${value.t}`);
        }
    },

    isPositive(value) {
        return Value.getMinRange(value) > 0;
    },

    isNonDecreasing(value) {
        return value.t === "isGreaterOrEqualToSelf"
        || (value.t === "isEqualToSelf" && value.d <= value.i);
    },

    // Check if `value` cannot change the value
    isStatic(value) {
        return value.t === "isEqualToSelf"
        && value.d === 0 && value.i === 0;
    },

    // Check if `value` cannot reach 0 when iterated
    isNonhalting(value) {
        return Value.isPositive(value) || Value.isStatic(value);
    },

    decAndInc,
    countIterations,
    loopBody,
};
