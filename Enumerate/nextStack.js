"use strict";
import {defaultState} from "../Pruning/loopAnalyzer.js";

// Methods to update enumeration stack
export const NextStack = {
    default() {
        return [{program: []}];
    },

    frame(instr, exeStack, analysis) {
        return {
            program: instr.body,
            loopVar: instr.var,
            callStack: exeStack,
            analysis: defaultState(instr.var)
        };
    },
}
