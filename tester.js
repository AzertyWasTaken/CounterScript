"use strict";
import {log} from "./log.js";
import {parse, unparse, parseArea} from "./parser.js";
import {run, execute} from "./Execute/execute.js";
import {areVarsOrdered} from "./Pruning/areVarsOrdered.js"
import {analyzeLoop} from "./Pruning/analyzeLoop.js";

// Helper functions
// ================================================================

// Quick test for functions that take a program as its first argument
function test(callback, progList) {
    for (const [program, ...arg] of progList) {
        log(callback(parse(program)[0], ...arg));
    }
}

// Tester functions
// ================================================================

function testUnparse() {
    log(unparse([{type: "inc", var: 0}, {type: "while", var: 0, body: [
        {type: "dec", var: 0}, {type: "inc", var: 1}, {type: "while", var: 1, body: [
            {type: "inc", var: 0}, {type: "dec", var: 1}
        ]},
        {type: "inc", var: 2}
    ]}]));
}

const TEST_RUN = [
    // Halting programs
    ["A++; A++; while A {A--; B++; B++;}", {maxSteps: 10, deciders: true}],
    ["A++; while A {A++; B++; while B {A--; A--; B--;}}", {maxSteps: 10, deciders: true}],
    ["A++; A++; A++; while A {A--; B++; while B {B--; C++; C++;} while C {B++; C--;}}", {maxSteps: 100, deciders: true}],

    // Nonhalting programs
    ["A++; while A {A--; A++;}", {maxSteps: 10, deciders: false}],
    ["A++; while A {A--; A++;}", {maxSteps: 10, deciders: true}],
    ["A++; A++; B++; while A {while B {A--; B--;}}", {maxSteps: 10, deciders: true}],
    ["A++; while A {A--; B++; while B {A++; A++; B--;}}", {maxSteps: 10, deciders: true}],
    ["A++; while A {while A {A--; B++; B++;} while B {A++; B--;}}", {maxSteps: 10, deciders: true}],
    ["A++; A++; while A {while A {A--; B++; B++;} while B {A++; B--;} A--;}", {maxSteps: 10, deciders: true}],
];

const TEST_ARE_VARS_ORDERED = [
    // true
    ["while A {A--; B++;} A--;"],
    ["while A {A--; B++;} while C {C--; D++;}"],
    ["C++; while A {A--; B++;}"],

    // false
    ["C++; while A {A--; B++;} C++;"],
    ["A++; B++; while A {A--; C--;} B--;"],
]

const TEST_ANALYZE_LOOP = [
    // Should NOT be pruned
    ["A++; A++; B--;"],
    ["while A {A--;} A++; A++;"],
    ["A++; A++; while B {B--; A++;}"],
    ["A++; B++; B++; while A {A--; C++;}"],
    ["A++; while A {while B {B--;} A--;}"],
    ["A--; while B {B--; A--; A++; A++;}", 1],
    ["A++; while B {B--; A--; A++; A++;}", 1],
    ["A++; A++; B++; while A {A--; B++; B++;}"],
    ["while A {A--; B++; B++;} while B {A++; B--;}", 0],
    ["while A {A--; B++;} while B {A++; A++; B--;} A--;"],
    ["while A {A--; B++;} while B {A++; A++; B--;} A--;", 0],
    ["while A {A--;} A++; A++; B++; while A {A--; B--;}", 0],
    ["A++; A++; while A {A--; B++;} while B {A++; A++; B--;} A--;", 0],

    // Should be pruned
    ["while A {A--; B++;} A--;"],
    ["while A {A--; while B {B++;}}"],
    ["A++; while A {B++; while A {A--;}}"],
];

// Init
// ================================================================

// testUnparse();
// test(run, TEST_RUN);
// test(areVarsOrdered, TEST_ARE_VARS_ORDERED);
test(analyzeLoop, TEST_ANALYZE_LOOP);
// log(parse("A++; while A {while A {A--; B++;} while B {A++; B--; foo++;} A--;}"));
// log(parseArea("A+ wa{ B- wB{ B- A+ }"));
