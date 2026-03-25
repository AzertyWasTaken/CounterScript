"use strict";
import {print} from "./print.js";
import {config} from "./config.js";
import {unparse} from "./unparse.js";
import {enumerate} from "./enumerate.js";
import {execute} from "./execute.js";
import {canHalt} from "./canHalt.js";

let total = 0;
let halted = 0;
let holdouts = 0;

let record = 0;

function getMaxValue(variables) {
    let max = 0;
    for (const value in variables) {
        max = Math.max(max, variables[value]);
    }
    return max;
}

for (const prog of enumerate(config.progLength)) {
    if (!canHalt(prog)) {continue;}

    const result = execute(prog, config.maxSteps);
    
    if (result.halted) {
        halted++;

        const maxValue = getMaxValue(result.vars);

        if (maxValue > record) {
            if (config.printRecord) {
                print("Record:", unparse(prog));
                print("Score:", maxValue);
            }

            record = maxValue;

        } else {
            if (config.printHalted) {print("Halted:", unparse(prog))};
        }
    
    } else {
        holdouts++;
        if (config.printNonHalted) {print("Timed out:", unparse(prog))};
    }
    
    total++;
}

print("Total: ", total);
print("Halted: ", halted);
print("Holdouts: ", holdouts);