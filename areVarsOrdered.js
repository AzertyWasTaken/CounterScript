"use strict";
import {scanVars} from "./scanner.js";

export function areVarsOrdered(body) {
    let allowedVars = null;

    for (const instr of body) {
        if (instr.type === "while") {
            const {isValid, incs, decs} = scanVars(instr.body)

            if (isValid) {
                allowedVars = incs.union(decs);
            } else {
                allowedVars = null;
            }
        } else {
            if (allowedVars && !allowedVars.has(instr.var))
                return false;
        }
    }

    return true;
}
