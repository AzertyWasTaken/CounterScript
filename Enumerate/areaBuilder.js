"use strict";
import {NextState} from "./nextState.js";
import {NextStack} from "./nextStack.js";
import {
    appBasicInstr,
    appWhileLoop,
    runLoopBody,
    exitLoopBody
} from "./enumActions.js";

export function buildArea(area) {
    const stack = NextStack.default();
    let state = NextState.default();

    for (const instr of area) {
        if (instr.type === "exit") {
            if (stack.length <= 1) throw new Error(`Cannot exit loop`);
            const [halted, exeState] = runLoopBody(stack, state);
            const [newState, undo] = exitLoopBody(stack, state, halted, exeState);

            if (newState === null) throw new Error(`Loop is nonhalting or timed out`);
            state = newState;
        }
        else if (instr.type === "while") {
            const [newState, undo] = appWhileLoop(stack, state, instr);
            state = newState;
        }
        else {
            const [newState, undo] = appBasicInstr(stack, state, instr);
            state = newState;
        }
    }

    return [stack, state];
}
