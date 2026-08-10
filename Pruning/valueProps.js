"use strict";
// Methods to get properties of analysis state values
export const Value = {
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
};
