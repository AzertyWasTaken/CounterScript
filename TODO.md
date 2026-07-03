# TODO

<!-- AGENT-SAFE START -->
This file is a shared task-board. When editing, only:

- Add new items
- Update checkboxes/status lines
- Do NOT delete headings or existing bullet ideas
<!-- AGENT-SAFE END -->

## Reference (for tests)

- `A++; while A {A++; while B {A--; B--; C++;} while C {B++; C--; while B {B--; D++; D++; D++;} while D {D--; B++;}} C++;}`

### BBCS(10) default

- Total: 3070
- Halted: 2128
- Nonhalted: 942
- Holdout: 0
- Duration: 1.7s

### BBCS(11) default

- Total: 19812
- Halted: 12585
- Nonhalted: 7192
- Holdout: 35
- Duration: 27s

## Enumeration

- [x] Prune short loop tails
- [x] Maximum counters count pruning
- [x] Enumerate BBCS(12)
- [x] Fix `isLoopNonhalting.js` and enumeration bugs
- [x] Loop structure analyzer
- [x] Switch to objects (analyzer)
- [x] Create `is equal to n` type (analyzer)
- [x] Create `is at least n` type (analyzer)
- [x] Add `isEqualToSelfAndIsGreaterThanZero`
- [ ] Add `inc` key in `isEqualToSelf`
- [ ] Add `dec` key in `isEqualToSelf`
- [ ] Replace `isEqualToSelfAndIsGreaterThanZero` by a `atLeast` key in `isEqualToSelf`
- [ ] Merge analyzer with `areVarsOrdered.js`
  - [ ] Loop history and allowed vars list

### Optimize

- [x] Remove `enumerator.js` strict loop length
- [x] Break down `enumerate.js` functions
- [x] Base enumerator without nested generators
- [x] TNF enumerator without nested generators
- [ ] Memoize while-loops states
  - [ ] Each loop may have a `analysis` property with `type: state`
  - [ ] Memoize only when the loop has no undefined values
  - [ ] Restart loop analysis when a nested undefined loop body is generated
  - [ ] `filterLoop` must take an analysis
  - [ ] memoize function must take the whole loop
  - [ ] program stack must have the parent loop

### Test & Documentation

- [x] Enumerate comparator in `tester.js`
- [x] Library module for counter methods
- [x] Parsable area enum config
- [x] Generalized scan programs function
- [x] Option to hide programs status in enumeration output
- [x] Split `README.js` into a docs folder & add a sections table
- [x] Improve glossary
- [x] Table of methods for `nextState`
- [x] Maximum execution steps config in `main.js`
- [x] Document to explain TNF
- [x] Comment `Prune` methods
- [x] Split `getProgData.js`
- [x] Revamp `tester.js`
- [x] Explain how stacks work in TNF document
- [x] Comment `analyzeLoop.js`
- [ ] Undefined loop parser `while # {...}`
- [ ] Function to reuse call stack appends from `execute.js`
- [ ] Function to append instructions

### E/Ideas

- Decide multiperiod cyclers
- `enumerate_TNFnonRecursiveGen`
- Limit counters count
- `isInLoop` argument for pruning functions
- `isLoopNonHalting` auto test
- Early detect programs with useless counters (each must have inc, dec and while loop)
- Remove equivalence `A++; while A {while A {...} ... w/out A++}`
- Remove equivalence `while A {A--; B++;} while B {A++; A++; B--;}`
- head-body-tail equation storage trio
- Refractor files and add folders
- Partial area enumeration (split while-loop and other instr)
- Just-in-time `areVarsOrdered`
- Just-in-time `hasRowWhileVars`

## Website

- [x] Show error messages
- [x] Add comments
- [x] Text editor line numbers
- [x] Display compiled program
- [x] Run step by step
- [x] Option to change run speed (slider)
- [x] Run/Pause button
- [x] Step button
- [x] Show steps count
- [x] Full speed execution
- [x] Stop executing when while web page window is closed
- [x] Refractor main script
- [ ] Add macros parser
- [ ] Undo step option
  - [ ] States history object
- [ ] Auto programs coloring
- [ ] Color selected line

### W/Ideas

- Visualize running program
- Search and replace
- Accelerated simulation (auto multiply/transfer counters)
- Functional programming `function A {...}` (compile to standard CS before running)
- Variable scopes
