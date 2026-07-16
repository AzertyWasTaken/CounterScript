"use strict";
import {executeBasicInstr} from "../Execute/execute.js";
import {CONFIG} from "../main.js";

function maxVarsCount(length) {
    return Math.floor((length + 1) / 3);
}

function getMaxVarId(varId, state) {
    return Math.min(
        Math.max(maxVarsCount(CONFIG.MAX_LENGTH) - 1, 0),
        Math.max(varId + 1, state.maxVar)
    );
}

function encodeInstr(obj) {
    return obj.var * 2
    + (obj.type === "dec" ? 0 : 1);
}

// Methods to update enumeration state
export const NextState = {
    default(defArea) {
        return {
            vars: [],
            steps: 0,
            progLength: 0,
            maxVar: 0,
            minInstr: 0,
            area: defArea
        };
    },

    basicInstr(state, instr) {
        return {
            ...state,
            vars: executeBasicInstr([...state.vars], instr),
            progLength: state.progLength + 1,
            maxVar: getMaxVarId(instr.var, state),
            minInstr: encodeInstr(instr)
        };
    },

    loopVar(state, instr, bodyLength) {
        return {
            ...state,
            progLength: state.progLength + bodyLength + 1,
            maxVar: getMaxVarId(instr.var, state),
            minInstr: 0
        };
    },

    loopBody(state, exeState, bodyLength) {
        return {
            ...state,
            vars: exeState.vars,
            steps: exeState.steps + 1,
            progLength: state.progLength - bodyLength,
            minInstr: 0
        };
    },

    holdout(state, exeState) {
        return {
            ...state,
            vars: exeState.vars,
            steps: exeState.steps
        };
    },
}
