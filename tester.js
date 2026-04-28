"use strict";
import {log} from "./log.js";
import {parse, unparse} from "./parser.js";
import {run} from "./execute.js";
import {enumerate} from "./enumerate.js";
import {
    isLoopNonhalting, hasOpVarForEach, getUsedVars, filterOutVars,
    canRepeatTwice, hasOpVar, hasActiveVarForEach, getInactiveVars
} from "./getProgData.js";
// import {enumerate as TNF} from "./enumerateTNF.js";

function test(func, program, ...arg) {
    log(func(parse(program)[0], ...arg));
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
        if (halted !== false) {continue;}
        if (!hasOpVarForEach(program, "while")) {continue;}

        const [testHalted, vars, steps] = run(program, 100, false);
        if (testHalted === true) {log(unparse(program), vars);}
    }
}

// test((i) => i, "A++; while A {A--; B++;}");
// test((i) => i, "A++; while A {A--; B++; while B {B--; C++;}}");
// test((i) => i, "A++; while A {while A {A--; B++;} while B {A++; B--;}}");

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

// test(getUsedVars, "A++; while B {A--; B--;}", "inc");
// test(getUsedVars, "A++; while A {A--; while B {B--; C++;}}", "inc");
// test(getUsedVars, "A++; while A {A--; while B {B--; C++;}}", "dec");
// test(getUsedVars, "A++; while A {A--; while B {B--; C++;}}");

// test(hasActiveVarForEach, "A++; while A {A--; while B {A++; B++; C++;}}");
// test(hasActiveVarForEach, "A++; while A {A--; B++; while B {B--; C++;}}");
// test(getInactiveVars, "A++; while A {A--; while B {B++;} C++; D--;}");

// test(filterOutVars, "A--; B--; C++;", new Set([1]));
// test(filterOutVars, "A++; while A {A--; B--; while C {C--;}}", new Set([1]));
// test(filterOutVars, "A++; while B {A--; B--; while C {C--;}}", new Set([0,2]));

test(run, "A++; while A {A--; A++;}", 10, false);
test(run, "A++; while A {A--; B++;}", 10, true);
test(run, "A++; while A {A++;}", 10, true);
test(run, "A++; while A {A--; A++;}", 10, true);
test(run, "A++; A++; B++; while A {while B {A--; B--;} C++;}", 10, true);
test(run, "A++; while A {A--; B++; while B {A++; A++; B--;}}", 10, true);
test(run, "A++; while A {A++; A++; B++; while B {A--; B--;}}", 10, true);
test(run, "A++; while A {A++; B++; while B {A--; B--;}}", 10, true);
test(run, "A++; B++; while A {A++; while B {A--; B--; B--;}}", 10, true);
test(run, "A++; while A {B--; C++; while B {A--; while C {B--; C--;}} B++;}", 10, true);
test(run, "A++; while A {while A {A--; B++;} while B {A++; A++; B--;}}", 10, true);

// test(hasOpVarForEach, "A++; while A {B++; while B {A--;}}", "inc");
// test(hasOpVarForEach, "A++; while A {B--; while B {A--;}}", "inc");
// test(hasOpVarForEach, "A++; while A {B++; while B {A++;}}", "dec");
// test(hasOpVarForEach, "A++; while A {B++; while B {A++;}}", "while");

// test(canRepeatTwice, "A++; while A {A--; B++;}", 0);
// test(canRepeatTwice, "A++; while B {while A {A--; B++;}} B++;", 0);
// test(canRepeatTwice, "while A {A--; B++;} while B {A++; B--;}", 0);

// test(hasOpVar, "A++; while A {A--; B++;}", 1, "inc");
// test(hasOpVar, "A++; while A {A--; B++;}", 1, "dec");

// test(doLoopPosVar, "A++; while B {A--; B++;} A++;", 0);
// test(doLoopPosVar, "A++; while B {A--; B++;}", 0);

// testDeciders(8);

// testEnum(enumerate, 6);
// testEnum(TNF, 5);