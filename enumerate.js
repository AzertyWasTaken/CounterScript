"use strict";
import {log} from "./log.js";
import {run, getVar, isVarPos} from "./execute.js";
import {
    isLoopNonhalting, hasActiveVarForEach, getUsedVars, canRepeatTwice,
    isLoopNested
} from "./getProgData.js";

function compareVars(vars, id) {
    return id > 0
    && getVar(vars, id) === getVar(vars, id - 1)
}

export function* genInstructions(length, program, rootProg, vars, steps, maxVarId, minInstrId, isInLoop, allowedVars, isEnabled) {
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
            )
            || allowedVars && !allowedVars.has(instr.var)
        ) continue;

        const nextMaxVarId = Math.max(instr.var + 1, maxVarId);

        // Execute instruction
        const [halted, newVars, newSteps] = isEnabled
        ? run([instr], 100, true, [...vars], steps)
        : [true, vars, steps];

        // Add the operation
        program.push(instr);
        yield* enumerate(length - 1, program, rootProg, newVars, newSteps, nextMaxVarId, instrId, isInLoop, allowedVars, isEnabled);
        program.pop();
    }
}

export function* genWhileLoops(length, program, rootProg, vars, steps, maxVarId, isInLoop, isEnabled) {
    for (let varId = 0; varId <= maxVarId; varId++) {
        // Skip not allowed vars
        if (!isInLoop && (varId + 1 > maxVarId || compareVars(vars, varId))) continue;

        const nextMaxVarId = Math.max(varId + 1, maxVarId);

        for (let bodyLength = 1; bodyLength < length; bodyLength++) {
            const tailLength = length - bodyLength - 1;

            // Enumerate all possible bodies for the while loop
            for (
                const [body, bodyHalted, bodyVars, bodySteps, bodyMaxVarId]
                of enumerate(bodyLength, [], rootProg, vars, steps, nextMaxVarId, 0, true, null, isVarPos(vars, varId))
            ) {
                // Skip not allowed bodies
                if (
                    isLoopNonhalting(body, varId)
                    || (!isInLoop && !canRepeatTwice(body, varId))
                    || isLoopNested(body, varId)
                ) continue;

                const instr = {type: "while", var: varId, body};

                // Execute instruction
                const [halted, newVars, newSteps] = isEnabled
                ? run([instr], 100, true, [...bodyVars], bodySteps)
                : [true, bodyVars, bodySteps];

                program.push(instr);

                // Filter out programs that have inactive vars (always stay at 0)
                if (isInLoop || hasActiveVarForEach(program))
                    if (halted === true) {
                        const tailMaxVarId = Math.max(bodyMaxVarId, maxVarId);
                        const usedVarsInBody = getUsedVars(body);
                        yield* enumerate(tailLength, program, rootProg, newVars, newSteps, tailMaxVarId, 0, isInLoop, usedVarsInBody, isEnabled);

                    } else if (tailLength === 0)
                        yield [rootProg, halted, newVars, newSteps, maxVarId];

                program.pop();
            }
        }
    }
}

export function* enumerate(length, program = [], rootProg = program, vars = [], steps = 0, maxVarId = 0, minInstrId = 0, isInLoop = false, allowedVars = null, isEnabled = true) {
    if (length <= 0) {
        yield [program, true, vars, steps, maxVarId];
        return;
    }

    yield* genInstructions(length, program, rootProg, vars, steps, maxVarId, minInstrId, isInLoop, allowedVars, isEnabled);
    yield* genWhileLoops(length, program, rootProg, vars, steps, maxVarId, isInLoop, isEnabled);
}