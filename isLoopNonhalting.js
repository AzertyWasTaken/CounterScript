"use strict";
/**
 * Heuristic/non-formal check used by the Busy Beaver enumerator.
 *
 * Returns:
 *   1: targetVar is provably/heuristically never 0 within this region.
 *   0: targetVar sign/effect is neutral for reaching 0 (safe to keep).
 *   -1: targetVar can reach 0.
 *   null: an inner while-loop has `body === undefined` (unknown).
 *
 * @param {Array<object>|undefined} program
 * @param {number} targetVar
 * @param {number} [loopVar=targetVar]
 * @returns {1|0|-1|null}
 */

export function isLoopNonhalting(program, targetVar, loopVar = targetVar) {
    if (!program) return null;

    for (let i = program.length - 1; i >= 0; i--) {
        const instr = program[i];

        if (instr.type === "inc") {
            if (instr.var === targetVar) return 1;
        }
        else if (instr.type === "dec") {
            if (instr.var === targetVar) return -1;
        }
        else if (instr.type === "while") {
            const res = isLoopNonhalting(instr.body, targetVar, instr.var);

            if (res === -1) {
                return -1;
            }
            else if (res === 1) {
                if (isLoopNonhalting(program.slice(0, i), instr.var, loopVar))
                    return 1;
            }
        }
    }

    return targetVar === loopVar ? 1 : 0;
}
