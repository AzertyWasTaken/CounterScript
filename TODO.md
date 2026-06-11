# TODO

<!-- AGENT-SAFE START -->
This file is a shared task-board. When editing, only:

- Add new items
- Update checkboxes/status lines
- Do NOT delete headings or existing bullet ideas
<!-- AGENT-SAFE END -->

## Reference (for tests)

Length 10:

- Total: 12003
- Halted: 5220
- Nonhalted: 6783
- Holdout: 0

## Enumeration

- [x] Enumerate BBCS(11)
- [x] Fix and improve root loops ending equivalence
- [x] Avoid multiple `while #` in a row
- [x] Add *ordered counters and while loops* pruning rule back
- [x] No loop tail pruning
- [x] Maximum counters count pruning
- [ ] Partial BBCS(12) enumeration
- [ ] Create champions leaderboard (to find other long halting programs)
- [ ] Use equations solving system (search forward)

### Optimize

- [x] Remove `enumerator.js` strict loop length
- [x] Break down `enumerate.js` functions
- [x] Base enumerator without nested generators
- [x] TNF enumerator without nested generators
  - [x] `nextInstr`
  - [x] `genInstructions`
  - [x] `genWhileLoops`
  - [x] `genLoopsBodies`
  - [x] Add pruning rules
  - [x] Review stack call execution
  - [x] Module script for pruning rules
  - [x] Implement to `main.js`
- [ ] Just-in-time computation
  - [x] Save old version
  - [ ] Just-in-time equation creator
    - [x] New key in stack objects
    - Define how counters change after loop iteration
    - Can be a single number, a set of numbers or an unknown value
    - [ ] Update in `genBasicInstr`, `genWhileLoop`, `runLoopBody`
    - Default at `x => x`
    - Can be `x => x`, `x => ?` or `x => 0`
  - [ ] Optimize `isLoopNonhalting`
  - [ ] Optimize `areVarsOrdered`
  - [ ] Optimize `hasRowWhileVars`

### Test & Documentation

- [x] Enumerate comparator in `tester.js`
- [x] Update `README.md`
- [x] Improve `execute.js` readability
- [x] Library module for counter methods
- [x] Remove executes redundancy (remove generators and add next step function)
- [ ] `isLoopNonHalting` auto test
- [ ] Refractor files and add folders
- [ ] Names dictionary in `README.md`

### E/Ideas

- Decide multiperiod cyclers
- `enumerate_TNFnonRecursiveGen`
- Prune short loop tails
- Limit counters count

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
- [ ] Full speed execution
- [ ] Auto programs coloring
- [ ] Color selected line
- [ ] Functional programming `function A {...}` (compile to standard CS before running)
- [ ] Variable scopes
- [ ] Accelerated simulation (auto multiply/transfer counters)

### W/Ideas

- Visualize running program
- Search and replace
