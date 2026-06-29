"use strict";
import {scanVars} from "./scanner.js";

export function hasRowWhileVars(body) {
    let bannedVars = new Set();

    for (const instr of body) {
        if (instr.type === "while") {
            if (bannedVars.has(instr.var)) return true;

            const {isValid, incs} = scanVars(instr.body);

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
