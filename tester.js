"use strict";
import {log} from "./log.js";
import {parse, unparse, parseArea} from "./parser.js";
import {run, execute} from "./Execute/execute.js";
import {analyzeLoop as backwardAnalyzeLoop} from "./Enumerate/isLoopNonhalting.js";
import {areVarsOrdered} from "./Enumerate/areVarsOrdered.js"
import {analyzeLoop} from "./Enumerate/analyzeLoop.js";

// Helper functions
// ================================================================

// Quick test for functions that take a program as its first argument
function test(callback, program, ...arg) {
    log(callback(parse(program)[0], ...arg));
}

// Tester functions
// ================================================================

function testBackwardAnalyzeLoop() {
    // Halting loops
    test(backwardAnalyzeLoop, "A++; while A {A--; B--;}", 1);
    test(backwardAnalyzeLoop, "A--; while B {A++; B--;}", 0);
    test(backwardAnalyzeLoop, "A--; B++; while B {B--;}", 0);
    test(backwardAnalyzeLoop, "A--; B--; while B {B--; A++;} B++;", 0);

    // Fixed loops
    test(backwardAnalyzeLoop, "A++; A++; B++;", 2);
    test(backwardAnalyzeLoop, "while B {A++; B--;} while A {A--; B++;}", 2);

    // Nonhalting loops
    test(backwardAnalyzeLoop, "A++; A++;", 0);
    test(backwardAnalyzeLoop, "A++; B--; B++; B++;", 1);
    test(backwardAnalyzeLoop, "A++; while A {A--; B++;}", 1);
    test(backwardAnalyzeLoop, "A++; B--; while A {A--; B++; B++;}", 1);
    test(backwardAnalyzeLoop, "A--; B++; while B {A++; B--;}", 0);
    test(backwardAnalyzeLoop, "A--; B++; C++; while B {A++; B--;} B++;", 0);
    test(backwardAnalyzeLoop, "A++; while A {A--; B++;} while B {A++; B--;}", 0);
    test(backwardAnalyzeLoop, "while A {A--; B++; B++;} while B {A++; B--;}", 0);
    test(backwardAnalyzeLoop, "while A {A--; B++; B++;} while B {A++; A++; B--;} A--;", 0);
}

function testRun() {
    // Halting programs
    test(run, "A++; A++; while A {A--; B++; B++;}", {maxSteps: 10, deciders: true});
    test(run, "A++; A++; A++; while A {A--; B++; while B {B--; C++; C++;} while C {B++; C--;}}", {maxSteps: 100, deciders: true})
    test(run, "A++; while A {A++; B++; while B {A--; A--; B--;}}", {maxSteps: 10, deciders: true});

    // Nonhalting programs
    test(run, "A++; while A {A--; A++;}", {maxSteps: 10, deciders: false});
    test(run, "A++; while A {A--; A++;}", {maxSteps: 10, deciders: true});
    test(run, "A++; A++; B++; while A {while B {A--; B--;}}", {maxSteps: 10, deciders: true});
    test(run, "A++; while A {A--; B++; while B {A++; A++; B--;}}", {maxSteps: 10, deciders: true});
    test(run, "A++; while A {while A {A--; B++; B++;} while B {A++; B--;}}", {maxSteps: 10, deciders: true});
    test(run, "A++; A++; while A {while A {A--; B++; B++;} while B {A++; B--;} A--;}", {maxSteps: 10, deciders: true})
}

function testAreVarsOrdered() {
    test(areVarsOrdered, "while A {A--; B++;} A--;");
    test(areVarsOrdered, "while A {A--; B++;} while C {C--; D++;}");
    test(areVarsOrdered, "C++; while A {A--; B++;}");
    test(areVarsOrdered, "C++; while A {A--; B++;} C++;");
}

function testUnparse() {
    log(unparse([{type: "inc", var: 0}, {type: "while", var: 0, body: [
        {type: "dec", var: 0}, {type: "inc", var: 1}, {type: "while", var: 1, body: [
            {type: "inc", var: 0}, {type: "dec", var: 1}
        ]},
        {type: "inc", var: 2}
    ]}]));
}

function testAnalyzeLoop() {
    // Should NOT be pruned
    test(analyzeLoop, "A++; A++; B--;");
    test(analyzeLoop, "while A {A--;} A++; A++;");
    test(analyzeLoop, "A++; A++; while B {B--; A++;}");
    test(analyzeLoop, "A++; B++; B++; while A {A--; C++;}");
    test(analyzeLoop, "A++; while A {while B {B--;} A--;}");
    test(analyzeLoop, "A--; while B {B--; A--; A++; A++;}", 1);
    test(analyzeLoop, "A++; while B {B--; A--; A++; A++;}", 1);
    test(analyzeLoop, "A++; A++; B++; while A {A--; B++; B++;}");
    test(analyzeLoop, "while A {A--; B++; B++;} while B {A++; B--;}", 0);
    test(analyzeLoop, "while A {A--; B++;} while B {A++; A++; B--;} A--;");
    test(analyzeLoop, "while A {A--; B++;} while B {A++; A++; B--;} A--;", 0);
    test(analyzeLoop, "while A {A--;} A++; A++; B++; while A {A--; B--;}", 0);
    test(analyzeLoop, "A++; A++; while A {A--; B++;} while B {A++; A++; B--;} A--;", 0);

    // Should be pruned
    test(analyzeLoop, "while A {A--; B++;} A--;");
    test(analyzeLoop, "while A {A--; while B {B++;}}");
    test(analyzeLoop, "A++; while A {B++; while A {A--;}}");
}

// Init
// ================================================================

testAnalyzeLoop();
// testBackwardAnalyzeLoop();
// testAreVarsOrdered();
// testUnparse();
// log(parse("A++; while A {while A {A--; B++;} while B {A++; B--; foo++;} A--;}"));
// log(parseArea("A+ wa{ B- wB{ B- A+ }"));
// testRun();
