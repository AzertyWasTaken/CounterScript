"use strict";
import {ENUM} from "../config.js";
import {NextState} from "./nextState.js";
import {NextStack} from "./nextStack.js";
import {ExeStack} from "../Execute/exeStack.js";
import {Counters} from "../Execute/counters.js";
import {execute} from "../Execute/execute.js";
import {loopBody, decAndInc, countIterations}
from "../Pruning/loopAnalyzer.js";
import {Value} from "../Pruning/valueProps.js";

// Shallow-copy the portion of analysis state that `loopBody` may mutate.
// Note: `analysisState.def` is immutable.
function cloneAnalysisState(analysisState) {
    return {
        eq: [...analysisState.eq],
        def: analysisState.def
    };
}

// Apply a basic instruction (inc/dec) to the abstract value of its counter.
// An increment adds 1 to the value; a decrement subtracts 1.
function applyAnalysisInstr(value, instr) {
    return instr.type === "inc"
    ? decAndInc(value, 0, 1)
    : decAndInc(value, 1, 0);
}

// Merge the just-completed loop body's analysis into its enclosing frame,
// then mark the loop variable as exhausted (zero). Returns a copy of the
// enclosing analysis before the merge, so the write can be undone later.
function mergeLoopAnalysis(enclosingFrame, bodyFrame) {
    const analysisState = enclosingFrame.analysis;
    const bodyState = bodyFrame.analysis;
    const loopVar = bodyFrame.loopVar;

    const saved = cloneAnalysisState(analysisState);

    const headValue = Value.get(analysisState, loopVar);
    const bodyValue = Value.get(bodyState, loopVar);
    const iterations = countIterations(headValue, bodyValue);

    loopBody(analysisState, bodyState, iterations, loopVar);
    return saved;
}

export const Enum = {
    // Append a basic instruction (inc/dec) to the current frame.
    // Returns {state, undo} so the caller can revert.
    appBasicInstr(stack, state, instr) {
        const frame = stack.at(-1);
        frame.program.push(instr);

        let savedAnalysisValue;

        if (stack.length > 1) {
            // We're inside a loop body — update the abstract analysis.
            savedAnalysisValue = Value.get(frame.analysis, instr.var);
            Value.set(
                frame.analysis,
                instr.var,
                applyAnalysisInstr(savedAnalysisValue, instr)
            );
        }

        return {
            state: NextState.basicInstr(state, instr),
            undo: () => {
                frame.program.pop();
                if (savedAnalysisValue !== undefined)
                    Value.set(frame.analysis, instr.var, savedAnalysisValue);
            }
        };
    },

    // Append a while-loop header to the current frame.
    // Returns {state, undo} so the caller can revert.
    appWhileLoop(stack, state, instr) {
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
        // Default value is unknown if a loop body is unknown (ignore other keys).
        const savedAnalysisState = frame.analysis;
        frame.analysis = {eq: [], def: {t: "isAtLeast", v: 0}};
        Value.set(frame.analysis, instr.var, {t: "isEqualTo", v: 0});

        return {
            state: NextState.loopVar(state, instr, 1),
            undo: () => {
                frame.program.pop();
                frame.analysis = savedAnalysisState;
                instr.body = undefined;
            }
        };
    },

    // Execute the current frame's loop body.
    // Returns [halted, exeState] where halted is true/false/null/undefined.
    runLoopBody(stack, state) {
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
    },

    // Pop the completed loop body frame and merge abstract analysis states.
    // Then decide whether to generate a loop tail or start a nested loop body.
    exitLoopBody(stack, state, halted, exeState) {
        const frame = stack.pop();
        const prevFrame = stack.at(-1);

        let savedAnalysisState;

        if (stack.length > 1) {
            // Keep a copy of the enclosing analysis to restore on undo.
            savedAnalysisState = mergeLoopAnalysis(prevFrame, frame);
        }

        if (halted === true) {
            // Loop terminated normally — generate loop tail.
            return {
                state: NextState.loopBody(state, exeState, 0),
                undo: () => {
                    stack.push(frame);
                    if (savedAnalysisState !== undefined)
                        prevFrame.analysis = savedAnalysisState;
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
                stack.push(frame);
                if (savedAnalysisState !== undefined)
                    prevFrame.analysis = savedAnalysisState;
            }
        };
    }
}
