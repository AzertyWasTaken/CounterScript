"use strict";
import {log} from "./log.js";
import {parse, unparse} from "./parser.js";
import {run, execute} from "./execute.js";
import {enumerate} from "./enumerate.js";
// import {enumerate as enumerate_prev} from "./enumerate_preOptLoopLen.js";
import {isLoopNonhalting} from "./isLoopNonhalting.js";

function test(callback, program, ...arg) {
    log(callback(parse(program)[0], ...arg));
}

function testEnum(callback, length, print, ctx) {
    let total = 0;
    const progSet = new Set();

    for (const [halted, resCtx] of callback(length, ctx)) {
        if (print) log(halted, unparse(resCtx.prog));
        progSet.add(unparse(resCtx.prog));
        total++;
    }

    log("Total:", total);
    return progSet;
}

function compareEnum(enum1, enum2, length) {
    const set1 = testEnum(enum1, length, false);
    const set2 = testEnum(enum2, length, false);
    const result = set1.difference(set2);

    result.forEach(element => log(element));
}

function testDeciders(length) {
    for (const [program, halted, vars, steps, maxVarId] of enumerate(length)) {
        if (halted !== false) continue;

        const [testHalted, vars, steps] = run(program, {maxSteps: 100, deciders: true});
        if (testHalted === true) log(unparse(program), vars);
    }

    log("Test completed!")
}

// log(parse("A++; while A {while A {A--; B++; B++; B++;} while B {A++; B--;} A--;}"));

// log(run(
//     [{type: "inc", var: 0}, {type: "inc", var: 0}, {type: "while", var: 0, body: [{type: "dec", var: 0}, {type: "inc", var: 1}, {type: "inc", var: 1}]}],
//     {maxSteps: 100, deciders: true}
// ));
// log(run(
//     [{type: "inc", var: 0}, {type: "while", var: 0, body: [{type: "inc", var: 0}]}],
//     {maxSteps: 100, deciders: false}
// ));
// log(run(
//     [{type: "inc", var: 0}, {type: "while", var: 0, body: [{type: "inc", var: 0}]}],
//     {maxSteps: 100, deciders: true}
// ));
// log(run(
//     [{type: "inc", var: 0}, {type: "while", var: 0, body: [{type: "while", var: 1}, {type: "inc", var: 1}]}],
//     {maxSteps: 100, deciders: false}
// ));

// test(isLoopNonhalting, "A++; while A {B--;}", 1);
// test(isLoopNonhalting, "A++; B--; B++;", 1);
// test(isLoopNonhalting, "A++; while A {B++;}", 1);
// test(isLoopNonhalting, "A++; B--; while A {A--; B++;}", 1);
// test(isLoopNonhalting, "A--; B++; while B {A++; B--;}", 0);
// test(isLoopNonhalting, "A--; while B {A++; B--;}", 0);
// test(isLoopNonhalting, "A--; B++; while B {B--;}", 0);
// test(isLoopNonhalting, "A--; B++; C++; while B {A++; B--;} B++;", 0);
// test(isLoopNonhalting, "A--; B--; while B {A++;} B++;", 0);
// test(isLoopNonhalting, "A++; while A {A--; B++;} while B {A++; B--;}", 0);
// test(isLoopNonhalting, "while A {A--; B++; B++;} while B {A++; B--;}", 0);
// test(isLoopNonhalting, "while A {A--; B++; B++; B++;} while B {A++; B--;} A--;", 0);

// test(run, "A++; while A {A--; A++;}", {maxSteps: 10, deciders: false});
// test(run, "A++; while A {A--; A++;}", {maxSteps: 10, deciders: true});
// test(run, "A++; A++; while A {A--; B++; B++;}", {maxSteps: 10, deciders: true});
// test(run, "A++; A++; B++; while A {while B {A--; B--;}}", {maxSteps: 10, deciders: true});
// test(run, "A++; while A {A--; B++; while B {A++; A++; B--;}}", {maxSteps: 10, deciders: true});
// test(run, "A++; while A {A++; B++; while B {A--; A--; B--;}}", {maxSteps: 10, deciders: true});
// test(run, "A++; while A {while A {A--; B++; B++;} while B {A++; B--;}}", {maxSteps: 10, deciders: true});
// test(run, "A++; while A {while A {A--; B++; B++; B++;} while B {A++; B--;} A--;}", {maxSteps: 10, deciders: true})
// test(run, "A++; A++; A++; while A {A--; B++; while B {B--; C++; C++;} while C {B++; C--;}}", {maxSteps: 100, deciders: true})

// test(run, "A++; A++; A++; while A {A--; B++; B++; B++;}", {maxSteps: 10, deciders: true});
// test(run, "A++; while A {A++; while B {A--; B--;} B++;}", {maxSteps: 100, deciders: true});

// testDeciders(9);

// testEnum(enumerate, 2, true, {prog: [], vars: [1], steps: 1, progLen: 0, maxVar: 1, minInstr: 0, inLoop: true});

// compareEnum(enumerate_prev, enumerate, 4);
