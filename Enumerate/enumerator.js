"use strict";
import {ENUM} from "../config.js";
import {Prune} from "../Pruning/pruner.js";
import {NextState} from "./nextState.js";
import {buildArea} from "./areaBuilder.js";
import {Enum} from "./enumActions.js";

// Generate basic instructions
// ================================================================

// Decode an instruction id into {type, var}.
function decodeInstr(id) {
    return {
        type: id % 2 === 0 ? "dec" : "inc",
        var: Math.floor(id / 2)
    };
}

// Generate all valid basic instructions (inc/dec) for the current state.
// Each candidate is pruned, applied, recursed into, then undone.
function* genBasicInstr(stack, state) {
    const maxInstrId = (state.maxVar + 1) * 2;

    for (let instrId = state.minInstr; instrId < maxInstrId; instrId++) {
        const instr = decodeInstr(instrId);
        if (Prune.basicInstr(stack, state, instr)) continue;

        const {state: newState, undo} = Enum.appBasicInstr(stack, state, instr);
        yield* nextInstr(stack, newState);
        undo();
    }
}

// Generate while-loops
// ================================================================

// Generate all valid while-loop headers for the current state.
// The body is left undefined — it will be filled in by appWhileLoop if needed.
function* genWhileLoop(stack, state) {
    const maxVarId = state.maxVar + 1;

    for (let varId = 0; varId < maxVarId; varId++) {
        const instr = {type: "while", var: varId, body: undefined};
        if (Prune.loopVar(stack, state, instr)) continue;

        const {state: newState, undo} = Enum.appWhileLoop(stack, state, instr);
        yield* nextInstr(stack, newState);
        undo();
    }
}

// End program
// ================================================================

// Yield a completed program if it passes pruning.
// `program` and `state` are mutable references (not cloned) for performance.
function* yieldProgram(halted, program, state) {
    if (Prune.program(halted, program, state)) return;
    yield [halted, program, state];
}

// Handle the case where the current program segment being built is "complete".
function* endProgram(stack, state) {
    if (stack.length <= 1) {
        // Root level: program completed — yield as halted.
        yield* yieldProgram(true, stack.at(-1).program, state);
        return;
    }

    // We are inside a loop body that has just been completed.
    if (Prune.newLoopBody(stack, state) || Prune.loopBody(stack)) return;

    const [halted, exeState] = Enum.runLoopBody(stack, state);
    if (Prune.undefinedLoop(halted, stack)) return;

    if (halted === false || halted === null) {
        // Loop is proven non-halting or timed out — yield final result.
        if (!Prune.holdout(stack)) {
            yield* yieldProgram(
                halted,
                stack[0].program,
                NextState.holdout(state, exeState)
            );
        }
        return;
    }

    const [savedAnalysis, pruned] = Enum.setLoopAnalysis(stack);
    if (pruned) return;

    // Loop halted normally — exit body and generate the tail.
    const {state: newState, undo} =
    Enum.exitLoopBody(stack, state, halted, exeState);

    yield* nextInstr(stack, newState);

    undo();
    if (savedAnalysis) stack.at(-2).analysis = savedAnalysis;
}

// Main functions
// ================================================================

// Generate all valid instructions.
// `stack` - Program stack (TNF generation frames)
// `state` - Enumeration state (vars, steps, progLength, ...)
function* nextInstr(stack, state) {
    const frame = stack.at(-1);

    // Short-circuit: if the program segment is non-empty, can we end here?
    if (frame.program.length > 0) {
        yield* endProgram(stack, state);
    }

    // Try extending with new instructions, respecting max length.
    if (state.progLength + 1 <= ENUM.MAX_LENGTH) {
        yield* genBasicInstr(stack, state);

        // While loops cost at least 2 (header + body), so check +2.
        if (state.progLength + 2 <= ENUM.MAX_LENGTH) {
            yield* genWhileLoop(stack, state);
        }
    }
}

// Entry point: build the initial stack/state then begin enumeration.
export function enumerate(area = []) {
    return nextInstr(...buildArea(area));
}
