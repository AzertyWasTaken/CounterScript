"use strict";
function swapKeyValue(obj){
    let result = {};
    for(const key in obj){
        result[obj[key]] = key;
    }
    return result;
}

export function parse(program) {
    const instructions = [];
    let i = 0;

    const varsId = {};
    let nextVarId = 0;

    function skipWhitespace() {
        while (/\s/.test(program[i])) {i++;}
    }

    function getVarId(varName) {
        if (!varsId.hasOwnProperty(varName)) {
            varsId[varName] = nextVarId;
            nextVarId++;
        }
        return varsId[varName];
    }

    function parseVar() {
        skipWhitespace();
        const match = /^[A-Za-z_]\w*/.exec(program.slice(i));
        if (!match) {
            throw new Error(`Expected variable at position ${i}`);
        }
        i += match[0].length;
        return getVarId(match[0]);
    }

    function expect(str) {
        skipWhitespace();
        if (!program.startsWith(str, i)) {
            throw new Error(`Expected "${str}" at position ${i}`);
        }
        i += str.length;
    }

    function parseInstruction() {
        skipWhitespace();

        if (program.startsWith("while", i)) {
            i += 5;
            const variable = parseVar();
            skipWhitespace();
            expect("{");

            const body = [];
            while (true) {
                skipWhitespace();
                if (program[i] === "}") {break;}
                body.push(parseInstruction());
            }

            expect("}");
            return {type: "while", var: variable, body};
        }

        const variable = parseVar();
        skipWhitespace();

        if (program.startsWith("++", i)) {
            i += 2;
            expect(";");
            return {type: "inc", var: variable};
        }

        if (program.startsWith("--", i)) {
            i += 2;
            expect(";");
            return {type: "dec", var: variable};
        }

        throw new Error(`Unknown instruction at position ${i}`);
    }

    function parseProgram() {
        while (i < program.length) {
            skipWhitespace();
            if (i >= program.length) {break;}
            instructions.push(parseInstruction());
        }
    }

    parseProgram();
    return [instructions, swapKeyValue(varsId)];
}

const VAR_NAMES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function unparse(program) {
    return program.map((instr) => {
        const varName = VAR_NAMES[instr.var];

        if (instr.type === "inc") {
            return `${varName}++;`

        } else if (instr.type === "dec") {
            return `${varName}--;`

        } else if (instr.type === "while") {
            const isBodyEmpty = !instr.body || instr.body.length === 0;
            const bosyStr = isBodyEmpty ? "" : `${unparse(instr.body)}`;
            return `while ${varName} {${bosyStr}}`
        }

    }).join(" ");
}