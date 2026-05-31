"use strict";
import {log} from "./log.js";

export const counters = {
    get(v, id) {return v[id] ?? 0;},

    inc(v, id) {v[id] = this.get(v, id) + 1;},

    dec(v, id) {v[id] = Math.max(this.get(v, id) - 1, 0);},

    isZero(v, id) {return this.get(v, id) === 0;},

    // Check if two adjacent variables are equal.
    isEqualToPrev(v, id) {
        if (id <= 0) return null;
        return this.get(v, id) === this.get(v, id - 1);
    },

    // Return a set containing positive counters.
    getPosSet(c) {
        const res = new Set();
        c.forEach((v, id) => {
            if (v > 0) res.add(id);
        })
        return res;
    },
}
