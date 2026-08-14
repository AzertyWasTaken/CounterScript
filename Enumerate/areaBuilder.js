"use strict";
import {NextState, NextStack} from "./nextState.js";
import {Enum} from "./enumActions.js";

function checkHaltedErrors(halted, idx, state) {
    if (halted === null) {
        throw new Error(
            `Loop execution timed out at area index ${idx}.`
            + `Current progLength: ${state.progLength}.`
        );
    }

    if (halted === false) {
        throw new Error(
            `Loop is non-halting at area index ${idx}.`
            + `Current progLength: ${state.progLength}.`
        );
    }
}

// Build the initial enumeration stack and state from an `area` prefix. 
// The area is a sequence of predefined instructions that kickstart enumeration.
// Errors include context about the failing instruction index and area description.
export function buildArea(area) {
    const stack = NextStack.default();
    let state = NextState.default();

    for (let idx = 0; idx < area.length; idx++) {
        const instr = area[idx];

        if (instr.type === "exit") {
            if (stack.length <= 1) {
                throw new Error(
                    `Cannot exit loop: no loop body to exit from at area index ${idx}. `
                    + `Stack depth is ${stack.length}.`
                );
            }

            const [halted, exeState] = Enum.runLoopBody(stack, state);
            checkHaltedErrors(halted, idx, state);
            Enum.setLoopAnalysis(stack);

            // Loop halted normally — exit body and generate the tail.
            const {state: newState} = Enum.exitLoopBody(stack, state, halted, exeState);
            state = newState;
        }
        else if (instr.type === "while") {
            const {state: newState} = Enum.appWhileLoop(stack, state, instr);
            state = newState;
        }
        else {
            const {state: newState} = Enum.appBasicInstr(stack, state, instr);
            state = newState;
        }
    }

    return [stack, state];
}
