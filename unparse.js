"use strict";
const varNames = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function unparseInstr(instr) {
    const getVarName = () => varNames[instr.var];

    if (instr.type === "inc") {
        return `${getVarName()}++;`

    } else if (instr.type === "dec") {
        return `${getVarName()}--;`

    } else if (instr.type === "while") {
        const isBodyEmpty = !instr.body || instr.body.length === 0;
        const bosyStr = isBodyEmpty ? "" : `${unparse(instr.body)}`;
        return `while ${getVarName()} > 0 {${bosyStr}}`

    } else {
        throw new Error(`Unknown instruction: ${instr}`);
    }
}

export function unparse(program) {
    return program.map(unparseInstr).join(" ");
}