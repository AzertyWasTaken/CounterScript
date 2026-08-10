"use strict";
// Integral `program` scan
export function scanVars(program) {
    const incs = new Set();
    const decs = new Set();
    const whiles = new Set();
    let isValid = true;

    function scan(block) {
        if (!block) {
            isValid = false;
            return false;
        }

        for (const instr of block) {
            if (instr.type === "inc") {
                incs.add(instr.var);
            }
            else if (instr.type === "dec") {
                decs.add(instr.var);
            }
            else if (instr.type === "while") {
                if (!scan(instr.body)) return false;

                whiles.add(instr.var);
            }
        }

        return true;
    }

    scan(program);

    return {isValid, incs, decs, whiles};
}

// Check if `program` has an undefined loop
export function hasUndefinedLoop(program) {
    if (!program) return false;

    for (const instr of program) {
        if (instr.type === "while")
            if (!instr.body || hasUndefinedLoop(instr.body))
                return true;
    }

    return false;
}

// Check if `program` has a while-loop for every counters in `loopVar`
// Return `null` if `program` has undefined loops
export function hasWhileLoop(program, loopVars) {
    function scan(block) {
        if (!block) return null;

        for (const instr of block) {
            if (instr.type === "while") {
                loopVars.delete(instr.var);
                if (loopVars.size === 0) return true;

                const scanRes = scan(instr.body);
                if (scanRes !== false) return scanRes;
            }
        }

        return false;
    }

    return scan(program);
}
