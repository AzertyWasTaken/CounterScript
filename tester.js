"use strict";
import {log} from "./log.js";
import {parse, unparse, parseArea} from "./parser.js";
import {run} from "./Execute/execute.js";
import {areVarsOrdered} from "./Pruning/areVarsOrdered.js";
import {analyzeLoop} from "./Pruning/loopAnalyzer.js";
import {buildArea} from "./Enumerate/areaBuilder.js";
import {Value} from "./Pruning/valueProps.js";
import {Enum} from "./Enumerate/enumActions.js";

// Enumerator tester
// ================================================================

export function testEnum(program, target, ...output) {
    if (unparse(program) === target) {
        log("Stack:");
        for (let i = 0; i < output.length; i++) {
            log(i, output[i]);
        }
    }
}

// Helper functions
// ================================================================

// Quick test for functions that take a program as its first argument
function test(callback, progList) {
    for (const [program, ...arg] of progList) {
        log(callback(parse(program)[0], ...arg));
    }
}

function logFrame(frame) {
    log("program:", unparse(frame.program), "callStack:", frame?.callStack);
}

function testArea(checklist) {
    for (const area of checklist) {
        try {
            const [stack, state] = buildArea(parseArea(area));
            // log("State:", state);

            log("Stack:");
            for (let i = 0; i < stack.length; i++) {
                log(i, stack[i]);
                // log(unparse(frame.program));
                // log(frame?.analysis?.eq);
                // log(frame?.analysis?.def);
            }
        } catch (error) {
            log(error);
        }
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
    // --------------------------------

    // Single step
    ["", {maxSteps: 10, deciders: true}],
    ["A++;", {maxSteps: 10, deciders: true}],
    ["A--;", {maxSteps: 10, deciders: true}],
    ["while A {}", {maxSteps: 10, deciders: true}],

    // Multiple steps
    ["A++; while A {A--; A++; A--;}", {maxSteps: 10, deciders: true}],
    ["A++; A++; while A {A--; B++; B++;}", {maxSteps: 10, deciders: true}],
    ["A++; while A {A++; B++; while B {A--; A--; B--;}}", {maxSteps: 10, deciders: true}],
    ["A++; while A {A--; B++; while B {B--; C++; while C {C--; D++;}}}", {maxSteps: 100, deciders: true}],
    ["A++; B++; C++; while A {A--; B++;} while B {B--; C++;} while C {C--;}", {maxSteps: 100, deciders: true}],

    // Long-running
    ["A++; A++; A++; while A {A--; B++; while B {B--; C++; C++;} while C {B++; C--;}}", {maxSteps: 100, deciders: true}],

    // Nonhalting programs
    // --------------------------------

    ["A++; while A {A++;}", {maxSteps: 10, deciders: true}],
    ["A++; while A {A--; A++;}", {maxSteps: 10, deciders: true}],
    ["A++; while A {A--; while A {A++;}}", {maxSteps: 10, deciders: true}],
    ["A++; while A {A--; B++; while B {B--; A++;}}", {maxSteps: 10, deciders: true}],
    ["A++; A++; B++; while A {while B {A--; B--;}}", {maxSteps: 10, deciders: true}],
    ["A++; while A {A--; B++; while B {A++; A++; B--;}}", {maxSteps: 10, deciders: true}],
    ["A++; while A {while A {A--; B++; B++;} while B {A++; B--;}}", {maxSteps: 10, deciders: true}],
    ["A++; A++; while A {while A {A--; B++; B++;} while B {A++; B--;} A--;}", {maxSteps: 10, deciders: true}],

    // Disabled deciders
    // --------------------------------

    ["A++; A++; while A {A--;}", {maxSteps: 1, deciders: false}],
    ["A++; while A {A--; A++;}", {maxSteps: 10, deciders: false}],
];

const TEST_ARE_VARS_ORDERED = [
    // true
    ["",],
    ["A++; A--; B++; B--;",],
    ["while A {A--;} while B {B--;}",],
    ["while A {A--; B++;} while B {B--;} A--;",],
    ["while A {A--; while B {B--; C++;} C++;}",],
    ["while A {A--; B++;} A--;"],
    ["while A {A--; B++;} while C {C--; D++;}"],
    ["C++; while A {A--; B++;}"],

    // false
    ["C++; while A {A--; B++;} C++;"],
    ["while A {A--; B++;} A++; C++;",],
    ["A++; B++; while A {A--; C--;} B--;"],
    ["while A {A--;} B++; while B {B--;}",],
];

const TEST_ANALYZE_LOOP = [
    // Should NOT be pruned
    // --------------------------------

    // Empty program
    ["",],

    // No loop
    ["A--;",],
    ["A++;",],
    ["A++; A++; B--;"],

    // 1-level loop
    ["while A {A--;}"],
    ["while A {A--; B++;}"],
    ["while A {A--;} A++; A++;"],
    ["A++; while A {A--; B++;}"],
    ["A++; while A {A--; B++;}", 0],
    ["A++; A++; while B {B--; A++;}"],
    ["A++; B++; B++; while A {A--; C++;}"],
    ["A++; while B {B--; A--; A++; A++;}", 1],
    ["A++; A++; B++; while A {A--; B++; B++;}", 0],
    ["while A {A--; B++; B++;} while B {A++; B--;}", 0],
    ["while A {A--;} A++; A++; B++; while A {A--; B--;}"],
    ["A++; while A {A--; B++; B++;} while B {A++; A++; B--;} A--;", 0],

    // 2-level loop
    ["A++; while A {while B {B--;} A--;}"],
    ["A++; while A {A--; B++; while B {B--; C++;}}", 0],
    ["while A {A--; B++;} A++; while B {B--; while A {C++; A--;}}", 2],

    // Should be pruned
    // --------------------------------

    // Dec on def-0 counter
    ["while A {A--;} A--;", 0],

    // While on def-0 counter
    ["while A {A--;} while A {A--; B++;}",],

    // Repeat-once while
    ["A++; while A {B++; while A {A--;}}"],

    // Nonhalting
    ["A++; while A {B++;}", 0],
    ["A++; while A {A++;}", 0],
    ["while A {A--; B++;} A--;"],
    ["A++; while A {B++; B--;}", 0],
    ["while A {A--; while B {B++;}}"],
    ["A++; A++; while A {A--; A++;}", 0],
    ["A++; while A {A--; while B {B++; B--;} A++;}", 0],
];

const TEST_AREA = [
    // Single frame stack
    "",
    "A+",
    "A+ A+",
    "A- B- C-",
    "A+ wA{ A- } B+",

    // Multiple frames stack
    "A+ wA{",
    "A+ wA{ A+",
    "A+ wA{ A+ wB{",
    "A+ wA{ A+ B+ wB{",
    "A+ wA{ wA{ A- B+ B+ }",

    // Nonhalting loop exit
    "A+ wA{ A+ } B+",
    "A+ wA{ wB{ wC{ }",
];

// Init
// ================================================================

// testUnparse();
// log(parseArea("A+ wa{ B- wB{ B- A+ }"));
// log(parse("A++; while A {while A {A--; B++;} while B {A++; B--; foo++;} A--;}"));
// log("==== Are vars ordered ====");
// test(areVarsOrdered, TEST_ARE_VARS_ORDERED);
// log("==== Execute ====");
// test(run, TEST_RUN);
// log("==== Analyze loop ====");
// test(analyzeLoop, TEST_ANALYZE_LOOP);
// log("==== Area ====");
// testArea(TEST_AREA);
// log("==== Count iterations ====");
// log(Value.countIterations({t: "isEqualToSelf", d: 0, i: 1, p: false}, {t: "isEqualTo", v: 0}));
// log(Value.isOne({t: "isEqualTo", v: 1}));
// log(Value.isPositive({t: "isEqualToSelf", d: 1, i: 0, p: true}));

// log("==== Other ====");
