# TODO

<!-- AGENT-SAFE START -->
This file is a shared task-board. When editing, only:

- Add new items
- Update checkboxes/status lines
- Do NOT delete headings or existing bullet ideas
<!-- AGENT-SAFE END -->

## Reference (for tests)

- `A++; while A {A++; while B {A--; B--; C++;} while C {B++; C--; while B {B--; D++; D++; D++;} while D {D--; B++;}} C++;}`

- `enumerate.js` lines count: **261**

### BBCS(10) default

- Total: 3336
- Halted: 2319
- Nonhalted: 1017
- Holdout: 0

### BBCS(11) default

- Duration: 26s

## Enumeration

- [x] Enumerate BBCS(11)
- [x] Fix and improve root loops ending equivalence
- [x] Avoid multiple `while #` in a row
- [x] Add *ordered counters and while loops* pruning rule back
- [x] Prune short loop tails
- [x] Maximum counters count pruning
- [x] Partial BBCS(12) enumeration
- [x] Fix `isLoopNonhalting.js` bugs
- [x] Fix `enumerate.js` bugs
- [ ] General equation solving system (merge `isLoopNonhalting.js`, `hasRowWhileVars.js` and `areVarsOrdered.js`) (decide `A++; A++; while A {while A {A--; B++;} while B {A++; A++; B--;} A--;}`)
  - [ ] `true` and `is equal to 0`
  - [ ] `is equal to #`

### Optimize

- [x] Remove `enumerator.js` strict loop length
- [x] Break down `enumerate.js` functions
- [x] Base enumerator without nested generators
- [x] TNF enumerator without nested generators
- [ ] Memoize while loops halting
- Each loop may have a `analysis` property with `type: <bool>`

### Test & Documentation

- [x] Enumerate comparator in `tester.js`
- [x] Update `README.md` techniques list
- [x] Improve `execute.js` readability
- [x] Library module for counter methods
- [x] Remove executes redundancy (remove generators and add next step function)
- [x] Parsable area enum config
- [x] Generalized scan programs function
- [x] Revamp parser (with engine methods)
- [x] Option to hide programs status in enumeration output
- [x] Add a sections table
- [x] Split `README.js` into a docs folder
- [x] Improve glossary
- [x] Module for `nextState`
- [x] Maximum execution steps config in `main.js`
- [x] Document to explain TNF
- [x] Comment `Prune` methods
- [x] Split `getProgData.js`
- [x] Revamp `tester.js`
- [x] Explain how stacks work in TNF document
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
- [x] Module line numbers
- [x] Module programs execution
- [x] Module render counters
- [ ] Add macros parser
- [ ] Undo step
  - [ ] Memory object
- [ ] Auto programs coloring
- [ ] Color selected line

### W/Ideas

- Visualize running program
- Search and replace
- Accelerated simulation (auto multiply/transfer counters)
- Functional programming `function A {...}` (compile to standard CS before running)
- Variable scopes
