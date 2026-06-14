"use strict";
import {log} from "./log.js";
import {parse, unparse} from "./parser.js";
import {run, execute} from "./execute.js";
import {enumerate} from "./enumerate.js";
import {enumerate as enumerate_partial} from "./enumerate_partial.js";
// import {enumerate as enumerate_TNFnonRecursiveGen} from "./enumerate_TNFnonRecursiveGen.js";
import {isLoopNonhalting} from "./isLoopNonhalting.js";
import {hasRowWhileVars} from "./getProgData.js"

function test(callback, program, ...arg) {
    log(callback(parse(program)[0], ...arg));
}

function testEnum(callback, print, ...arg) {
    let total = 0;
    const progSet = new Set();

    for (const [halted, program, state] of callback(...arg)) {
        if (print) log(halted, unparse(program));
        progSet.add(unparse(program));
        total++;
    }

    log("Total:", total);
    return progSet;
}

function compareEnum(enum1, enum2, length) {
    const set1 = testEnum(enum1, false, length);
    const set2 = testEnum(enum2, false, length);
    const result = set1.difference(set2);

    result.forEach(element => log(element));
}

function testExeDeciders(length) { // OUTDATED
    for (const [program, halted, vars, steps, maxVarId] of enumerate(length)) {
        if (halted !== false) continue;

        const [testHalted, vars, steps] = run(program, {maxSteps: 100, deciders: true});
        if (testHalted === true) log(unparse(program), vars);
    }

    log("Test completed!")
}

// function testIsLoopNonhalting(length) {
//     for (const [program, halted, vars, steps, maxVarId] of enumerate(length)) {
//         if (halted !== false) continue;

//         const [testHalted, vars, steps] = run(program, {maxSteps: 100, deciders: true});
//         if (testHalted === true) log(unparse(program), vars);
//     }

//     log("Test completed!")
// }

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

// test(hasRowWhileVars, "while A {A--; B++;} A--; while A {C++;}");
// test(hasRowWhileVars, "while A {A--; B++;} A++; A++; while A {C++;}");
// test(hasRowWhileVars, "while A {A--; B++;} while B {C++;}");

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

// testExeDeciders(10);
// testIsLoopNonhalting(9);

// testEnum(enumerate, true, 2, {prog: [], vars: [1], steps: 1, progLen: 0, maxVar: 1, minInstr: 0, inLoop: true});
// testEnum(enumerate, false, 8);
// testEnum(enumerate_nonRecursiveGen, true, [{program: [], len: 5}]);

// testEnum(enumerate, false, 10);
// testEnum(enumerate_partial, false, 10);

// compareEnum(enumerate_prev, enumerate, 4);
