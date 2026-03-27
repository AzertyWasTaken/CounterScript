"use strict";
export function hasIncrementForEveryWhile(program) {
    const increments = new Set();
    const varsSet = new Set();

    function scan(block) {
        for (const instr of block) {
            varsSet.add(instr.var);

            if (instr.type === "inc") {
                increments.add(instr.var);

            } else if (instr.type === "while") {
                scan(instr.body);
            }
        }
    }

    scan(program);

    for (const varIndex of varsSet) {
        if (!increments.has(varIndex)) {
            return false;
        }
    }

    return true;
}