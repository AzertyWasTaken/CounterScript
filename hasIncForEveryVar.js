"use strict";
export function hasIncForEveryVar(program) {
    const increments = new Set();
    const varsSet = new Set();

    function scan(block, nestedLoops) {
        for (const instr of block) {
            varsSet.add(instr.var);

            if (instr.type === "inc" && !nestedLoops.has(instr.var)) {
                increments.add(instr.var);

            } else if (instr.type === "while") {
                nestedLoops.add(instr.var);
                scan(instr.body, nestedLoops);
            }
        }
    }

    scan(program, new Set());

    for (const varIndex of varsSet) {
        if (!increments.has(varIndex)) {
            return false;
        }
    }

    return true;
}