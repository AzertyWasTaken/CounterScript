"use strict";
import {log} from "../log.js";
import {CONFIG} from "../main.js";
import {Prune} from "../Pruning/pruner.js";
import {NextState} from "./nextState.js";
import {NextStack} from "./nextStack.js";
import {buildArea} from "./areaBuilder.js";
import {
    appBasicInstr,
    appWhileLoop,
    runLoopBody,
    exitLoopBody
} from "./enumActions.js";

// Generate basic instructions
// ================================================================

function decodeInstr(id) {
    return {
        type: id % 2 === 0 ? "dec" : "inc",
        var: Math.floor(id / 2)
    };
}

function* genBasicInstr(stack, state) {
    for (let instrId = state.minInstr; instrId < (state.maxVar + 1) * 2; instrId++) {
        const instr = decodeInstr(instrId);
        if (Prune.basicInstr(stack, state, instr)) continue;

        const [newState, undo] = appBasicInstr(stack, state, instr);
        yield* nextInstr(stack, newState);
        undo();
    }
}

// Generate while loops
// ================================================================

function* genWhileLoop(stack, state) {
    for (let varId = 0; varId < (state.maxVar + 1); varId++) {
        const instr = {type: "while", var: varId, body: undefined};
        if (Prune.loopVar(stack, state, instr)) continue;

        const [newState, undo] = appWhileLoop(stack, state, instr);
        yield* nextInstr(stack, newState);
        undo();
    }
}

// Main functions
// ================================================================

function* yieldProgram(halted, program, state) {
    if (Prune.program(halted, program, state)) return;
    // `program` and `state` are mutable for better time performances
    yield [halted, program, state];
}

function* endProgram(stack, state) {
    // Check if generation is in a loop or if program halted.
    if (stack.length > 1) {
        if (Prune.newLoopBody(stack, state) || Prune.loopBody(stack)) return;

        const [halted, exeState] = runLoopBody(stack, state);
        if (Prune.undefinedLoop(halted, stack)) return;

        const [newState, undo] = exitLoopBody(stack, state, halted, exeState);
        if (newState === null) {
            // Terminal case: no more instructions left; yield final program/state.
            if (!Prune.holdout(stack)) {
                yield* yieldProgram(
                    halted,
                    stack[0].program,
                    NextState.holdout(state, exeState)
                );
            }
        } else {
            yield* nextInstr(stack, newState);
        }

        undo();
    } else {
        yield* yieldProgram(true, stack.at(-1).program, state);
    }
}

/**
 * Enumerate all programs of exactly `len` instructions.
 * `state` keys are the same for each frame.
 * `stack` keys are not global and can have multiple instances.
 */
function* nextInstr(stack, state) {
    if (stack.at(-1).program.length > 0) {
        yield* endProgram(stack, state);
    }

    if (state.progLength + 1 <= CONFIG.MAX_LENGTH) {
        yield* genBasicInstr(stack, state);

        if (state.progLength + 2 <= CONFIG.MAX_LENGTH) {
            yield* genWhileLoop(stack, state);
        }
    }
}

export function enumerate(area = []) {
    return nextInstr(...buildArea(area));
}
