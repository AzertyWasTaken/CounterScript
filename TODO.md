# TODO

<!-- AGENT-SAFE START -->
This file is a shared task-board. When editing, only:

- Add new items
- Update checkboxes/status lines
- Do NOT delete headings or existing bullet ideas
<!-- AGENT-SAFE END -->

## Reference (for tests)

Length 10:

- Total: 5492
- Halted: 4184
- Nonhalted: 1308
- Holdout: 0

## Enumeration

- [x] Enumerate BBCS(11)
- [x] Fix and improve root loops ending equivalence
- [x] Avoid multiple `while #` in a row
- [x] Add *ordered counters and while loops* pruning rule back
- [x] No loop tail pruning
- [x] Maximum counters count pruning
- [x] Partial BBCS(12) enumeration
- [ ] Use equations solving system (search forward)
  - [ ] Just-in-time equation creator
    - [ ] New key in stack objects
    - Define how counters change after loop iteration
    - Can be a single number, a set of numbers or an unknown value
    - [ ] Update in `genBasicInstr`, `genWhileLoop`, `runLoopBody`
    - Default at `x => x`
    - Can be `x => x`, `x => ?` or `x => 0`
  - [ ] Optimize `isLoopNonhalting`

### Optimize

- [x] Remove `enumerator.js` strict loop length
- [x] Break down `enumerate.js` functions
- [x] Base enumerator without nested generators
- [x] TNF enumerator without nested generators
- [ ] Optimize `hasRowWhileVars`
  - [ ] Create copy script
  - [ ] Vars are unknown at first
  - [ ] New parameter: zeroVars
  - [ ] Set var to 0 when adding while loop
- [ ] Optimize `areVarsOrdered`

### Test & Documentation

- [x] Enumerate comparator in `tester.js`
- [x] Update `README.md`
- [x] Improve `execute.js` readability
- [x] Library module for counter methods
- [x] Remove executes redundancy (remove generators and add next step function)
- [x] Parsable area enum config
- [x] Generalized scan programs function
- [x] Revamp parser (with engine methods)
- [ ] Refractor files and add folders
- [ ] More accessible configs
- [ ] Names dictionary in `README.md`

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
- [ ] Full speed execution TODO
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
