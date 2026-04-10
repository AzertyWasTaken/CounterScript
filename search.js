"use strict";
import {log} from "./log.js";
import {enumerate} from "./enumerate.js";
import {unparse} from "./unparse.js";

let total = 0;
let halted = 0;
let nonhalted = 0;
let holdouts = 0;

let record = 0;

export function search(config) {
    for (const result of enumerate(config.progLength)) {
        const prog = result.prog;

        if (result.halted === true) {
            halted++;

            if (config.logRecord) {
                const score = Math.max(...Object.values(result.vars));

                if (score > record) {
                    if (config.logRecord) {
                        log("Record:", unparse(prog));
                        log("Score:", score);
                    }
                    record = score;
                }
            }

            if (config.logHalted) {log("Halted:", unparse(prog))};

        } else if (result.halted === false) {
            nonhalted++;
            if (config.logNonhalted) {log("Nonhalted:", unparse(prog))};

        } else if (result.halted === null) {
            holdouts++;
            if (config.logHoldout) {log("Holdout:", unparse(prog))};
        }

        total++;
        if (total > config.programsCount) {break;}
    }

    log("Total: ", total);
    log("Halted: ", halted);
    log("Nonhalted: ", nonhalted);
    log("Holdouts: ", holdouts);   
}