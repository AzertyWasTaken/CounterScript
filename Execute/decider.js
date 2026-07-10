"use strict";
import {Counters} from "./counters.js";

function decide(curr, prev, pos) {
    const maxLength = Math.max(curr.length, prev.length);

    for (let id = 0; id < maxLength; id++) {
        const currVal = Counters.get(curr, id);
        const prevVal = Counters.get(prev, id);

        if (pos.has(id)) {
            // Other variables must not decrease
            if (currVal < prevVal) return false;
        } else {
            // Variables that became zero must be equal
            if (currVal !== prevVal) return false;
        }
    }

    return true;
}

export function isTransCycler(currVars, prevVars, prevPrevVars, posVars) {
    return decide(currVars, prevVars, posVars)
    || prevPrevVars !== null && decide(currVars, prevPrevVars, new Set());
}
