"use strict";
import {log} from "./log.js";
import {enumerate} from "./enumerate.js";
import {unparse} from "./parser.js";
import {hasOpVarForEach} from "./getProgData.js";

const LOG_CHAMPION = true;
const LOG_HALTED = false;
const LOG_NONHALTED = false;
const LOG_HOLDOUT = true;

const count = {
    total: 0,
    halted: 0,
    nonhalted: 0,
    holdout: 0
}

let record = 0;

for (const [program, halted, vars, steps, maxVarId] of enumerate(9)) {
    if (halted !== true && !hasOpVarForEach(program, "while")) {continue;}
    const progStr = unparse(program);

    if (halted === true) {
        const score = Math.max(0, ...Object.values(vars));

        if (score > record) {
            record = score;

            if (LOG_CHAMPION) {log("Champion:", progStr, "Score:", record);}

        } else {
            if (LOG_HALTED) {log("Halted:", progStr);}
            count.halted++
        }

    } else if (halted === false) {
        if (LOG_NONHALTED) {log("Nonhalted:", progStr);}
        count.nonhalted++;
    
    } else if (halted === null) {
        if (LOG_HOLDOUT) {log("Holdout:", progStr);}
        count.holdout++;
    }

    count.total++;
}

log("Total:", count.total);
log("Halted:", count.halted);
log("Nonhalted:", count.nonhalted);
log("Holdout:", count.holdout);