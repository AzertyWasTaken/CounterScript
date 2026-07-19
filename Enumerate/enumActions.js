"use strict";
import {CONFIG} from "../main.js";
import {NextState} from "./nextState.js";
import {NextStack} from "./nextStack.js";
import {Stack} from "../Execute/exeStack.js";
import {Counters} from "../Execute/counters.js";
import {execute} from "../Execute/execute.js";

// Generate basic instructions
// ================================================================

export function appBasicInstr(stack, state, instr) {
    const frame = stack.at(-1);
    frame.program.push(instr);
    return [
        NextState.basicInstr(state, instr),
        () => frame.program.pop()
    ];
}

// Generate while loops
// ================================================================

export function appWhileLoop(stack, state, instr) {
    const frame = stack.at(-1);
    frame.program.push(instr);

    // Go to the loop body if the loop condition is true.
    if (!Counters.isZero(state.vars, instr.var)) {
        instr.body = [];

        stack.push(NextStack.frame(instr, []));
        return [
            NextState.loopVar(state, instr, 0),
            () => {
                stack.pop();
                frame.program.pop();
            }
        ];
    }

    return [
        NextState.loopVar(state, instr, 1),
        () => frame.program.pop()
    ];
}

// Run loop body
// ================================================================

export function runLoopBody(stack, state) {
    const frame = stack.at(-1);
    const callStack = Stack.cloneStack(frame.callStack);

    if (!Counters.isZero(state.vars, frame.loopVar))
        callStack.push(Stack.newFrame(frame.program, frame.loopVar, state.vars));

    // Execute the loop if the loop condition still holds.
    return execute({maxSteps: CONFIG.MAX_STEPS, deciders: true}, {
        vars: [...state.vars],
        steps: state.steps,
        stack: callStack
    });
}

// Exit loop body
// ================================================================

export function exitLoopBody(stack, state, halted, exeState) {
    const frame = stack.pop();

    if (halted === true) {
        // Generate loop tail.
        return [
            NextState.loopBody(state, exeState, 0),
            () => stack.push(frame)
        ];
    }
    else if (halted === undefined) {
        // Execution is "in progress" inside the stack: expand the next loop.
        // Instruction that is pointed to by the top frame's pc.
        const loopInstr = Stack.getInstruction(Stack.getFrame(exeState));
        loopInstr.body = [];

        stack.push(NextStack.frame(loopInstr, exeState.stack));

        return [
            NextState.loopBody(state, exeState, 1),
            () => {
                loopInstr.body = undefined;
                stack.pop();
                stack.push(frame);
            }
        ];
    }
    else {
        return [
            null,
            () => stack.push(frame)
        ];
    }
}
