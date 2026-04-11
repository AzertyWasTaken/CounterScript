"use strict";
export function hasVar(prog, type) {
    const increments = new Set();
    const varsSet = new Set();

    function scan(block, nested) {
        for (const instr of block) {
            varsSet.add(instr.var);

            if (instr.type === type && !nested.has(instr.var)) {
                increments.add(instr.var);
            }

            if (instr.type === "while") {
                nested.add(instr.var);
                scan(instr.body, nested);
                nested.delete(instr.var);
            }
        }
    }

    scan(prog, new Set());

    for (const varIndex of varsSet) {
        if (!increments.has(varIndex)) {
            return false;
        }
    }

    return true;
}