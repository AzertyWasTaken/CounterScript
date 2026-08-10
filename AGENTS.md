# AGENTS.md

> Instructions for AI agents contributing to the **BusyBeaver** project. These guidelines improve reasoning speed and reduce wasted effort by surfacing the project's architecture, conventions, and pitfalls up front.
>
> **If you are getting stuck or going in circles, read §9 (Agent Workflow) and §10 (Anti-Patterns) first.**

## 1. Project at a Glance

**BusyBeaver** studies the Busy Beaver function for **CounterScript** — a minimal Turing-complete model with counters and three instruction types:

| Instruction | Meaning |
| - | - |
| `A++;` | Increment counter `A` by 1 |
| `A--;` | Decrement `A` by 1 (clamped at 0) |
| `while A {…}` | Execute body while `A > 0` |

The goal is to enumerate all CounterScript programs up to a given length (`config.js` → `ENUM.MAX_LENGTH`), classify each as **halted**, **nonhalted**, or **holdout**, and find champions (highest-scoring halting programs). See `Docs/results-status.md` and `Docs/spec-counterscript.md`.

## 2. Architecture & Pipeline

Four subsystems, each in its own folder:

| Folder | Responsibility |
| - | - |
| **Execute/** | Interpreter: `execute.js` (step-by-step runner), `counters.js` (counter ops), `exeStack.js` (call-stack frames), `decider.js` (translated-cycler detection) |
| **Enumerate/** | TNF enumerator: `enumerator.js` (main generator), `enumActions.js` (apply/undo), `nextState.js` (enum state), `nextStack.js` (program stack), `areaBuilder.js` (prefix expansion) |
| **Pruning/** | Search-space reduction: `pruner.js` (all rules), `scanner.js` (counter analysis), `loopAnalyzer.js` (abstract interpretation), `areVarsOrdered.js`, `isLoopNested.js`, `valueProps.js` |
| **Website/** | Browser-based interpreter UI (`runner.js`, `renderCounters.js`, `lineNumbers.js`) |

Root files: `main.js` (entrypoint), `parser.js` (parse/unparse), `config.js` (constants), `log.js` (debug helpers), `tester.js` (sanity tests).

## 3. Key Concepts (read `Docs/terminology.md`)

- **TNF (Tree Normal Form) enumeration** — Programs are built *while simultaneously executing* them. Loop bodies are only generated when execution proves they are reachable. See `Docs/tnf-enumeration.md` for the two-stack model.
- **Program stack** (generation frames) vs **Execution stack** (interpreter frames). The program stack tracks *where* to append; the execution stack tracks *what path is being simulated*.
- **Abstract values** — The loop analyzer uses three value types:
  - `{t: "isEqualTo", v: N}` — counter is exactly `N`.
  - `{t: "isAtLeast", v: N}` — counter is ≥ `N`.
  - `{t: "isEqualToSelf", d, i, p}` — decreases by `d`, increases by `i`; `p` means starting value ≥ 1.
  - Access via `Value.get(state, varId)` / `Value.set(state, varId, val)`.
  - `state.eq` holds per-variable values; `state.def` is the default fallback.
- **BBCS(n)** — Largest score (max counter value) achievable by a halting CounterScript program of length `n`. Nonhalting programs are ignored.

## 4. Running the Project

```bash
# Run the enumerator (produces champion/halted/holdout counts)
node main.js

# Run sanity tests (uncomment desired test calls in tester.js)
node tester.js

# Serve the website locally
npx serve .  # or: python -m http.server
```

**Configuration** lives in `config.js`:

- `ENUM.MAX_LENGTH` — target program length.
- `ENUM.MAX_STEPS` — step limit for partial simulation.
- `LOG.*` — toggle verbose output (CHAMPION, HALTED, NONHALTED, HOLDOUT, SHOW_STATUS).
- `AREA.*` — optional prefix area to enumerate from (partial enumeration).

## 5. Code Conventions

- **ES Modules** — all files use `import`/`export` with `"use strict"`.
- **Mutable references for performance** — The enumerator mutates `program` arrays and `state` objects in place rather than cloning. `yieldProgram` yields mutable references (not deep copies). Do **not** clone unless necessary.
- **Undo pattern** — `Enum.appBasicInstr`, `Enum.appWhileLoop`, and `Enum.exitLoopBody` all return `{state, undo}` where `undo()` reverts the mutation. Always call `undo()` after `yield*` in the generator.
- **No package.json** — the project runs directly with `node` using native ESM. File extensions in imports are required (e.g., `import {log} from "./log.js"`).
- **Indentation** — 4 spaces.
- **No backward compatibility** — do not add compatibility shims, polyfills, or fallbacks for older environments or deprecated APIs unless explicitly requested. Target the current codebase only.
- **No JSDoc comments** — do not add JSDoc-style doc comments (`/** ... */`) to functions, parameters, or variables unless explicitly asked. Prefer clear, self-documenting names and minimal inline comments.

## 6. Common Pitfalls & Correctness Constraints

1. **Deciders must never produce false positives.** A decider proves *nonhalting*. If it incorrectly classifies a halting program as nonhalting, results are silently wrong. See `CONTRIBUTING.md` → "Pull request checklist".
2. **Pruning rules preserve the search space.** Removing a program that *could* be a champion loses results. Verify equivalence rules against `Docs/search-techniques.md`.
3. **`analyzeLoop` returns `null`** for nonhalting or equivalent programs — callers must check for `null` before using the result.
4. **Undefined loop bodies** — during TNF enumeration, `instr.body` may be `undefined` until the body is generated. `scanner.js` → `hasUndefinedLoop` and `Prune.undefinedLoop` handle this.
5. **Counter symmetry** — counters are renamed to integer IDs on parse. New counters get the first available ID. This eliminates name-equivalent duplicates but must be respected in pruning.
6. **The `holdout` state** — when execution times out (`steps ≥ MAX_STEPS`), the program is a holdout (`halted === null`). `Prune.holdout` checks all loop frames for invalid nesting before yielding.

## 7. Testing & Verification

- **`tester.js`** contains test suites for the interpreter, `areVarsOrdered`, `analyzeLoop`, and area parsing. Uncomment the relevant `test(...)` calls at the bottom of the file to run them.
- **`CONTRIBUTING.md`** → "Testing expectations" — verify behavior matches intended domain, update test logs, validate with the project's workflow.
- **Reference program** (for validation) is in `TODO.md`: `A++; while A {A++; while B {A--; B--; C++;} while C {B++; C--; while B {B--; D++; D++; D++;} while D {D--; B++;}} C++;}`
- **Holdout artifacts** in `Holdouts/` are reference programs for specific BBCS lengths — use them to validate changes to deciders/pruning.

## 8. Quick Reference: Where to Find Things

| Need | File(s) |
| - | - |
| Run the full search | `main.js` |
| Parse/unparse CounterScript | `parser.js` |
| Execute a program | `Execute/execute.js` → `run(program, config)` |
| Enumerate candidates | `Enumerate/enumerator.js` → `enumerate(area)` |
| Apply/undo instructions | `Enumerate/enumActions.js` |
| Pruning rules | `Pruning/pruner.js` |
| Abstract interpretation | `Pruning/loopAnalyzer.js` + `Pruning/valueProps.js` |
| Counter operations | `Execute/counters.js` |
| Execution stack frames | `Execute/exeStack.js` |
| Deciders (nonhalting) | `Execute/decider.js` |
| Search-space rules docs | `Docs/search-techniques.md` |
| TNF enumeration docs | `Docs/tnf-enumeration.md` |
| Task roadmap | `TODO.md` |
| Contribution guidelines | `CONTRIBUTING.md` |

## 9. Agent Workflow

Follow this sequence for any task. **Skipping steps is the most common cause of getting stuck.**

### Step 1: Understand the task

- Read the task description carefully.
- Identify which subsystem(s) are involved (Execute, Enumerate, Pruning, Website).
- Check `TODO.md` for related open items.

### Step 2: Read the relevant code and docs

- Read the files listed in §8 for the relevant subsystem.
- Read the corresponding `Docs/` file (e.g., `Docs/tnf-enumeration.md`, `Docs/loop-analyzer.md`).
- **Do not skip this step.** The TNF two-stack model and abstract interpretation are subtle; reading the docs first saves hours of confusion.

### Step 3: Reproduce the issue or establish a baseline

- Run `node main.js` to confirm the project works before making changes.
- Run `node tester.js` (uncomment relevant tests) to confirm existing tests pass.
- If fixing a bug, reproduce it with a minimal example first.
  - Write a temporary debug script (e.g., `debug.mjs`) that imports the relevant modules and calls the function directly with the failing input. See §13.2 for examples.
  - Use the Website UI (§13.3) to step through execution of the failing program.
  - Add the failing program to a test array in `tester.js` and uncomment the test call.

### Step 3b: Debug systematically

When you have a failing test or unexpected output, follow this debugging loop:

1. **Read the error message carefully.** Identify the exact assertion, line number, or unexpected value. Do not skim — the error message often tells you exactly what went wrong.
2. **Trace the code path.** Starting from the entry point, follow the execution flow to the point of failure. Use `log()` (§13.1) to print intermediate state at key points.
3. **Form a hypothesis.** Based on the error and code trace, form a specific hypothesis about the root cause. "The undo function is not being called" is a better hypothesis than "something is wrong with the state."
4. **Test the hypothesis.** Add a targeted `log()` statement or write a minimal test that confirms or refutes your hypothesis.
5. **Make one targeted change.** Fix the root cause, not the symptom. See §15 for the full bug-fixing checklist.

### Step 4: Make a small, targeted change

- **One change at a time.** Do not refactor multiple things simultaneously.
- If changing pruning logic, change one rule at a time and verify it doesn't break other rules.
- If changing the interpreter, test with a simple program first.
- If fixing a bug, make the smallest change that could possibly work. See §15 for the full checklist.
- **Edit minimally.** Do not add JSDoc comments or backward-compatibility code unless explicitly asked (§5). Only touch the lines needed for the change.

### Step 5: Test immediately

- Run the relevant test suite or a minimal reproduction.
- If the change affects enumeration, run `node main.js` and compare counts against `TODO.md` / `Docs/results-status.md`.
- **Do not move on until the test passes.**

### Step 6: Verify correctness

- For pruning/decider changes: verify no false positives (halting programs must not be classified as nonhalting).
- For enumeration changes: verify counts match expected values for known lengths.
- For interpreter changes: verify with the reference program in `TODO.md`.
- See §14 for bug-finding strategies and §15 for the full verification checklist.

### Step 7: Update documentation

- If you change behavior, update the relevant `Docs/` file.
- If you add a new pruning rule, document it in `Docs/search-techniques.md`.
- If you add a new decider, document it in `Docs/loop-analyzer.md` or `Docs/architecture.md`.

### When to stop

- The task is complete when the code change is made, tested, and documented.
- If you find yourself making the same change repeatedly, or debugging the same issue for more than a few iterations, **stop and re-read §10 (Anti-Patterns)**.

## 10. Anti-Patterns (How Agents Get Stuck)

### A. The "undo" trap

- **Problem:** Forgetting to call `undo()` after `yield*` in the enumerator corrupts the program stack and state. The agent then sees inexplicable results and keeps "fixing" symptoms instead of the root cause.
- **Solution:** Every `yield*` that follows an `Enum.app*` call must be followed by `undo()`. Check `enumerator.js` lines 30-33, 48-51, 84-86 as the canonical pattern. If results look wrong, verify every `app*` call has a matching `undo()`.

### B. The "clone everything" trap

- **Problem:** Cloning `program` arrays or `state` objects "to be safe" breaks the mutable-reference contract. This causes the enumerator to produce incorrect results (e.g., all programs look identical) and the agent spins trying to debug.
- **Solution:** Trust the mutable-reference pattern. Only clone when the code explicitly needs a snapshot (e.g., `ExeStack.cloneStack` in `exeStack.js`). If you clone, you must also update all references.

### C. The "read every file" trap

- **Problem:** An agent reads every file in the project trying to understand it, never settling on a specific change. This wastes context and time.
- **Solution:** Use §8 (Quick Reference) to identify the 2-3 most relevant files. Read those first. Only read additional files if needed.

### D. The "big refactor" trap

- **Problem:** An agent decides to refactor a large subsystem (e.g., the entire pruning module) to "fix" a small issue. This introduces many new bugs and the agent gets stuck debugging.
- **Solution:** Make the smallest change that could possibly work. If a refactor is truly needed, do it in a separate PR/issue.

### E. The "false positive" trap

- **Problem:** An agent adds a new decider or pruning rule that incorrectly classifies halting programs as nonhalting. The results look plausible but are wrong. The agent can't figure out why counts changed.
- **Solution:** Always verify deciders against the reference program and known champions. A decider that proves nonhalting must be provably correct — test with programs that *do* halt.

### F. The "infinite recursion" trap

- **Problem:** The TNF enumerator uses recursive generators (`nextInstr` → `genBasicInstr`/`genWhileLoop` → `nextInstr`). An agent modifies the recursion without understanding the base cases, causing infinite recursion or stack overflow.
- **Solution:** The base cases are: (1) `state.progLength + 1 > ENUM.MAX_LENGTH` stops extension, (2) `endProgram` yields when `stack.length === 1` (root level). Do not remove or weaken these.

### G. The "null check" trap

- **Problem:** `analyzeLoop` returns `null` for nonhalting or equivalent programs. An agent forgets to check for `null` and tries to access properties on it, causing a crash. The agent then adds a try/catch instead of fixing the root cause.
- **Solution:** Always check `if (state === null) return ...` before using the result of `analyzeLoop` or `filterLoop`.

### H. The "spinning on tests" trap

- **Problem:** An agent runs tests, sees a failure, makes a random change, runs tests again, sees a different failure, and repeats without understanding the root cause.
- **Solution:** When a test fails, **read the error message carefully**. Identify the exact assertion that failed. Trace the code path that led to the failure. Make one targeted fix. If you can't identify the root cause after 2-3 iterations, ask for help (see §11).

### I. The "random change" trap

- **Problem:** An agent sees a test failure, doesn't understand the root cause, and starts making random changes hoping something will work. This wastes time and often introduces new bugs.
- **Solution:** Before making any change, form a specific hypothesis about the root cause. Test the hypothesis with a targeted `log()` statement or minimal reproduction. Only change code after you understand *why* the current code is wrong. See §13.2 and §15.

### J. The "symptom chasing" trap

- **Problem:** An agent sees a wrong result (e.g., a program classified as nonhalting when it should halt) and starts changing the code that produces the result, without tracing back to where the wrong data originated. The real bug is upstream (e.g., in the analysis state or execution stack), but the agent keeps "fixing" the downstream code.
- **Solution:** Trace the data flow backwards from the symptom. Where did the wrong value come from? Was it computed incorrectly, or was it passed in wrong? Use `log()` to print intermediate values at each stage of the pipeline. Fix the root cause, not the symptom.

### K. The "ignoring error messages" trap

- **Problem:** An agent sees a crash or test failure, glances at the error message, and immediately starts changing code without fully understanding what the error means. The error message often contains the exact file, line number, and nature of the problem.
- **Solution:** Read the full error message. Note the file path, line number, and error type. If it's a `TypeError: Cannot read properties of null`, check for missing null checks (§6.3, §10.G). If it's a wrong count, compare against expected values in `TODO.md` and `Docs/results-status.md` (§14.2).

### L. The "over-commenting" trap

- **Problem:** An agent adds JSDoc doc comments, backward-compatibility shims, or verbose explanatory comments to every function "to be helpful." This bloats the code, adds noise, and wastes time.
- **Solution:** Do not add JSDoc comments or backward-compatibility code unless explicitly requested (§5). Write clear, self-documenting code with minimal inline comments. Only comment when the *why* is non-obvious.

## 11. When to Ask for Help

If you experience any of the following, **stop and ask for help** rather than continuing to spin:

- You've made the same change 3+ times without success.
- You don't understand the TNF two-stack model after reading `Docs/tnf-enumeration.md`.
- You're unsure whether a pruning rule preserves the search space.
- You're about to make a large refactor to fix a small issue.
- The test suite fails in a way you can't trace to a specific code path.
- You're modifying decider logic and can't verify correctness.

When asking for help, provide:

1. What you tried.
2. What you expected to happen.
3. What actually happened.
4. The relevant file(s) and line numbers.
5. A minimal reproduction if possible.

## 12. Relationship to Other Docs

- **AGENTS.md** (this file) — High-level guidance for AI agents. Read this first.
- **CONTRIBUTING.md** — Contribution process for human and AI contributors. Follow the PR checklist for any code change.
- **Docs/** — Technical reference. Read the specific doc for the subsystem you're working on.
- **TODO.md** — Task roadmap. Check here for related open work before starting.
- **README.md** — Project overview and links.

## 13. Debugging Techniques

### 13.1 Using the Logging System (`log.js`)

The `log.js` module provides debug-friendly logging that automatically pretty-prints complex objects:

- `log(...args)` — Logs arguments, applying `strValue` to each for pretty-printing.
- `strValue(val)` — Converts any value (arrays, maps, sets, objects) to a readable string.
- `strArray(arr)`, `strSet(set)`, `strMap(map)`, `strObject(obj)` — Type-specific formatters.

**Usage:** Import `log` from `"./log.js"` and call it with any state object. It will recursively pretty-print arrays, maps, sets, and nested objects:

```js
import {log} from "./log.js";
log("ctx:", ctx);           // prints the full execution context
log("vars:", ctx.vars);     // prints counter values as an array
log("stack:", stack);       // prints the program stack
log("analysis:", frame.analysis);  // prints abstract interpretation state
```

### 13.2 Writing Quick Debug Scripts

Create a temporary `.mjs` file (e.g., `debug.mjs`) to test specific scenarios in isolation. This is the fastest way to reproduce a bug:

```js
import {parse, unparse} from "./parser.js";
import {run} from "./Execute/execute.js";
import {analyzeLoop} from "./Pruning/loopAnalyzer.js";
import {log} from "./log.js";

