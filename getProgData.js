"use strict";
// Core recursive search helpers
export function hasOpVar(program, targetVar, op) {
    for (const instr of program) {
        if (
            instr.type === op &&
            instr.var === targetVar
        ) {return true;}

        if (
            instr.type === "while" &&
            hasOpVar(instr.body, targetVar, op)
        ) {return true;}
    }

    return false;
}

export function getUsedVars(program, op) {
    const usedVars = new Set();

    function scan(block) {
        for (const instr of block) {
            if (!op || instr.type === op) {usedVars.add(instr.var);}

            if (instr.type === "while") {scan(instr.body);}
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

            if (instr.type === op) {opVars.add(instr.var);}

            if (instr.type === "while") {scan(instr.body);}
        }
    }

    scan(program);

    return usedVars.isSubsetOf(opVars);
}

// Check if targetVar is proven to be always greater than 0 when the loop ends.
export function doLoopPosVar(program, targetVar) {
    for (let i = program.length - 1; i >= 0; i--) {
        const instr = program[i];

        if (instr.type === "inc") {
            if (instr.var === targetVar) {return true;}
        }
        else if (instr.type === "dec") {
            if (instr.var === targetVar) {return false;}
        }
        else if (instr.type === "while") {
            if (hasOpVar(instr.body, targetVar, "dec")) {return false;}
        }
    }

    return false;
}

// Check if a while loop is non-halting (specific pattern detection)
export function isLoopNonhalting(program, targetVar) {
    for (let i = program.length - 1; i >= 1; i--) {
        const instr = program[i];

        if (instr.type === "while") {
            if (instr.var === targetVar) {
                return false;
            }
            else {
                return doLoopPosVar(instr.body, targetVar)
                && doLoopPosVar(program.slice(0, i), instr.var);
            }
        }
        else if (instr.type === "dec") {
            if (instr.var === targetVar) {return false;}
        }
    }

    return false;
}

// Check if a while loop is halting (specific pattern detection)
export function canLoopHalt(program, targetVar) {
    for (let i = program.length - 1; i >= 0; i--) {
        const instr = program[i];

        if (instr.var === targetVar) {return instr.type !== "inc";}

        if (instr.type === "while") {
            if (canLoopHalt(instr.body, targetVar)) {return true;}
        }
    }

    return false;
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

// Check if a loopVar while loop on body is actually useful
export function isLoopUseful(body, loopVar) {
    for (let i = body.length - 1; i >= 0; i--) {
        const instr = body[i];

        if (instr.type === "while") {
            if (
                instr.var === loopVar ||
                !isLoopUseful(instr.body, loopVar)
            ) {return false;}

            if (hasOpVar(instr.body, loopVar, "inc")) {return true;}
        }
    }

    return true;
}

// An used vars is active if it can increment when equal to 0
export function hasActiveVarForEach(program) {
    const activeVars = new Set();
    const usedVars = new Set();

    function scan(block, ignore) {
        for (const instr of block) {
            usedVars.add(instr.var);

            if (instr.type === "inc") {
                if (!ignore.has(instr.var)) {activeVars.add(instr.var);}
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

            if (instr.type === "inc") {
                if (!ignore.has(instr.var)) {activeVars.add(instr.var);}
            }
            else if (instr.type === "while") {
                scan(instr.body, ignore.union(new Set([instr.var])));
            }
        }
    }

    scan(program, new Set());

    return usedVars.difference(activeVars);
}