"use strict";
function getChar(ctx) {
    return ctx.program[ctx.pointer];
}

function startsWith(ctx, token) {
    return ctx.program.startsWith(token, ctx.pointer);
}

function slice(ctx) {
    return ctx.program.slice(ctx.pointer);
}

function findToken(ctx, token) {
    if (startsWith(ctx, token)) {
        ctx.pointer += token.length;
        return true;
    }
    return false;
}

function skipWhitespace(ctx) {
    while (true) {
        // Comments start with "\\" and go until end-of-line
        if (findToken(ctx, "\\\\")) {
            while (/\n|\r/.test(getChar(ctx)))
                ctx.pointer++;
        }
        else if (/\s/.test(getChar(ctx))) {
            ctx.pointer++;
        }
        else break;
    }
}

function expect(ctx, token) {
    skipWhitespace(ctx);
    if (!startsWith(ctx, token))
        throw new Error(`Expected "${token}" at position ${ctx.pointer}`);

    ctx.pointer += token.length;
}

function getVarId(varsId, varName) {
    const itemPos = varsId.indexOf(varName);
    if (itemPos < 0) {
        varsId.push(varName);
        return varsId.length - 1;
    }
    return itemPos;
}

function parseVar(ctx, varsId) {
    skipWhitespace(ctx);
    const match = /^[A-Za-z0-9_]\w*/.exec(slice(ctx));
    if (!match)
        throw new Error(`Expected variable at position ${ctx.pointer}`);

    ctx.pointer += match[0].length;
    return getVarId(varsId, match[0]);
}

function parseProgram(ctx, callback) {
    const result = [];
    while (ctx.pointer < ctx.program.length) {
        skipWhitespace(ctx);
        if (ctx.pointer >= ctx.program.length) break;
        result.push(callback());
    }
    return result;
}

// Parse
// ================================================================

export function parse(program) {
    const ctx = {program, pointer: 0};
    const varsId = [];
    const instructions = [];

    function parseInstruction() {
        skipWhitespace(ctx);

        if (findToken(ctx, "while")) {
            const variable = parseVar(ctx, varsId);
            skipWhitespace(ctx);
            expect(ctx, "{");

            const body = [];
            while (true) {
                skipWhitespace(ctx);
                if (getChar(ctx) === "}") break;
                body.push(parseInstruction());
            }

            expect(ctx, "}");
            return {type: "while", var: variable, body};
        }

        const variable = parseVar(ctx, varsId);
        skipWhitespace(ctx);

        if (findToken(ctx, "++")) {
            expect(ctx, ";");
            return {type: "inc", var: variable};
        }

        if (findToken(ctx, "--")) {
            expect(ctx, ";");
            return {type: "dec", var: variable};
        }

        throw new Error(`Unknown instruction at position ${ctx.pointer}`);
    }

    return [parseProgram(ctx, () => parseInstruction()), varsId];
}

// Area
// ================================================================

export function parseArea(program) {
    const ctx = {program, pointer : 0};
    const varsId = [];
    const instructions = [];

    function parseInstruction() {
        skipWhitespace(ctx);

        if (findToken(ctx, "}")) {
            return {type: "exit"};
        }

        if (findToken(ctx, "w")) {
            const variable = parseVar(ctx, varsId);
            skipWhitespace(ctx);
            expect(ctx, "{");
            return {type: "while", var: variable, body: undefined};
        }

        const variable = parseVar(ctx, varsId);
        skipWhitespace(ctx);

        if (findToken(ctx, "+")) {
            return {type: "inc", var: variable};
        }

        if (findToken(ctx, "-")) {
            return {type: "dec", var: variable};
        }

        throw new Error(`Unknown instruction at position ${ctx.pointer}`);
    }

    return parseProgram(ctx, () => parseInstruction());
}

// Unparse
// ================================================================

const VAR_NAMES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function unparse(program) {
    if (!Array.isArray(program)) return "N/A";

    return program.map((instr) => {
        const varName = VAR_NAMES[instr.var];

        if (instr.type === "inc") {
            return `${varName}++;`
        }
        else if (instr.type === "dec") {
            return `${varName}--;`
        }
        else if (instr.type === "while") {
            const isBodyEmpty = !instr.body || instr.body.length === 0;
            const bodyStr = isBodyEmpty ? "" : `${unparse(instr.body)}`;
            return `while ${varName} {${bodyStr}}`
        }
    }).join(" ");
}
