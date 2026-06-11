"use strict";
import {log} from "./log.js";
import {execute, executeBasicInstruction, cloneStack, getFrame, getInstruction} from "./execute.js";
import {counters} from "./counters.js";
import {prune} from "./pruner.js";

function maxVarsCount(length) {
    return Math.floor((length + 1) / 3);
}

function getMaxVarId(varId, state) {
    return Math.min(
        maxVarsCount(state.maxLength) - 1,
        Math.max(varId + 1, state.maxVar)
    );
}

// Generate instructions
// ================================================================

// Append every possible basic (non-while) instruction to the program.
export function* genBasicInstr(stack, state) {
    const frame = stack.at(-1);

    for (let instrId = state.minInstr; instrId < (state.maxVar + 1) * 2; instrId++) {
        const instr = {
            type: instrId % 2 === 0 ? "dec" : "inc",
            var: Math.floor(instrId / 2)
        };

        if (prune.basicInstr(stack, state, instr)) continue;
    
        const nextState = {
            ...state,
            vars: executeBasicInstruction([...state.vars], instr),
            progLength: state.progLength + 1,
            maxVar: getMaxVarId(instr.var, state),
            minInstr: instrId
        };

        frame.program.push(instr);
        yield* nextInstr(stack, nextState);
        frame.program.pop();
    }
}

// Generate while loops
// ================================================================

// Append every possible while instructions to the program.
export function* genWhileLoop(stack, state) {
    const frame = stack.at(-1);

    for (let varId = 0; varId < (state.maxVar + 1); varId++) {
        const instr = {type: "while", var: varId, body: undefined};

        if (prune.loopVar(stack, state, instr)) continue;

        const nextState = {
            ...state,
            // Loop body length is 1 by default, increasing total length by 2.
            progLength: state.progLength + 2,
            maxVar: getMaxVarId(varId, state),
            minInstr: 0
        };

        frame.program.push(instr);

        // Go to the loop body if the loop condition is true.
        if (!counters.isZero(state.vars, varId)) {
            instr.body = [];
            nextState.progLength--;

            stack.push({
                program: instr.body,
                loopVar: varId,
                callStack: []
            });
            yield* nextInstr(stack, nextState);
            stack.pop();
        } else {
            yield* nextInstr(stack, nextState);
        }

        frame.program.pop();
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
        posVars: counters.getPosSet(state.vars),
        prevVars: [...state.vars]
    });

    return callStack;
}

function exeLoop(frame, state) {
    const exeStack = counters.isZero(state.vars, frame.loopVar)
    ? frame.callStack : appCallStack(frame, state);

    // Execute the loop if the loop condition still holds.
    return execute({maxSteps: 100, deciders: true}, {
        vars: [...state.vars],
        steps: state.steps,
        stack: exeStack
    });
}

export function* runLoopBody(frame, stack, state) {
    const [halted, exeState] = exeLoop(frame, state);

    // Ignore loops that have unused loops.
    if (prune.undefinedLoop(halted, stack, frame)) return;

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
        yield* yieldProgram(halted, stack[0].program, state);
    }
}

// Main functions
// ================================================================

function* yieldProgram(halted, program, state) {
    if (!prune.program(halted, program, state))
        yield [halted, program, state];
}

function* endProgram(stack, state, frame) {
    // Check if generation is in a loop.
    if (stack.length > 1) {
        if (prune.loopBody(stack, state, frame)) return;

        // Generate while loop tail.
        stack.pop();
        yield* runLoopBody(frame, stack, state);
        stack.push(frame);
    } else {
        yield* yieldProgram(true, frame.program, state);
    }
}

/**
 * Enumerate all programs of exactly `len` instructions.
 * `state` keys are the same for each frame.
 * `stack` keys are not global and can have multiple instances.
 */
export function* nextInstr(stack, state) {
    const frame = stack.at(-1);

    if (frame.program.length > 0)
        yield* endProgram(stack, state, frame);

    if (state.progLength + 1 <= state.maxLength) {
        yield* genBasicInstr(stack, state);

        if (state.progLength + 2 <= state.maxLength)
            yield* genWhileLoop(stack, state);
    }
}

export function enumerate(maxLength) {
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
            minInstr: 0
        }
    );
}