// Test execution
const [program, vars] = parse("A++; while A {A--; B++;}");
const [halted, ctx] = run(program, {maxSteps: 100, deciders: true});
log("halted:", halted);
log("vars:", ctx.vars);
log("steps:", ctx.steps);

// Test analysis
const state = analyzeLoop(program, 0);
log("analysis:", state);

// Test unparse
log("unparsed:", unparse(program));
```

Run with `node debug.mjs`. **Delete the debug script when done** — do not commit it.

### 13.3 Using the Website UI

The `Website/` folder contains a browser-based interpreter with step-by-step execution:

- Serve locally: `npx serve .` (or `python -m http.server`)
- Open `index.html` in your browser
- Paste any CounterScript program into the editor
- Use **Step** to advance one instruction at a time
- Use **Run** to execute continuously (with adjustable speed)
- The compiled AST is shown in the output panel
- Counter values are displayed in a table after each step

This is invaluable for debugging execution issues — you can see exactly how counters change at each step.

### 13.4 Using `tester.js`

`tester.js` contains test arrays for various functions. To test a specific program:

1. Add the program string to the relevant test array (e.g., `TEST_RUN`, `TEST_ANALYZE_LOOP`).
2. Uncomment the corresponding `test(...)` call at the bottom of the file.
3. Run `node tester.js`.

The `test(callback, progList)` helper parses each program string, calls the callback, and logs the result. The `testArea(checklist)` helper tests area parsing.

### 13.5 Using Git for Debugging

Git is a powerful debugging tool:

- `git log` — See recent changes and understand history.
- `git diff` — See what changed in your working directory.
- `git show <commit>` — See a specific commit's changes.
- `git stash` — Temporarily revert changes to test a hypothesis.
- `git bisect` — Find the commit that introduced a bug:

  ```bash
  git bisect start
  git bisect bad HEAD
  git bisect good <known-good-commit>
  # Run the failing test, then:
  git bisect good  # or git bisect bad
  ```

### 13.6 Debugging the Two-Stack Model

The TNF enumerator maintains two parallel stacks. Confusing them is a common source of bugs:

- **Program stack** (generation frames) — in `stack` (from `NextStack`). Each frame has:
  - `program` — the TNF instruction array currently being appended to.
  - `loopVar` — which loop variable this frame represents.
  - `callStack` — a snapshot of the execution stack for resuming simulation.
  - `analysis` — the abstract interpretation state for this loop body.

- **Execution stack** (interpreter frames) — in `ctx.stack` (from `ExeStack`). Each frame has:
  - `block` — the instruction array being executed.
  - `pc` — program counter (current instruction index).
  - `loopVar` — the loop variable for this frame.
  - `posVars` — set of counter IDs that are positive.
  - `prevVars` / `prevPrevVars` — counter snapshots for cycle detection.

When debugging, print both stacks to understand the state:

```js
log("program stack:", stack);
log("execution stack:", ctx.stack);
```

### 13.7 Debugging Abstract Interpretation

The analysis state (`frame.analysis`) has two fields:

- `eq` — an array of abstract values indexed by counter ID. `state.eq[varId]` gives the value, or `undefined` if not set.
- `def` — the default abstract value used when `eq[varId]` is `undefined`.

Three value types:

- `{t: "isEqualTo", v: N}` — counter is exactly `N`.
- `{t: "isAtLeast", v: N}` — counter is ≥ `N`.
- `{t: "isEqualToSelf", d, i, p}` — decreases by `d`, increases by `i` per iteration; `p` means starting value ≥ 1.

Key functions:

- `Value.get(state, varId)` / `Value.set(state, varId, val)` — access values.
- `Value.isZero(value)`, `Value.isOne(value)`, `Value.isPositive(value)`, `Value.isStatic(value)`, `Value.isNonhalting(value)` — predicates.
- `analyzeLoop(program, whileVar)` — returns the analysis state, or `null` for nonhalting/equivalent programs.
- `filterLoop(program, loopVar)` — returns `true` if the loop should be pruned.

**Always check for `null`** when using `analyzeLoop` or `filterLoop` results (see §6.3, §10.G).

### 13.8 Debugging the Undo Pattern

Every `Enum.appBasicInstr`, `Enum.appWhileLoop`, and `Enum.exitLoopBody` returns `{state, undo}`. The `undo()` function reverts the mutation. **Always call `undo()` after `yield*`** in the generator.

If results look wrong, verify every `app*` call has a matching `undo()`. Check `enumerator.js` lines 30-33, 48-51, 84-86 as the canonical pattern. A missing `undo()` corrupts the program stack and state, leading to inexplicable results.

### 13.9 Debugging the Mutable Reference Pattern

The enumerator mutates `program` arrays and `state` objects in place rather than cloning. `yieldProgram` yields mutable references (not deep copies). Do **not** clone unless necessary — cloning breaks the mutable-reference contract and causes the enumerator to produce incorrect results (e.g., all programs look identical).

Only clone when the code explicitly needs a snapshot (e.g., `ExeStack.cloneStack` in `exeStack.js`, `cloneAnalysisState` in `enumActions.js`). If you clone, you must also update all references.

## 14. Bug-Finding Strategies

### 14.1 Reproduce with a Minimal Example

Isolate the bug to the smallest possible program. Use the appropriate function directly:

- **Execution bugs:** `run(parse(program)[0], config)` — see §13.2.
- **Analysis bugs:** `analyzeLoop(parse(program)[0], varId)` — see §13.7.
- **Area bugs:** `buildArea(parseArea(area))` — see §7.
- **Pruning bugs:** Call `Prune.*` functions directly with a parsed program.

### 14.2 Compare with Expected Output

- Check `TODO.md` for expected counts (Total, Halted, Nonhalted, Holdout).
- Check `Docs/results-status.md` for expected champions and holdout counts.
- Check `Holdouts/` for reference programs for specific BBCS lengths.
- If counts don't match, the bug is likely in enumeration or pruning.

### 14.3 Use the Reference Program

The reference program in `TODO.md` is:

```text
A++; while A {A++; while B {A--; B--; C++;} while C {B++; C--; while B {B--; D++; D++; D++;} while D {D--; B++;}} C++;}
```

Test with this program to verify execution and analysis. It exercises nested loops, multiple counters, and complex control flow.

### 14.4 Test with Holdout Artifacts

`Holdouts/` contains reference programs for specific BBCS lengths. Use these to validate changes to deciders/pruning. Each file contains programs that are holdouts (undecided) for a specific length.

### 14.5 Isolate Subsystems

- If the bug is in execution, test with `run()` directly.
- If the bug is in enumeration, test with `enumerate()` directly.
- If the bug is in pruning, test with `Prune.*` functions directly.
- If the bug is in analysis, test with `analyzeLoop()` directly.
- If the bug is in parsing, test with `parse()` and `unparse()` directly.

### 14.6 Binary Search on Code

- If a change broke something, use `git bisect` to find the commit.
- If a function is wrong, test it in isolation with a minimal input.
- Comment out sections of code to narrow down where the bug is.

## 15. Bug-Fixing Checklist

Follow this checklist when fixing a bug:

1. **Reproduce** the bug with a minimal example (§14.1).
2. **Identify** the exact failure — error message, wrong output, crash, or wrong count.
3. **Read** the error message carefully — note the file, line number, and error type.
4. **Trace** the code path from the entry point to the point of failure. Use `log()` (§13.1) to print intermediate state.
5. **Form** a specific hypothesis about the root cause.
6. **Test** the hypothesis with a targeted `log()` statement or minimal reproduction.
7. **Make** one targeted change — the smallest change that could possibly work.
8. **Test** the fix with the minimal reproduction.
9. **Run** the full test suite (`node tester.js`) to check for regressions.
10. **If** the change affects enumeration, run `node main.js` and compare counts against `TODO.md` / `Docs/results-status.md`.
11. **Verify** no false positives — halting programs must not be classified as nonhalting (§6.1, §10.E).
12. **Update** documentation if the change affects behavior (§9.7).
13. **Clean up** — delete any temporary debug scripts.
