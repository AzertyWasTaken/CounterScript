"use strict";
import {log} from "./log.js";
import {parse, unparse} from "./parser.js";
import {run, execute} from "./execute.js";
import {enumerate} from "./enumerate.js";
import {canRepeatTwice} from "./getProgData.js";
import {isLoopNonhalting} from "./isLoopNonhalting.js";

function test(callback, program, ...arg) {
    log(callback(parse(program)[0], ...arg));
}

function testEnum(func, length) {
    let total = 0;

    for (const [program, halted, vars, maxVarId] of func(length)) {
        log(halted, unparse(program));
        total++;
    }

    log("Total:", total);
}

function testDeciders(length) {
    for (const [program, halted, vars, steps, maxVarId] of enumerate(length)) {
        if (halted !== false) continue;

        const [testHalted, vars, steps] = run(program, {maxSteps: 100, deciders: true});
        if (testHalted === true) {log(unparse(program), vars);}
    }

    log("Test completed!")
}

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
// test(isLoopNonhalting, "A++; while A {A--; B++;} while B {A++; B--;}", 0);
// test(isLoopNonhalting, "A--; B--; while B {A++;} B++;", 0);

// test(run, "A++; while A {A--; A++;}", 10);
// test(run, "A++; while A {A--; B++;}", 10, true);
// test(run, "A++; while A {A++;}", 10, true);
// test(run, "A++; while A {A--; A++;}", 10, true);
// test(run, "A++; A++; B++; while A {while B {A--; B--;} C++;}", 10, true);
// test(run, "A++; while A {A--; B++; while B {A++; A++; B--;}}", 10, true);
// test(run, "A++; while A {A++; A++; B++; while B {A--; B--;}}", 10, true);
// test(run, "A++; while A {A++; B++; while B {A--; B--;}}", 10, true);
// test(run, "A++; B++; while A {A++; while B {A--; B--; B--;}}", 10, true);
// test(run, "A++; while A {B--; C++; while B {A--; while C {B--; C--;}} B++;}", 10, true);
// test(run, "A++; while A {while A {A--; B++;} while B {A++; A++; B--;}}", 10, true);

// test(run, "A++; A++; A++; while A {A--; B++; B++; B++;}", {maxSteps: 10, deciders: true});
// test(run, "A++; while A {A++; while B {A--; B--;} B++;}", {maxSteps: 100, deciders: true});

// test(canRepeatTwice, "A++; while A {A--; B++;}", 0);
// test(canRepeatTwice, "A++; while B {while A {A--; B++;}} B++;", 0);
// test(canRepeatTwice, "while A {A--; B++;} while B {A++; B--;}", 0);

// testDeciders(8);

// testEnum(enumerate, 6);