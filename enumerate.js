"use strict";
import {hasDec} from "./canHalt.js";
import {getUsedVars} from "./getUsedVars.js";

export function* enumerate(length, usedVars = 0, minInstr = 0, isInLoop = false, allowedVars = null) {
    if (length <= 0) {yield []; return;}

    for (let instrIndex = minInstr; instrIndex < (usedVars + 1) * 2; instrIndex++) {
        const varIndex = Math.floor(instrIndex / 2);
        if (allowedVars && !allowedVars.has(varIndex)) {continue;}

        const type = instrIndex % 2 === 0 ? "dec" : "inc";
        const newUsedVars = Math.max(usedVars, varIndex + 1);
        if (!isInLoop && newUsedVars !== usedVars && type === "dec") {continue;}

        for (const tail of enumerate(length - 1, newUsedVars, instrIndex, isInLoop, allowedVars ? new Set(allowedVars) : null)) {
            yield [{type: type, var: varIndex}, ...tail];
        }
    }

    for (let varIndex = 0; varIndex < usedVars + 1; varIndex++) {
        const newUsedVars = Math.max(usedVars, varIndex + 1);
        if (!isInLoop && newUsedVars !== usedVars) {continue;}

        for (let bodyLen = 1; bodyLen < length; bodyLen++) {
            const tailLength = length - bodyLen - 1;
            if (!isInLoop && tailLength > 0 && tailLength < 4) {continue;}

            for (const body of enumerate(bodyLen, newUsedVars, 0, true, null)) {
                if (!hasDec(body, varIndex)) {continue;}
                const usedVarsSet = getUsedVars(body);
                const maxUsedVars = Math.max(newUsedVars, Math.max(...usedVarsSet) + 1);

                for (const tail of enumerate(tailLength, maxUsedVars, 0, isInLoop, usedVarsSet)) {
                    yield [{type: "while", var: varIndex, body}, ...tail];
                }
            }
        }
    }
}