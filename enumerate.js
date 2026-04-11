"use strict";
import {hasDec} from "./canHalt.js";
import {getUsedVars} from "./getUsedVars.js";
import {isLoopUseful} from "./isLoopUseful.js";
import {execute, getVar} from "./execute.js";
import {hasVar} from "./hasVar.js";

function copy(obj, prop) {
    return {...obj, ...prop};
}

function decodeInstruction(instrIndex) {
    return {
        type: instrIndex % 2 === 0 ? "dec" : "inc",
        var: Math.floor(instrIndex / 2),
    };
}

function compareVars(vars, index) {
    return index > 0 && getVar(vars, index) === getVar(vars, index - 1);
}

function* enumerateInstructions(length, param) {
    const maxInstrIndex = (param.usedVars + 1) * 2;

    for (let instrIndex = param.minInstr; instrIndex < maxInstrIndex; instrIndex++) {
        const instr = decodeInstruction(instrIndex);

        if (param.allowedVars && !param.allowedVars.has(instr.var)) {
            continue;
        }

        const nextUsedVars = Math.max(param.usedVars, instr.var + 1);
        if (!param.isInLoop && (nextUsedVars !== param.usedVars && instr.type === "dec" || compareVars(param.vars, instr.var))) {
            continue;
        }

        if (param.isInLoop) {
            param.prefix.push(instr);
            yield* enumerate(length - 1, copy(param, {usedVars: nextUsedVars, minInstr: instrIndex}));
            param.prefix.pop();

        } else {
            const {vars, steps} = execute([instr], 10, {...param.vars}, param.steps);

            param.prefix.push(instr);
            yield* enumerate(length - 1, copy(param, {usedVars: nextUsedVars, minInstr: instrIndex, vars, steps}));
            param.prefix.pop();
        }
    }
}

function* enumerateWhileLoops(length, param) {
    for (let varIndex = 0; varIndex < param.usedVars + 1; varIndex++) {
        const nextUsedVars = Math.max(param.usedVars, varIndex + 1);

        if (!param.isInLoop && (nextUsedVars !== param.usedVars || compareVars(param.vars, varIndex))) {
            continue;
        }

        for (let bodyLen = 1; bodyLen < length; bodyLen++) {
            const tailLength = length - bodyLen - 1;
            if (!param.isInLoop && tailLength > 0 && tailLength < 4) {
                continue;
            }

            for (const data of enumerate(bodyLen, {prefix: [], usedVars: nextUsedVars, minInstr: 0, isInLoop: true, allowedVars: null})) {
                if (
                    !hasDec(data.prog, varIndex) ||
                    !isLoopUseful(data.prog, varIndex)
                ) {
                    continue;
                }

                const instr = {type: "while", var: varIndex, body: data.prog};
                const usedVarsSet = getUsedVars(data.prog);
                const maxUsedVars = Math.max(nextUsedVars, Math.max(...usedVarsSet) + 1);

                param.prefix.push(instr);

                if (!param.isInLoop && !hasVar(param.prefix, "inc")) {
                    param.prefix.pop();
                    continue;
                }

                if (param.isInLoop) {
                    yield* enumerate(tailLength, copy(param, {usedVars: maxUsedVars, minInstr: 0, allowedVars: usedVarsSet}));

                } else {
                    const {halted, vars, steps} = execute([instr], 10, {...param.vars}, param.steps);

                    if (halted) {
                        yield* enumerate(tailLength, copy(param, {usedVars: maxUsedVars, minInstr: 0, allowedVars: usedVarsSet, vars, steps}));

                    } else {
                        if (!param.isInLoop && !hasVar(param.prefix, "while")) {
                            param.prefix.pop();
                            continue;
                        }

                        yield {prog: param.prefix, halted, vars, steps};
                    }
                }

                param.prefix.pop();
            }
        }
    }
}

export function* enumerate(
    length,
    param = {prefix: [], usedVars: 0, minInstr: 0, isInLoop: false, allowedVars: null, vars: {}, steps : 0}
) {
    if (length <= 0) {
        yield {prog: param.prefix, halted: true, vars: param.vars, steps: param.steps};
        return;
    }

    yield* enumerateInstructions(length, param);
    yield* enumerateWhileLoops(length, param);
}