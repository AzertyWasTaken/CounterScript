"use strict";
export function* enumerate(length, usedVars = 0) {
    if (length <= 0) {yield []; return;}

    for (let varIndex = 0; varIndex < usedVars + 1; varIndex++) {
        const newUsedVars = Math.max(usedVars, varIndex + 1);

        for (const tail of enumerate(length - 1, newUsedVars)) {
            yield [{type: "inc", var: varIndex}, ...tail];
            yield [{type: "dec", var: varIndex}, ...tail];
        }

        for (let bodyLen = 1; bodyLen < length; bodyLen++) {
            for (const body of enumerate(bodyLen, newUsedVars)) {
                for (const tail of enumerate(length - bodyLen - 1, newUsedVars)) {
                    yield [{type: "while", var: varIndex, body}, ...tail];
                }
            }
        }
    }
}