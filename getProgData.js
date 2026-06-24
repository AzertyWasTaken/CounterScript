"use strict";
import {scanVars} from "./scanner.js";

// Check if a loop is unecessary nested
export function isLoopNested(body) {
    if (!body) return null;

    return body.length === 1
    && body[0].type === "while";
}

// Check if `body` has unused while vars in a row
export function hasRowWhileVars(body) {
    let bannedVars = new Set();

    for (const instr of body) {
        if (instr.type === "while") {
            if (bannedVars.has(instr.var)) return true;

            const {isValid, incs, decs, whiles} = scanVars(instr.body);

            if (isValid) {
                incs.forEach((el) => bannedVars.delete(el));
            } else {
                bannedVars = new Set();
            }

            bannedVars.add(instr.var);
        }
        else if (instr.type === "dec") {
            if (bannedVars.has(instr.var)) return true;
        }
        else if (instr.type === "inc") {
            bannedVars.delete(instr.var);
        }
    }

    return false;
}

// Check for `body` vars order equivalence
export function areVarsOrdered(body) {
    let allowedVars = null;

    for (const instr of body) {
        if (instr.type === "while") {
            const {isValid, incs, decs, whiles} = scanVars(instr.body)

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
