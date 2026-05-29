"use strict";
import {log} from "./log.js";

// Core recursive search helpers
// ================================================================

// Check list of vars that can increase when `program` executes
export function getIncVars(program) {
    if (!program) return null;

    let incVars = new Set();

    function scan(block) {
        for (const instr of block) {
            if (!incVars) return;

            if (instr.type === "inc") {
                incVars.add(instr.var);
            }
            else if (instr.type === "while") {
                if (!instr.body)
                    incVars = null;
                else
                    scan(instr.body);
            }
        }
    }

    scan(program);

    return incVars;
}

// Check list of vars that can either increase or decrease when `program` executes
export function getUsedVars(program) {
    if (!program) return null;

    let usedVars = new Set();

    function scan(block) {
        for (const instr of block) {
            if (!usedVars) return;

            if (instr.type === "inc" || instr.type === "dec") {
                usedVars.add(instr.var);
            }
            else if (instr.type === "while") {
                if (!instr.body)
                    usedVars = null;
                else
                    scan(instr.body);
            }
        }
    }

    scan(program);

    return usedVars;
}

// Check if for each `var` in `program`, it also has `while var`
// Assume that every loop in `program` ran at least once
export function areEachVarUseful(program) {
    const vars = new Set();
    const whiles = new Set();

    function scan(block) {
        for (const instr of block) {
            if (instr.body) return null;

            vars.add(instr.var);

            if (instr.type === "while") {
                whiles.add(instr.var);
                scan(instr.body);
            }
        }
    }

    scan(program);

    return vars.isSubsetOf(whiles);
}

// Check if program has an undefined loop
export function hasUndefinedLoop(program) {
    for (const instr of program) {
        if (instr.type === "while")
            if (!instr.body || hasUndefinedLoop(instr.body))
                return true;
    }

    return false;
}

// Loop structure deciders
// ================================================================

// Check if a loop is unecessary nested
export function isLoopNested(body, targetVar) {
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

            const incVars = getIncVars(instr.body);

            if (incVars)
                incVars.forEach((el) => bannedVars.delete(el));
            else
                bannedVars = new Set();

            bannedVars.add(instr.var);
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
            allowedVars = getUsedVars(instr.body);
        }
        else {
            if (allowedVars && !allowedVars.has(instr.var)) {
                return false;
            }
        }
    }

    return true;
}
