"use strict";
import {ENUM} from "../config.js";
import {NextState, NextStack} from "./nextState.js";
import {ExeStack} from "../Execute/exeStack.js";
import {Counters} from "../Execute/counters.js";
import {execute} from "../Execute/execute.js";
import {analyzeLoop} from "../Pruning/loopAnalyzer.js";
import {Value} from "../Pruning/valueProps.js";

// Append basic instructions
// ================================================================

// Apply a basic instruction (inc/dec) to the abstract value of its counter.
// An increment adds 1 to the value; a decrement subtracts 1.
function applyAnalysisInstr(value, instr) {
    return instr.type === "inc"
    ? Value.decAndInc(value, 0, 1)
    : Value.decAndInc(value, 1, 0);
}

// Append a basic instruction (inc/dec) to the current frame.
// Returns {state, undo} so the caller can revert.
function appBasicInstr(stack, state, instr) {
    const frame = stack.at(-1);
    frame.program.push(instr);

    let savedAnalysis = null;

    if (frame.analysis) {
        // We're inside a loop body — update the abstract analysis.
        savedAnalysis = Value.get(frame.analysis, instr.var);
        const nextValue = applyAnalysisInstr(savedAnalysis, instr);
        Value.set(frame.analysis, instr.var, nextValue);
    }

    return {
        state: NextState.basicInstr(state, instr),
        undo: () => {
            frame.program.pop();
            if (savedAnalysis !== null)
                Value.set(frame.analysis, instr.var, savedAnalysis);
        }
    };
}

// Append while loops
// ================================================================

// Append a while-loop header to the current frame.
// Returns {state, undo} so the caller can revert.
function appWhileLoop(stack, state, instr) {
    const frame = stack.at(-1);
    frame.program.push(instr);

    // Go to the loop body if the loop condition is true.
    if (!Counters.isZero(state.vars, instr.var)) {
        instr.body = [];
        stack.push(NextStack.frame(instr, []));

        return {
            state: NextState.loopVar(state, instr, 0),
            undo: () => {
                stack.pop();
                frame.program.pop();
                instr.body = undefined;
            }
        };
    }

    // Loop condition is false — body is empty, only count the header.
    // State analysis is unknown if a loop body is unknown.
    const savedAnalysis = frame.analysis;
    frame.analysis = {eq: [], def: {t: "isAtLeast", v: 0}};
    Value.set(frame.analysis, instr.var, {t: "isEqualTo", v: 0});

    return {
        state: NextState.loopVar(state, instr, 1),
        undo: () => {
            frame.program.pop();
            frame.analysis = savedAnalysis;
            instr.body = undefined;
        }
    };
}

// Run loops bodies
// ================================================================

// Execute the current frame's loop body.
// Returns [halted, exeState] where halted is true/false/null/undefined.
function runLoopBody(stack, state) {
    const frame = stack.at(-1);
    const callStack = ExeStack.cloneStack(frame.callStack);

    if (!Counters.isZero(state.vars, frame.loopVar)) {
        callStack.push(
            ExeStack.newFrame(frame.program, frame.loopVar, state.vars)
        );
    }

    // Execute the loop if the loop condition still holds.
    return execute({maxSteps: ENUM.MAX_STEPS, deciders: true}, {
        vars: [...state.vars],
        steps: state.steps,
        stack: callStack
    });
}

// Get loop analysis
// ================================================================

// Shallow-copy the portion of analysis state that `loopBody` may mutate.
// Note: `analysisState.def` is immutable.
function cloneAnalysisState(analysisState) {
    return {
        eq: [...analysisState.eq],
        def: analysisState.def
    };
}

// Merge the just-completed loop body's analysis into its enclosing frame,
// then mark the loop variable as exhausted (zero). Returns a copy of the
// enclosing analysis before the merge, so the write can be undone later.
function mergeLoopAnalysis(parentFrame, bodyFrame) {
    const parentState = parentFrame.analysis;
    const bodyState = bodyFrame.analysis;
    const loopVar = bodyFrame.loopVar;

    const saved = cloneAnalysisState(parentState);

    const headValue = Value.get(parentState, loopVar);
    const bodyValue = Value.get(bodyState, loopVar);
    const iterations = Value.countIterations(headValue, bodyValue);

    Value.loopBody(parentState, bodyState, iterations, loopVar);
    return saved;
}

// Update analysis state when a while-loop ends.
// Return saved analysis so it can be undone.
// If program should be pruned, do not update state analysis.
function getLoopAnalysis(stack) {
    const parentFrame = stack.at(-2);
    if (!parentFrame.analysis) return [null, false];
    const bodyFrame = stack.at(-1);

    // Check if an undefined loop just got a body
    if (bodyFrame.callStack.length > 0) {
        // Redo the analysis to increase its precision.
        const savedAnalysis = parentFrame.analysis;

        const newAnalysis = analyzeLoop(parentFrame.program, parentFrame.loopVar);
        if (newAnalysis === null) return [savedAnalysis, true];

        const bodyValue = Value.get(newAnalysis, parentFrame.loopVar);
        if (Value.isNonhalting(bodyValue)) return [savedAnalysis, true];

        parentFrame.analysis = newAnalysis;

        return [savedAnalysis, false];
    }

    // Keep a copy of the enclosing analysis to restore on undo.
    return [mergeLoopAnalysis(parentFrame, bodyFrame), false];
}

// Exit loops generation
// ================================================================

// Pop the completed loop body frame and merge abstract analysis states.
// Then decide whether to generate a loop tail or start a nested loop body.
function exitLoopBody(stack, state, halted, exeState) {
    const parentFrame = stack.at(-2);
    const bodyFrame = stack.pop();

    if (halted === true) {
        // Loop terminated normally — generate loop tail.
        return {
            state: NextState.loopBody(state, exeState, 0),
            undo: () => {
                stack.push(bodyFrame);
            }
        };
    }

    // `halted` is undefined: execution is "in progress" inside the stack.
    // The next loop body needs to be expanded.
    const loopInstr = ExeStack.getInstruction(ExeStack.getFrame(exeState));
    loopInstr.body = [];

    stack.push(NextStack.frame(loopInstr, exeState.stack));
    
    return {
        state: NextState.loopBody(state, exeState, 1),
        undo: () => {
            loopInstr.body = undefined;
            stack.pop();
            stack.push(bodyFrame);
        }
    };
}

// Export library
// ================================================================

export const Enum = {
    appBasicInstr,
    appWhileLoop,
    runLoopBody,
    getLoopAnalysis,
    exitLoopBody
};
