"use strict";
import {log} from "../log.js";
import {CONFIG} from "../main.js";
import {Prune} from "./pruner.js";
import {NextState} from "./nextState.js";
import {execute} from "../Execute/execute.js";
import {Stack} from "../Execute/exeStack.js";
import {Counters} from "../Execute/counters.js";

// Generate instructions
// ================================================================

function decodeInstr(id) {
    return {
        type: id % 2 === 0 ? "dec" : "inc",
        var: Math.floor(id / 2)
    };
}

// Append a basic (non-while) instruction to the program.
function* appBasicInstr(stack, state, instr) {
    const frame = stack.at(-1);

    frame.program.push(instr);
    yield* nextInstr(stack, NextState.basicInstr(state, instr));
    frame.program.pop();
}

function* genBasicInstr(stack, state) {
    for (let instrId = state.minInstr; instrId < (state.maxVar + 1) * 2; instrId++) {
        const instr = decodeInstr(instrId);

        if (!Prune.basicInstr(stack, state, instr))
            yield* appBasicInstr(stack, state, instr);
    }
}

// Generate while loops
// ================================================================

// Append a while instruction to the program.
function* appWhileLoop(stack, state, instr) {
    const frame = stack.at(-1);

    frame.program.push(instr);

    // Go to the loop body if the loop condition is true.
    if (!Counters.isZero(state.vars, instr.var)) {
        instr.body = [];

        stack.push({
            program: instr.body,
            loopVar: instr.var,
            callStack: []
        });
        yield* nextInstr(stack, NextState.loopVar(state, instr, 0));
        stack.pop();
    } else {
        yield* nextInstr(stack, NextState.loopVar(state, instr, 1));
    }

    frame.program.pop();
}

function* genWhileLoop(stack, state) {
    for (let varId = 0; varId < (state.maxVar + 1); varId++) {
        const instr = {type: "while", var: varId, body: undefined};

        if (!Prune.loopVar(stack, state, instr))
            yield* appWhileLoop(stack, state, instr);
    }
}

// Run loop body
// ================================================================

function exeLoop(frame, state) {
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

function* runLoopBody(stack, state) {
    const frame = stack.at(-1);
    const [halted, exeState] = exeLoop(frame, state);

    // Ignore loops that have unused loops.
    if (Prune.undefinedLoop(halted, stack, frame)) return;

    stack.pop();

    if (halted === true) {
        // Generate loop tail.
        yield* nextInstr(stack, NextState.loopBody(state, exeState, 0));
    }
    else if (halted === undefined) {
        // Execution is "in progress" inside the stack: expand the next loop.
        // Instruction that is pointed to by the top frame's pc.
        const loopInstr = Stack.getInstruction(Stack.getFrame(exeState));
        loopInstr.body = [];

        stack.push({
            program: loopInstr.body,
            loopVar: loopInstr.var,
            callStack: exeState.stack
        });
        yield* nextInstr(stack, NextState.loopBody(state, exeState, 1));
        stack.pop();

        // Clear `.body` before continuing sibling enumerations.
        loopInstr.body = undefined;
    }
    else {
        // Terminal case: no more instructions left; yield final program/state.
        if (!Prune.holdout(stack)) {
            yield* yieldProgram(
                halted,
                stack[0].program,
                NextState.holdout(state, exeState)
            );
        }
    }

    stack.push(frame);
}

// Main functions
// ================================================================

function* yieldProgram(halted, program, state) {
    if (!Prune.program(halted, program, state))
        // `program` and `state` are mutable for better time performances
        yield [halted, program, state];
}

function* endProgram(stack, state) {
    // Check if generation is in a loop.
    if (stack.length > 1) {
        // Generate while loop tail.
        if (!Prune.newLoopBody(stack, state) && !Prune.loopBody(stack))
            yield* runLoopBody(stack, state);
    } else {
        yield* yieldProgram(true, stack.at(-1).program, state);
    }
}

function* nextArea(stack, state) {
    const head = state.area.pop();

    if (head.type === "exit") {
        if (stack.length <= 1) throw new Error(`Cannot exit loop`);

        yield* runLoopBody(stack, state);
    }
    else if (head.type === "while") {
        yield* appWhileLoop(stack, state, head);
    }
    else {
        yield* appBasicInstr(stack, state, head);
    } 

    state.area.push(head);
}

/**
 * Enumerate all programs of exactly `len` instructions.
 * `state` keys are the same for each frame.
 * `stack` keys are not global and can have multiple instances.
 */
function* nextInstr(stack, state) {
    if (stack.at(-1).program.length > 0)
        yield* endProgram(stack, state);

    if (state.area.length > 0) {
        yield* nextArea(stack, state);
    } else {
        if (state.progLength + 1 <= CONFIG.MAX_LENGTH) {
            yield* genBasicInstr(stack, state);

            if (state.progLength + 2 <= CONFIG.MAX_LENGTH) {
                yield* genWhileLoop(stack, state);
            }
        }
    }
}

export function enumerate(area = []) {
    // `area` is mutable for better time performances
    return nextInstr(
        [{
            program: [],
            loopVar: null,
            callStack: null
        }],
        NextState.default(area)
    );
}
