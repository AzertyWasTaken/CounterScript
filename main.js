"use strict";
import {log} from "./log.js";
import {enumerate} from "./enumerate.js";
// import {enumerate} from "./enumerate_equation.js"; // OUTDATED
import {unparse, parseArea} from "./parser.js";

const LOG = {
    CHAMPION: true,
    HALTED: false,
    NONHALTED: false,
    HOLDOUT: true,
    SHOW_STATUS: false
}

const MAX_LENGTH = 13;
const AREA = "A+ A+ wA{ B-";
const AREA_ENABLED = true;

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

for (const [halted, program, state] of enumerate(MAX_LENGTH, AREA_ENABLED ? parseArea(AREA) : [])) {
    if (halted === true) {
        const score = Math.max(0, ...Object.values(state.vars));

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

log("Total:", count.total);
log("Halted:", count.halted);
log("Nonhalted:", count.nonhalted);
log("Holdout:", count.holdout);
