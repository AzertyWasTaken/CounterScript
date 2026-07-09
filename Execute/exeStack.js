"use strict";
import {Counters} from "./counters.js";
// Methods related to execution stack and frames

export const Stack = {
    // Clone every keys of `stack` items except block
    cloneStack(stack) {
        const clone = [];

        for (const item of stack) {
            clone.push({
                block: item.block,
                pc: item.pc,
                loopVar: item.loopVar,
                posVars: new Set(item.posVars),
                prevVars: [...item.prevVars],
            });
        }

        return clone;
    },

    getCtx(program) {
        return {
            vars: [],
            steps: 0,
            stack: [{block: program, pc: 0}]
        };
    },

    getFrame(ctx) {
        return ctx.stack.at(-1);
    },

    getInstruction(frame) {
        return frame.block[frame.pc];
    },

    // New frame to append when a loop is executed
    newFrame(program, loopVar, vars) {
        return {
            block: program,
            pc: 0,
            loopVar: loopVar,
            posVars: Counters.getPosSet(vars),
            prevVars: [...vars]
        };
    },

    // Update `frame` for the next loop iteration
    updateFrame(frame, vars) {
        frame.pc = 0;
        frame.posVars = Counters.getPosSet(vars);
        frame.prevVars = [...vars];
    }
}
