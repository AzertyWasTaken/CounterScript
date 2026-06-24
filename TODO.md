# TODO

<!-- AGENT-SAFE START -->
This file is a shared task-board. When editing, only:

- Add new items
- Update checkboxes/status lines
- Do NOT delete headings or existing bullet ideas
<!-- AGENT-SAFE END -->

## Reference (for tests)

`A++; while A {A++; while B {A--; B--; C++;} while C {B++; C--; while B {B--; D++; D++; D++;} while D {D--; B++;}} C++;}`

### BBCS(10) default

- Total: 3472
- Halted: 2164
- Nonhalted: 1308
- Holdout: 0
- Duration: 1.5s

## Enumeration

- [x] Enumerate BBCS(11)
- [x] Fix and improve root loops ending equivalence
- [x] Avoid multiple `while #` in a row
- [x] Add *ordered counters and while loops* pruning rule back
- [x] No loop tail pruning
- [x] Maximum counters count pruning
- [x] Partial BBCS(12) enumeration
- [ ] Equation solving system (search backward)
  - [ ] Split into `isLoopNonhalting` and `getEquation`
  - [ ] Vars transform array

<!--
- [ ] Use equations solving system (search forward)
  - [ ] Just-in-time equation creator
    - [ ] New key in stack objects
    - Define how counters change after loop iteration
    - Can be a single number, a set of numbers or an unknown value
    - [ ] Update in `genBasicInstr`, `genWhileLoop`, `runLoopBody`
    - Default at `x => x`
    - Can be `x => x`, `x => ?` or `x => 0`
  - [ ] Optimize `isLoopNonhalting`
- [ ] Equation enumerator (unknown or 0)
  - [ ] Check stack bug
  - [ ] Add equal value
  - [ ] Default parameter (unknown and equal)
  - [ ] Disable for outside loops
-->

### Optimize

- [x] Remove `enumerator.js` strict loop length
- [x] Break down `enumerate.js` functions
- [x] Base enumerator without nested generators
- [x] TNF enumerator without nested generators
<!--
- [ ] New equation param: no change
- [ ] Default value for each counter `equation`
- [ ] Optimize `areVarsOrdered`
-->

### Test & Documentation

- [x] Enumerate comparator in `tester.js`
- [x] Update `README.md`
- [x] Improve `execute.js` readability
- [x] Library module for counter methods
- [x] Remove executes redundancy (remove generators and add next step function)
- [x] Parsable area enum config
- [x] Generalized scan programs function
- [x] Revamp parser (with engine methods)
- [x] Option to hide programs status in enumeration output
<!--
- [ ] More accessible configs
- [ ] Names dictionary in `README.md`
-->

### E/Ideas

- Separate enum loop and add single instruction
- Decide multiperiod cyclers
- `enumerate_TNFnonRecursiveGen`
- Prune short loop tails
- Limit counters count
- `isInLoop` argument for pruning functions
- `isLoopNonHalting` auto test
- Early detect programs with useless counters
- Remove equivalence `A++; while A {while A {...} ... w/! A++}`
- Remove equivalence `while A {A--; B++;} while B {A++; A++; B--;}`
- head-body-tail equation storage trio
- Refractor files and add folders
- Documentation wiki

## Repo & Website

- [x] Update `README.js` techniques list
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
- [ ] Refractor scripts into modules
  - [ ] Line numbers
  - [ ] Programs execution
- [ ] Parse macros
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
