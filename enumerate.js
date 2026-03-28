"use strict";
import {canHalt} from "./canHalt.js";

export function* enumerate(length, usedVars = 0, minInstrIndex = 0, isInLoop = false) {
    if (length <= 0) {yield []; return;}

    for (let instrIndex = minInstrIndex; instrIndex < (usedVars + 1) * 2; instrIndex++) {
        const type = instrIndex % 2 === 0 ? "dec" : "inc";
        const varIndex = Math.floor(instrIndex / 2);

        const newUsedVars = Math.max(usedVars, varIndex + 1);
        if (!isInLoop && newUsedVars !== usedVars && type === "dec") {continue;}

        for (const tail of enumerate(length - 1, newUsedVars, instrIndex, isInLoop)) {
            yield [{type: type, var: varIndex}, ...tail];
        }
    }

    for (let varIndex = 0; varIndex < usedVars + 1; varIndex++) {
        const newUsedVars = Math.max(usedVars, varIndex + 1);
        if (!isInLoop && newUsedVars !== usedVars) {continue;}

        for (let bodyLen = 1; bodyLen < length; bodyLen++) {
            const tailLength = length - bodyLen - 1;
            if (!isInLoop && tailLength > 0 && tailLength < 4) {continue;}

            for (const body of enumerate(bodyLen, newUsedVars, 0, true)) {
                if (
                    body.at(-1).type === "while" && body.at(-1).var === varIndex ||
                    !canHalt([{type: "while", var: varIndex, body}])
                ) {continue;}

                for (const tail of enumerate(tailLength, newUsedVars, 0, isInLoop)) {
                    yield [{type: "while", var: varIndex, body}, ...tail];
                }
            }
        }
    }
}