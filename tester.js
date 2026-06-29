"use strict";
import {log} from "./log.js";
import {analyzeLoop} from "./isLoopNonhalting.js";
import {parse, unparse, parseArea} from "./parser.js";
import {run, execute} from "./execute.js";
import {hasRowWhileVars} from "./hasRowWhileVars.js"

// Helper functions
// ================================================================

// Quick test for functions that take a program as its first argument
function test(callback, program, ...arg) {
    log(callback(parse(program)[0], ...arg));
}

// Tester functions
// ================================================================

function testAnalyzeLoop() {
    // Halting loops
    test(analyzeLoop, "A++; while A {A--; B--;}", 1);
    test(analyzeLoop, "A--; while B {A++; B--;}", 0);
    test(analyzeLoop, "A--; B++; while B {B--;}", 0);
    test(analyzeLoop, "A--; B--; while B {B--; A++;} B++;", 0);

    // Fixed loops
    test(analyzeLoop, "A++; A++; B++;", 2);
    test(analyzeLoop, "while B {A++; B--;} while A {A--; B++;}", 2);

    // Nonhalting loops
    test(analyzeLoop, "A++; A++;", 0);
    test(analyzeLoop, "A++; B--; B++; B++;", 1);
    test(analyzeLoop, "A++; while A {A--; B++;}", 1);
    test(analyzeLoop, "A++; B--; while A {A--; B++; B++;}", 1);
    test(analyzeLoop, "A--; B++; while B {A++; B--;}", 0);
    test(analyzeLoop, "A--; B++; C++; while B {A++; B--;} B++;", 0);
    test(analyzeLoop, "A++; while A {A--; B++;} while B {A++; B--;}", 0);
    test(analyzeLoop, "while A {A--; B++; B++;} while B {A++; B--;}", 0);
    test(analyzeLoop, "while A {A--; B++; B++;} while B {A++; A++; B--;} A--;", 0);
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

function testHasRowWhileVars() {
    test(hasRowWhileVars, "while A {A--; B++;} A--; while A {C++;}");
    test(hasRowWhileVars, "while A {A--; B++;} A++; A++; while A {C++;}");
    test(hasRowWhileVars, "while A {A--; B++;} while B {B--; C++;}");
    test(hasRowWhileVars, "while A {A--; B++;} while A {A--; B++;}");
}

function testUnparse() {
    log(unparse([{type: "inc", var: 0}, {type: "while", var: 0, body: [
        {type: "dec", var: 0}, {type: "inc", var: 1}, {type: "while", var: 1, body: [
            {type: "inc", var: 0}, {type: "dec", var: 1}
        ]},
        {type: "inc", var: 2}
    ]}]));
}

// Init
// ================================================================

testRun();
testAnalyzeLoop();
testHasRowWhileVars();
log(parse("A++; while A {while A {A--; B++;} while B {A++; B--; foo++;} A--;}"));
log(parseArea("A+ wa{ B- wB{ B- A+ }"));
testUnparse();
