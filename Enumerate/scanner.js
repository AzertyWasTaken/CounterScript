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
    for (const instr of program) {
        if (instr.type === "while")
            if (!instr.body || hasUndefinedLoop(instr.body))
                return true;
    }

    return false;
}

// Check if for every counters in `loopVar`,
// `program` has a while-loop on that counter
export function hasWhileLoop(program, loopVar) {
    function scan(block) {
        if (!block) return null;

        for (const instr of block) {
            if (instr.type === "while") {
                loopVar.delete(instr.var);
                if (loopVar.size === 0) return true;

                const scanRes = scan(instr.body);
                if (scanRes !== false) return scanRes;
            }
        }

        return false;
    }

    return scan(program);
}
