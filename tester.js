"use strict";
import {log} from "./log.js";
import {parse, unparse} from "./parser.js";
import {run} from "./execute.js";
import {enumerate} from "./enumerate.js";
import {
    canLoopHalt, isLoopNonhalting, hasOpVarForEach, getUsedVars,
    filterOutWhiles, isLoopUseful, hasOpVar, doLoopPosVar,
    hasActiveVarForEach
} from "./getProgData.js";

function test(func, program, ...arg) {
    log(func(parse(program)[0], ...arg));
}

function testEnum(length) {
    let total = 0;

    for (const [program, halted, vars, maxVarId] of enumerate(length)) {
        log(halted, unparse(program));
        total++;
    }

    log("Total:", total);
}

// test((i) => i, "A++; while A {A--; B++;}");
// test((i) => i, "A++; while A {A--; B++; while B {B--; C++;}}");
// test((i) => i, "A++; while A {while A {A--; B++;} while B {A++; B--;}}");

// test(canLoopHalt, "A++; while A {B--;}", 1);
// test(canLoopHalt, "A++; B--; B++;", 1);
// test(canLoopHalt, "A++; while A {B++;}", 1);
// test(canLoopHalt, "A++; B--; while A {A--; B++;}", 1);

// test(isLoopNonhalting, "A--; B++; while B {A++; B--;}", 0);
// test(isLoopNonhalting, "A--; while B {A++; B--;}", 0);
// test(isLoopNonhalting, "A--; B++; while B {B--;}", 0);
// test(isLoopNonhalting, "A--; B++; C++; while B {A++; B--;} B++;", 0);

// test(getUsedVars, "A++; while B {A--; B--;}", "inc");
// test(getUsedVars, "A++; while A {A--; while B {B--; C++;}}", "inc");
// test(getUsedVars, "A++; while A {A--; while B {B--; C++;}}", "dec");
// test(getUsedVars, "A++; while A {A--; while B {B--; C++;}}");

// test(hasActiveVarForEach, "A++; while A {A--; while B {A++; B++; C++;}}");
// test(hasActiveVarForEach, "A++; while A {A--; B++; while B {B--; C++;}}");

// test(filterOutWhiles, "A++; while B {A--; B--;}", new Set([0]), {0: 1});
// test(filterOutWhiles, "A--; B--;", new Set(), {0: 1});

test(run, "A++; while A {A--; B++;}", 10, true);
test(run, "A++; while A {A++;}", 10, true);
test(run, "A++; while A {A--; A++;}", 10, true);
test(run, "A++; while A {A++;}", 10, false);

// test(hasOpVarForEach, "A++; while A {B++; while B {A--;}}", "inc");
// test(hasOpVarForEach, "A++; while A {B--; while B {A--;}}", "inc");
// test(hasOpVarForEach, "A++; while A {B++; while B {A++;}}", "dec");
// test(hasOpVarForEach, "A++; while A {B++; while B {A++;}}", "while");

// test(isLoopUseful, "A++; while A {A--; B++;}", 0);
// test(isLoopUseful, "while B {while A {A--; B++;}} B++;", 0);
// test(isLoopUseful, "while A {A--; B++;} while B {A++; B--;}", 0);

// test(hasOpVar, "A++; while A {A--; B++;}", 1, "inc");
// test(hasOpVar, "A++; while A {A--; B++;}", 1, "dec");

// test(doLoopPosVar, "A++; while B {A--; B++;} A++;", 0);
// test(doLoopPosVar, "A++; while B {A--; B++;}", 0);

// testEnum(6);