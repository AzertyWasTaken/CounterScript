"use strict";
import {Counters} from "../Execute/counters.js";
import {ENUM} from "../config.js";
import {areVarsOrdered} from "./areVarsOrdered.js";
import {scanVars, hasUndefinedLoop} from "./scanner.js";
import {isLoopNested} from "./isLoopNested.js";
import {filterLoop} from "./loopAnalyzer.js";
import {Value} from "./valueProps.js";

// Methods to prune programs during or after enumeration
export const Prune = {
    // Prune a completed program.
    program(halted, program, state) {
        // Must have exactly `ENUM.MAX_LENGTH` instructions.
        if (state.progLength !== ENUM.MAX_LENGTH) return true;

        const {isValid, incs, decs, whiles} = scanVars(program);
        if (!isValid) return true;

        // Every dec must also be a while-loop variable (the loop "uses" the dec).
        if (decs.difference(whiles).size > 0) return true;

        // At most one extra inc outside while-loops (for halted programs).
        const maxOrphanInc = halted === true ? 1 : 0;
        if (incs.difference(whiles).size > maxOrphanInc) return true;

        // Variable ordering constraint must be satisfied.
        return !areVarsOrdered(program);
    },

    // Prune a basic instruction candidate.
    basicInstr(stack, state, instr) {
        if (stack.length <= 1) {
            // Root level: prune unused decs (counter is 0) and variable symmetry.
            return instr.type === "dec"
            && Counters.isZero(state.vars, instr.var)
            || Counters.isEqualToPrev(state.vars, instr.var);
        }

        // Inside a loop: prune dec on a counter abstractly proven zero.
        return instr.type === "dec"
        && Value.isZero(Value.get(stack.at(-1).analysis, instr.var));
    },

    // Prune a while-loop candidate.
    loopVar(stack, state, instr) {
        if (stack.length <= 1) {
            return Counters.isZero(state.vars, instr.var)
            || Counters.isEqualToPrev(state.vars, instr.var)
        }

        return Value.isZero(Value.get(stack.at(-1).analysis, instr.var));
    },

    // Prune a newly-completed loop body.
    newLoopBody(stack, state) {
        const frame = stack.at(-1);
        const program = frame.program;
        const loopVar = frame.loopVar;

        const bodyState = frame.analysis;
        const bodyValue = Value.get(bodyState, loopVar);
        // Prune if body is provably non-halting.
        if (Value.isNonhalting(bodyValue)) return true;

        // Root-level: runtime counter checks replace abstract analysis.
        if (stack.length <= 2) {
            // Loop condition counter is already zero — body would never run.
            if (Counters.isZero(state.vars, loopVar)) return true;

            // Remaining tail is too short — skip uninteresting suffix.
            const tailLength = ENUM.MAX_LENGTH - state.progLength;
            if (tailLength > 0 && tailLength < 4) return true;
        }
        else if (frame.callStack.length === 0) {
            // Nested: abstract analysis determines if loop repeats only once.
            // Must not "jump" a layer to prevent incorrect pruning.
            const parentFrame = stack.at(-2);
            const parentState = parentFrame.analysis;
            const parentValue = Value.get(parentState, loopVar);

            const repeatCount = Value.countIterations(parentValue, bodyValue);
            if (Value.isOne(repeatCount)) return true;
        }

        // Prune if nesting or ordering is violated.
        return isLoopNested(program, new Set([loopVar]))
        || !areVarsOrdered(program);
    },

    // Prune intermediate layers when a nested loop body is generated.
    // Checks every frame on the execution stack for validity.
    loopBody(stack) {
        const callStack = stack.at(-1).callStack;
        if (callStack.length === 0) return false;

        for (let i = 0; i < callStack.length; i++) {
            const item = callStack[i];
            const program = item.block;
            const loopVar = item.loopVar;

            if (
                isLoopNested(program, new Set([loopVar]))
                || !areVarsOrdered(program)
            ) return true;
        }

        const item = callStack[0];
        const program = item.block;
        const loopVar = item.loopVar;

        return filterLoop(program, loopVar);
    },

    // Prune programs that would be holdouts but contain invalid nesting.
    // Checks all loop frames in the generation stack (excluding root).
    holdout(stack) {
        for (const frame of stack.slice(1)) {
            const program = frame.program;
            const loopVar = frame.loopVar;

            if (
                isLoopNested(program, new Set([loopVar]))
                || !areVarsOrdered(program)
            ) return true;

            const bodyState = frame.analysis;
            const bodyValue = Value.get(bodyState, loopVar);
            // Prune if body is provably non-halting.
            if (Value.isNonhalting(bodyValue)) return true;
        }

        return false;
    },

    // Prune root-level loops with undefined (unexpanded) bodies when halted.
    // Such programs would have infinite loops in undefined regions.
    undefinedLoop(halted, stack) {
        return halted === true
        && stack.length <= 2
        && hasUndefinedLoop(stack.at(-1).program);
    },
}
