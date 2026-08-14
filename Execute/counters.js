"use strict";
// Basic operation methods related to counters
export const Counters = {
    get(vars, id) {
        return vars[id] ?? 0;
    },

    inc(vars, id) {
        vars[id] = Counters.get(vars, id) + 1;
    },

    dec(vars, id) {
        vars[id] = Math.max(Counters.get(vars, id) - 1, 0);
    },

    isZero(vars, id) {
        return Counters.get(vars, id) === 0;
    },

    // Check if two adjacent counters are equal
    isEqualToPrev(vars, id) {
        if (id <= 0) return false;
        return Counters.get(vars, id) === Counters.get(vars, id - 1);
    },

    // Return a set containing positive counters indexes
    getPosSet(vars) {
        const res = new Set();
        vars.forEach((value, id) => {
            if (value > 0) res.add(id);
        })
        return res;
    },
}
