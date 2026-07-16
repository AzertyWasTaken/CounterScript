"use strict";
// Methods to update enumeration stack
export const NextStack = {
    default() {
        return [{
            program: [],
            loopVar: null,
            callStack: null
        }];
    },

    frame(instr, exeStack) {
        return {
            program: instr.body,
            loopVar: instr.var,
            callStack: exeStack
        };
    },
}
