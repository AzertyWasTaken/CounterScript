"use strict";
import {log} from "./log.js";
import {enumerate, skipProgram} from "./enumerate.js";
// import {enumerate, skipProgram} from "./enumerate_preOptLoopLen.js";
import {unparse} from "./parser.js";

const LOG_CHAMPION = true;
const LOG_HALTED = false;
const LOG_NONHALTED = false;
const LOG_HOLDOUT = true;

const MAX_LENGTH = 10;

const count = {
    total: 0,
    halted: 0,
    nonhalted: 0,
    holdout: 0
}

let record = 0;

for (const [halted, ctx] of enumerate(MAX_LENGTH)) {
    // log(unparse(ctx.prog));
    if (skipProgram(MAX_LENGTH, ctx, halted)) continue;

    const progStr = unparse(ctx.prog);
    // log(ctx);

    if (halted === true) {
        const score = Math.max(0, ...Object.values(ctx.vars));

        if (score > record) {
            record = score;

            if (LOG_CHAMPION) log("Champion:", progStr, "Score:", score);
        }
        else {
            if (LOG_HALTED) log("Halted:", progStr);
        }
        count.halted++
    }
    else if (halted === false) {
        if (LOG_NONHALTED) log("Nonhalted:", progStr);
        count.nonhalted++;
    }
    else if (halted === null) {
        if (LOG_HOLDOUT) log("Holdout:", progStr);
        count.holdout++;
    }

    count.total++;
}

log("Total:", count.total);
log("Halted:", count.halted);
log("Nonhalted:", count.nonhalted);
log("Holdout:", count.holdout);
