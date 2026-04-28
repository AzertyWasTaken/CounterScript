"use strict";
import {log} from "./log.js";

// Core recursive search helpers
// ================================================================

export function hasOpVar(program, targetVar, op) {
    for (const instr of program) {
        if (instr.type === op && instr.var === targetVar)
            return true;

        if (instr.type === "while" && hasOpVar(instr.body, targetVar, op))
            return true;
    }

    return false;
}

export function getUsedVars(program, op) {
    const usedVars = new Set();

    function scan(block) {
        for (const instr of block) {
            if (!op || instr.type === op)
                usedVars.add(instr.var);

            if (instr.type === "while")
                scan(instr.body);
        }
    }

    scan(program);

    return usedVars;
}

export function hasOpVarForEach(program, op) {
    const opVars = new Set();
    const usedVars = new Set();

    function scan(block) {
        for (const instr of block) {
            usedVars.add(instr.var);

            if (instr.type === op)
                opVars.add(instr.var);

            if (instr.type === "while")
                scan(instr.body);
        }
    }

    scan(program);

    return usedVars.isSubsetOf(opVars);
}

// Loop structure deciders
// ================================================================

// Check if targetVar is always greater than 0 the program ends
export function isLoopNonhalting(program, targetVar, loopVar = targetVar) {
    for (let i = program.length - 1; i >= 0; i--) {
        const instr = program[i];

        if (instr.type === "inc") {
            if (instr.var === targetVar) return true;
        }
        else if (instr.type === "dec") {
            if (instr.var === targetVar) return false;
        }
        else if (instr.type === "while") {
            const res = isLoopNonhalting(instr.body, targetVar, instr.var);

            if (res === false)
                return false;

            else if (res === true)
                if (isLoopNonhalting(program.slice(0, i), instr.var, loopVar))
                    return true;
        }
    }

    return targetVar === loopVar ? true : null;
}

// Filter out instructions on var contained in varSet
export function filterOutVars(program, varIdSet) {
    for (let i = program.length - 1; i >= 0; i--) {
        const instr = program[i];

        if (varIdSet.has(instr.var)) {
            program.splice(i, 1);
        }
        else if (instr.type === "while") {
            filterOutVars(instr.body, varIdSet);
        }
    }

    return program;
}

// Check if a loop can repeat twice or more
export function canRepeatTwice(body, targetVar) {
    for (let i = body.length - 1; i >= 0; i--) {
        const instr = body[i];

        if (instr.type === "while") {
            if (instr.var === targetVar) return false;

            if (hasOpVar(instr.body, targetVar, "inc")) return true;
        }
    }

    return true;
}

// Check if a loop is unecessary nested
export function isLoopNested(body, targetVar) {
    return body.length === 1
    && body[0].type === "while"
    && body[0].var === targetVar;
}

// An used vars is active if it can increment when equal to 0
// ================================================================

export function hasActiveVarForEach(program) {
    const activeVars = new Set();
    const usedVars = new Set();

    function scan(block, ignore) {
        for (const instr of block) {
            usedVars.add(instr.var);

            if (instr.type === "inc") {
                if (!ignore.has(instr.var))
                    activeVars.add(instr.var);
            }
            else if (instr.type === "while") {
                scan(instr.body, ignore.union(new Set([instr.var])));
            }
        }
    }

    scan(program, new Set());

    return usedVars.isSubsetOf(activeVars);
}

export function getInactiveVars(program) {
    const activeVars = new Set();
    const usedVars = new Set();

    function scan(block, ignore) {
        for (const instr of block) {
            usedVars.add(instr.var);

            if (instr.type === "inc")
                if (!ignore.has(instr.var))
                    activeVars.add(instr.var);

            else if (instr.type === "while")
                scan(instr.body, ignore.union(new Set([instr.var])));
        }
    }

    scan(program, new Set());

    return usedVars.difference(activeVars);
}