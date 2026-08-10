"use strict";
import {log} from "./log.js";
import {enumerate} from "./Enumerate/enumerator.js";
import {unparse, parseArea} from "./parser.js";
import {LOG, AREA} from "./config.js";

// Initialize
// ================================================================

const enumArea = AREA.ENABLED ? parseArea(AREA.VALUE) : [];

const count = {
    total: 0,
    halted: 0,
    nonhalted: 0,
    holdout: 0
}

let record = 0;

function logProgram(status, program, ...arg) {
    const logArray = [];
    if (LOG.SHOW_STATUS) logArray.push(status);
    logArray.push(unparse(program));
    logArray.push(...arg);
    log(...logArray);
}

// Main function
// ================================================================

const start = performance.now();

for (const [halted, program, state] of enumerate(enumArea)) {
    if (halted === true) {
        const score = state.vars.reduce(
            (best, value) => Math.max(best, value ?? 0),
            0
        );

        if (score > record) {
            if (LOG.CHAMPION)
                logProgram("Champion:", program, "Score:", score);
            record = score;
        }
        else {
            if (LOG.HALTED)
                logProgram("Halted:", program);
        }
        count.halted++
    }
    else if (halted === false) {
        if (LOG.NONHALTED)
            logProgram("Nonhalted:", program);
        count.nonhalted++;
    }
    else if (halted === null) {
        if (LOG.HOLDOUT)
            logProgram("Holdout:", program);
        count.holdout++;
    }

    count.total++;
}

const end = performance.now();

// Results
// ================================================================

log("Total:", count.total);
log("Halted:", count.halted);
log("Nonhalted:", count.nonhalted);
log("Holdout:", count.holdout);
log(`Time: ${((end - start) / 1_000).toFixed(3)}s`);
