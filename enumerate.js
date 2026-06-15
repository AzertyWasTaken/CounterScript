"use strict";
import {log} from "./log.js";
import {execute, executeBasicInstruction, cloneStack, getFrame, getInstruction} from "./execute.js";
import {Counters} from "./counters.js";
import {Prune} from "./pruner.js";

function maxVarsCount(length) {
    return Math.floor((length + 1) / 3);
}

function getMaxVarId(varId, state) {
    return Math.min(
        Math.max(maxVarsCount(state.maxLength) - 1, 0),
        Math.max(varId + 1, state.maxVar)
    );
}

// Generate instructions
// ================================================================

function decodeInstr(id) {
    return {
        type: id % 2 === 0 ? "dec" : "inc",
        var: Math.floor(id / 2)
    };
}

function encodeInstr(obj) {
    return obj.var * 2
    + (obj.type === "dec" ? 0 : 1);
}

// Append a basic (non-while) instruction to the program.
export function* appBasicInstr(stack, state, instr) {
    const frame = stack.at(-1);

    const nextState = {
        ...state,
        vars: executeBasicInstruction([...state.vars], instr),
        progLength: state.progLength + 1,
        maxVar: getMaxVarId(instr.var, state),
        minInstr: encodeInstr(instr)
    };

    frame.program.push(instr);
    yield* nextInstr(stack, nextState);
    frame.program.pop();
}

export function* genBasicInstr(stack, state) {
    for (let instrId = state.minInstr; instrId < (state.maxVar + 1) * 2; instrId++) {
        const instr = decodeInstr(instrId);

        if (!Prune.basicInstr(stack, state, instr))
            yield* appBasicInstr(stack, state, instr);
    }
}

// Generate while loops
// ================================================================

// Append a while instruction to the program.
export function* appWhileLoop(stack, state, instr) {
    const frame = stack.at(-1);

    const nextState = {
        ...state,
        // Loop body length is 1 by default, increasing total length by 2.
        progLength: state.progLength + 2,
        maxVar: getMaxVarId(instr.var, state),
        minInstr: 0
    };

    frame.program.push(instr);

    // Go to the loop body if the loop condition is true.
    if (!Counters.isZero(state.vars, instr.var)) {
        instr.body = [];
        nextState.progLength--;

        stack.push({
            program: instr.body,
            loopVar: instr.var,
            callStack: []
        });
        yield* nextInstr(stack, nextState);
        stack.pop();
    } else {
        yield* nextInstr(stack, nextState);
    }

    frame.program.pop();
}

export function* genWhileLoop(stack, state) {
    for (let varId = 0; varId < (state.maxVar + 1); varId++) {
        const instr = {type: "while", var: varId, body: undefined};

        if (!Prune.loopVar(stack, state, instr))
            yield* appWhileLoop(stack, state, instr);
    }
}

// Run loop body
// ================================================================

// Create a new `callStack` frame so the interpreter can execute the loop.
function appCallStack(frame, state) {
    const callStack = cloneStack(frame.callStack);

    callStack.push({
        block: frame.program,
        pc: 0,
        loopVar: frame.loopVar,
        // Cache positional infos used by deciders.
        posVars: Counters.getPosSet(state.vars),
        prevVars: [...state.vars]
    });

    return callStack;
}

function exeLoop(frame, state) {
    const exeStack = Counters.isZero(state.vars, frame.loopVar)
    ? frame.callStack : appCallStack(frame, state);

    // Execute the loop if the loop condition still holds.
    return execute({maxSteps: 100, deciders: true}, {
        vars: [...state.vars],
        steps: state.steps,
        stack: exeStack
    });
}

export function* runLoopBody(stack, state, frame) {
    const [halted, exeState] = exeLoop(frame, state);

    // Ignore loops that have unused loops.
    if (Prune.undefinedLoop(halted, stack, frame)) return;

    stack.pop();

    const nextState = {
        ...state,
        vars: exeState.vars,
        steps: exeState.steps + 1,
        minInstr: 0
    };

    if (halted === true) {
        // Generate loop tail.
        yield* nextInstr(stack, nextState);
    }
    else if (halted === undefined) {
        // Execution is "in progress" inside the stack: expand the next loop.
        nextState.progLength--;

        // Instruction that is pointed to by the top frame's pc.
        const nextFrame = getFrame(exeState);
        const loopInstr = getInstruction(nextFrame);
        loopInstr.body = [];

        stack.push({
            program: loopInstr.body,
            loopVar: loopInstr.var,
            callStack: exeState.stack
        });
        yield* nextInstr(stack, nextState);
        stack.pop();

        // Clear `.body` before continuing sibling enumerations.
        loopInstr.body = undefined;
    }
    else {
        // Terminal case: no more instructions left; yield final program/state.
        if (!Prune.holdout(stack)) {
            yield* yieldProgram(halted, stack[0].program, state);
        }
    }

    stack.push(frame);
}

// Main functions
// ================================================================

function* yieldProgram(halted, program, state) {
    if (!Prune.program(halted, program, state))
        yield [halted, program, state];
}

function* endProgram(stack, state) {
    const frame = stack.at(-1);

    // Check if generation is in a loop.
    if (stack.length > 1) {
        // Generate while loop tail.
        if (!Prune.loopBody(stack, state, frame))
            yield* runLoopBody(stack, state, frame);
    } else {
        yield* yieldProgram(true, frame.program, state);
    }
}

function* nextArea(stack, state) {
    const head = state.area.at(-1);

    state.area.pop();

    if (head.type === "exit") {
        yield* runLoopBody(stack, state, stack.at(-1));
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
export function* nextInstr(stack, state) {
    if (stack.at(-1).program.length > 0)
        yield* endProgram(stack, state);

    if (state.area.length > 0) {
        yield* nextArea(stack, state);
    } else {
        if (state.progLength + 1 <= state.maxLength) {
            yield* genBasicInstr(stack, state);

            if (state.progLength + 2 <= state.maxLength) {
                yield* genWhileLoop(stack, state);
            }
        }
    }
}

export function enumerate(maxLength, area) {
    return nextInstr(
        [{
            program: [],
            loopVar: null,
            callStack: null
        }],
        {
            vars: [],
            steps: 0,
            progLength: 0,
            maxLength,
            maxVar: 0,
            minInstr: 0,
            area: area
        }
    );
}
