"use strict";
import {log} from "./log.js";
import {enumerate} from "./enumerate.js";
import {unparse} from "./parser.js";

const LOG = {
    CHAMPION: true,
    HALTED: false,
    NONHALTED: false,
    HOLDOUT: true,
}

const MAX_LENGTH = 12;
const AREA = [{type: "inc", var: 0}, {type: "while", var: 0, body: undefined}, {type: "inc", var: 1}];
// [{type: "inc", var: 0}, {type: "inc", var: 0}, {type: "inc", var: 0}];

const count = {
    total: 0,
    halted: 0,
    nonhalted: 0,
    holdout: 0
}

let record = 0;

for (const [halted, program, state] of enumerate(MAX_LENGTH, AREA.reverse())) {
    const progStr = unparse(program);

    if (halted === true) {
        const score = Math.max(0, ...Object.values(state.vars));

        if (score > record) {
            if (LOG.CHAMPION) log("Champion:", progStr, "Score:", score);
            record = score;
        }
        else {
            if (LOG.HALTED) log("Halted:", progStr);
        }
        count.halted++
    }
    else if (halted === false) {
        if (LOG.NONHALTED) log("Nonhalted:", progStr);
        count.nonhalted++;
    }
    else if (halted === null) {
        if (LOG.HOLDOUT) log("Holdout:", progStr);
        count.holdout++;
    }

    count.total++;
}

log("Total:", count.total);
log("Halted:", count.halted);
log("Nonhalted:", count.nonhalted);
log("Holdout:", count.holdout);
