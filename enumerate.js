"use strict";
import {canLoopHalt, isLoopNonhalting, hasActiveVarForEach, getUsedVars, isLoopUseful} from "./getProgData.js";
import {run, getVar} from "./execute.js";

function compareVars(vars, id) {
    return id > 0 && getVar(vars, id) === getVar(vars, id - 1)
}

export function* genInstructions(length, program, vars, steps, maxVarId, minInstrId, isInLoop, allowedVars) {
    for (let instrId = minInstrId; instrId < (maxVarId + 1) * 2; instrId++) {
        const instr = {
            type: instrId % 2 === 0 ? "dec" : "inc",
            var: Math.floor(instrId / 2)
        };

        // Skip not allowed vars
        if (
            !isInLoop && (
                instr.type === "dec" && instr.var + 1 > maxVarId ||
                compareVars(vars, instr.var)
            ) || allowedVars && !allowedVars.has(instr.var)
        ) {continue;}

        const nextMaxVarId = Math.max(instr.var + 1, maxVarId);

        // Execute instruction
        const [halted, newVars, newSteps] = isInLoop ?
        [true, vars] : run([instr], 100, true, {...vars}, steps);

        // Add the operation
        program.push(instr);
        yield* enumerate(length - 1, program, newVars, newSteps, nextMaxVarId, instrId, isInLoop, allowedVars);
        program.pop();
    }
}

export function* genWhileLoops(length, program, vars, steps, maxVarId, isInLoop) {
    for (let varId = 0; varId <= maxVarId; varId++) {
        // Skip not allowed vars
        if (!isInLoop && (varId + 1 > maxVarId || compareVars(vars, varId))) {continue;}

        const nextMaxVarId = Math.max(varId + 1, maxVarId);

        for (let bodyLength = 1; bodyLength < length; bodyLength++) {
            const tailLength = length - bodyLength - 1;

            // Enumerate all possible bodies for the while loop
            for (
                const [body, bodyHalted, bodyVars, bodySteps, bodyMaxVarId]
                of enumerate(bodyLength, [], {}, steps, nextMaxVarId, 0, true, null)
            ) {
                // Skip not allowed bodies
                if (
                    !canLoopHalt(body, varId)
                    || isLoopNonhalting(body, varId)
                    || !isLoopUseful(body, varId)
                ) {continue;}

                const instr = {type: "while", var: varId, body};

                // Execute instruction
                const [halted, newVars, newSteps] = isInLoop ?
                [true, vars] : run([instr], 100, true, {...vars}, steps);

                program.push(instr);
                // Filter out programs that have inactive vars (always stay at 0)
                if (isInLoop || hasActiveVarForEach(program)) {
                    if (halted === true) {
                        const tailMaxVarId = Math.max(bodyMaxVarId, maxVarId);
                        const usedVarsInBody = getUsedVars(body);
                        yield* enumerate(tailLength, program, newVars, newSteps, tailMaxVarId, 0, isInLoop, usedVarsInBody);

                    } else if (!isInLoop && tailLength === 0) {
                        yield [program, halted, newVars, newSteps, maxVarId];
                    }
                }
                program.pop();
            }
        }
    }
}

export function* enumerate(length, program = [], vars = {}, steps = 0, maxVarId = 0, minInstrId = 0, isInLoop = false, allowedVars = null) {
    if (length <= 0) {
        yield [program, true, vars, steps, maxVarId];
        return;
    }

    yield* genInstructions(length, program, vars, steps, maxVarId, minInstrId, isInLoop, allowedVars);
    yield* genWhileLoops(length, program, vars, steps, maxVarId, isInLoop);
}