# AGENTS.md

> Instructions for AI agents contributing to the **BusyBeaver** project. Surfaced here are the architecture, conventions, and pitfalls that speed up reasoning.
>
> **Stuck? Read §10 (Anti-Patterns) and §9 (Workflow) first.**

## 1. Project at a Glance

**BusyBeaver** studies the Busy Beaver function for **CounterScript** — a minimal Turing-complete model with counters:

| Instruction | Meaning |
| - | - |
| `A++;` | Increment counter `A` by 1 |
| `A--;` | Decrement `A` by 1 (clamped at 0) |
| `while A {…}` | Execute body while `A > 0` |

Goal: enumerate CounterScript programs up to length `ENUM.MAX_LENGTH` (`config.js`), classify each as **halted**, **nonhalted**, or **holdout**, and find champions (highest-scoring halting programs). See `Docs/results-status.md`, `Docs/spec-counterscript.md`.

## 2. Architecture & Pipeline

| Folder | Responsibility |
| - | - |
| **Execute/** | Interpreter: `execute.js` (runner), `counters.js` (counter ops), `exeStack.js` (frames), `decider.js` (cycler detection) |
| **Enumerate/** | TNF enumerator: `enumerator.js`, `enumActions.js` (apply/undo), `nextState.js`, `nextStack.js`, `areaBuilder.js` |
| **Pruning/** | `pruner.js` (rules), `scanner.js`, `loopAnalyzer.js` (abstract interpretation), `areVarsOrdered.js`, `isLoopNested.js`, `valueProps.js` |
| **Website/** | Browser interpreter UI (`runner.js`, `renderCounters.js`, `lineNumbers.js`) |

Root files: `main.js`, `parser.js`, `config.js`, `log.js`, `tester.js`.

## 3. Key Concepts (see `Docs/terminology.md`, `Docs/tnf-enumeration.md`)

- **TNF enumeration** — Programs are built *while simultaneously executing* them. Loop bodies are generated only when execution proves they are reachable. The **program stack** (generation frames, via `NextStack`) tracks *where to append*; the **execution stack** (interpreter frames, via `ExeStack`) tracks *what path is being simulated*.
- **Abstract values** — `Value.get(state, varId)` / `Value.set(state, varId, val)`. `state.eq` holds per-variable values; `state.def` is the fallback. Three types:
  - `isEqualTo` / `v` — counter is exactly `N`.
  - `isAtLeast` / `v` — counter is ≥ `N`.
  - `isEqualToSelf` / `d, i, p` — decreases by `d`, increases by `i` per iteration; `p` means start ≥ 1.
- **BBCS(n)** — Largest score (max counter value) by a halting program of length `n`. Nonhalting programs ignored.

## 4. Running

```bash
node main.js              # full enumeration (halted/nonhalted/holdout/champion counts)
node tester.js            # sanity tests (uncomment test calls at bottom)
npx serve .               # browser UI (or: python -m http.server)
```

Config (`config.js`): `ENUM.MAX_LENGTH`, `ENUM.MAX_STEPS`, `LOG.*` (CHAMPION, HALTED, NONHALTED, HOLDOUT, SHOW_STATUS), `AREA.*`.

## 5. Conventions

- **ES Modules** — `import`/`export` with `"use strict"`. File extensions in imports required (`./log.js`).
- **Mutable references** — The enumerator mutates `program` arrays and `state` objects in place. `yieldProgram` yields mutable references, not copies. **Don't clone** unless code explicitly needs a snapshot.
- **Undo pattern** — `Enum.appBasicInstr`, `Enum.appWhileLoop`, `Enum.exitLoopBody` return `{state, undo}`. **Always call `undo()` after `yield*`** (see `enumerator.js` L30-33, 48-51, 84-86).
- **Indentation** — 4 spaces.
- **No backward compat** — No shims, polyfills, or fallbacks for older environments.
- **No JSDoc** — Don't add `/** ... */` comments unless asked. Clear names + minimal inline comments.

## 6. Correctness Constraints

1. **Deciders: no false positives.** A decider proves *nonhalting*; misclassifying halting as nonhalting silently corrupts results (`CONTRIBUTING.md` checklist).
2. **Pruning preserves search space.** Verify rules against `Docs/search-techniques.md`.
3. **Null-check `analyzeLoop`/`filterLoop`** — returns `null` for nonhalting/equivalent. Check before use.
4. **Undefined loop bodies** — `instr.body` may be `undefined` during TNF enumeration; handled by `scanner.js` → `hasUndefinedLoop` and `Prune.undefinedLoop`.
5. **Counter symmetry** — Counters renamed to integer IDs on parse (first available ID); respect in pruning.
6. **Holdout** — Execution timeout (`steps ≥ MAX_STEPS`) → `halted === null`. `Prune.holdout` checks loop frames for invalid nesting before yielding.

## 7. Testing & Verification

- **`tester.js`** — Test suites for interpreter, `areVarsOrdered`, `analyzeLoop`, area parsing. Uncomment `test(...)` calls at bottom to run.
- **Reference program** (`TODO.md`): `A++; while A {A++; while B {A--; B--; C++;} while C {B++; C--; while B {B--; D++; D++; D++;} while D {D--; B++;}} C++;}` — nested loops, multiple counters, complex control flow.
- **Expected counts** in `TODO.md` / `Docs/results-status.md`; **Holdouts/** for reference programs per BBCS length.

## 8. Quick Reference

| Need | File(s) |
| - | - |
| Full search | `main.js` |
| Parse/unparse | `parser.js` |
| Execute | `Execute/execute.js` → `run(program, config)` |
| Enumerate | `Enumerate/enumerator.js` → `enumerate(area)` |
| Apply/undo | `Enumerate/enumActions.js` |
| Pruning rules | `Pruning/pruner.js` |
| Abstract interpretation | `Pruning/loopAnalyzer.js` + `valueProps.js` |
| Counter ops | `Execute/counters.js` |
| Execution frames | `Execute/exeStack.js` |
| Deciders | `Execute/decider.js` |
| Search rules | `Docs/search-techniques.md` |
| TNF enumeration | `Docs/tnf-enumeration.md` |
| Roadmap | `TODO.md` |
| Contributions | `CONTRIBUTING.md` |

## 9. Workflow

Follow this sequence. **Skipping steps is the most common cause of getting stuck.**

1. **Understand** — Read the task; identify subsystems (Execute/Enumerate/Pruning/Website); check `TODO.md` for related work.

2. **Read relevant code + docs** — Use §8 to find 2–3 key files; read the matching `Docs/` file. Don't skip — TNF two-stack model and abstract interpretation are subtle.

3. **Reproduce** — Run `node main.js` and `node tester.js` to confirm baseline. For bugs, write a minimal `debug.mjs`:

   ```js
   import {parse, unparse} from "./parser.js";
   import {run} from "./Execute/execute.js";
   import {analyzeLoop} from "./Pruning/loopAnalyzer.js";
   import {log} from "./log.js";
   log("halted:", run(parse("A++; while A {A--; B++;}")[0], {maxSteps: 100, deciders: true})[0]);
   log("analysis:", analyzeLoop(parse("A++; while A {A--; B++;}")[0], 0));
   ```
  
4. **Debug systematically** — Read the error (file, line, type). Trace the path with `log()`. Form a hypothesis. Test it. Fix root cause, not symptom.

5. **Change minimally** — One change at a time. Smallest fix that could work. No JSDoc/backward-compat cruft.

6. **Test immediately** — Relevant tests pass; if enumeration affected, run `node main.js` and compare counts vs `TODO.md` / `Docs/results-status.md`.

7. **Verify no false positives** — Halting programs must not be classified as nonhalting (§6.1; test against reference program + known champions).

8. **Update docs** — Behavior change → update `Docs/`; new pruning rule → `Docs/search-techniques.md`; new decider → `Docs/loop-analyzer.md` or `Docs/architecture.md`.

9. **Clean up** — Delete temporary debug scripts.

**Stop** if repeating the same fix 3+ times or can't trace a failure (see §11).

## 10. Anti-Patterns

| Trap | What to do |
| - | - |
| **A. Undo** | Always call `undo()` after `yield*` following `Enum.app*`. Wrong results → verify every `app*` has matching `undo()` (`enumerator.js` L30-33, 48-51, 84-86). |
| **B. Clone-everything** | Don't clone `program`/`state`; trust mutable refs. Snapshot only where code needs it (`ExeStack.cloneStack`). |
| **C. Read-every-file** | Use §8 Quick Reference to find the 2–3 relevant files first. |
| **D. Big refactor** | One small change at a time. Large refactors go in separate PRs. |
| **E. False positives** | Deciders must never misclassify halting as nonhalting (§6.1, §9.7). |
| **F. Infinite recursion** | Base cases unbreakable: `state.progLength + 1 > MAX_LENGTH` and `stack.length === 1`. |
| **G. Null check** | `analyzeLoop`/`filterLoop` return `null` — check before use (§6.3). |
| **H. Spinning on tests** | Read the error, trace the path, one targeted fix. Ask for help after 2–3 iterations (§11). |
| **I. Random change** | Form a hypothesis, test it first, then change code (§9.4). |
| **J. Symptom chasing** | Trace data flow *backwards* from the wrong result to its source. |
| **K. Ignoring errors** | Read full error messages. TypeError on null → §10.G. Wrong counts → §14.2. |
| **L. Over-commenting** | No JSDoc, no compat shims, no verbose comments unless asked (§5). |

## 11. When to Ask for Help

Stop and ask if: repeated the same fix 3+ times; don't grasp the TNF two-stack model after reading `Docs/tnf-enumeration.md`; unsure if a pruning rule preserves the search space; about to do a large refactor for a small fix; can't trace a test failure; modifying decider logic without verification. Include: what you tried, expected, actual, file/line numbers, minimal repro.

## 12. Other Docs

| Doc | Purpose |
| - | - |
| AGENTS.md | This file — agent guidance |
| CONTRIBUTING.md | Contribution process + PR checklist |
| Docs/ | Technical reference (read per subsystem) |
| TODO.md | Task roadmap |
| README.md | Project overview |

## 13. Debugging Cheatsheet

- **`log()`** (`log.js`) — pretty-prints any state object. `log("ctx:", ctx)`.
- **Website UI** — `npx serve .`; paste program, use Step/Run, inspect counter table + AST output.
- **tester.js** — add program to `TEST_RUN`/`TEST_ANALYZE_LOOP`/etc., uncomment `test(...)`, run `node tester.js`.
- **Git** — `git log`, `git diff`, `git stash` (test hypothesis), `git bisect start` → `git bisect bad HEAD` → `git bisect good <commit>` → run tests → `good`/`bad`.
- **Two stacks** — Program stack (frames): `program`, `loopVar`, `callStack` (snapshot of execution stack), `analysis`. Execution stack (`ctx.stack`): `block`, `pc`, `loopVar`, `posVars`, `prevVars`, `prevPrevVars`. Print both: `log("pgm stack:", stack); log("exe stack:", ctx.stack);`.
- **Abstract interpretation** — `Value.get/set`, predicates: `isZero`, `isOne`, `isPositive`, `isStatic`, `isNonhalting`. Types: `isEqualTo`, `isAtLeast`, `isEqualToSelf`. `analyzeLoop(program, whileVar)` → state or `null`; `filterLoop(program, loopVar)` → prune decision. Always null-check (§6.3, §10.G).

## 14. Bug-Finding Strategies

- **Isolate** — Execution: `run(parse(prog)[0], cfg)`. Analysis: `analyzeLoop(parse(prog)[0], varId)`. Pruning: `Prune.*` directly. Parsing: `parse()`/`unparse()`.
- **Compare** — vs `TODO.md` counts; `Docs/results-status.md` champions; `Holdouts/` reference programs.
- **Reference program** — the long one in §7; nested loops, multiple counters, complex control flow.
- **Holdout artifacts** — `Holdouts/` per BBCS length; validate decider/pruning changes.
- **Binary search** — `git bisect`, or comment out sections to narrow scope.

## 15. Bug-Fix Checklist

1. Reproduce (§14). 2. Pinpoint — error message, file, line, type. 3. Trace path with `log()`. 4. Hypothesis. 5. Test hypothesis. 6. Smallest change. 7. Re-test. 8. Full suite (`node tester.js`). 9. Compare enumeration counts. 10. No false positives (§6.1). 11. Update docs (§9.8). 12. Clean up debug scripts.
