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

- Total: 2872
- Halted: 2120
- Nonhalted: 752
- Holdout: 0
- Duration: 1.7s

### BBCS(11) default

- Total: 18542
- Halted: 12478
- Nonhalted: 6057
- Holdout: 7
- Duration: 26s

## Enumeration

- [x] Prune short loop tails
- [x] Maximum counters count pruning
- [x] Enumerate BBCS(12)
- [x] Fix `isLoopNonhalting.js` and enumeration bugs
- [x] Loop structure analyzer

### Loop analyzer

- [x] Switch to objects
- [x] Create `is equal to n` type
- [x] Create `is at least n` type
- [x] Add `isEqualToSelfAndIsPositive`
- [x] Add `inc` and `dec` keys in `isEqualToSelf`
- [ ] Replace `isEqualToSelfAndIsPositive` by a `isPositive` boolean key in `isEqualToSelf`
- [ ] Merge analyzer with `areVarsOrdered.js`
  - [ ] Loop history and allowed vars list

### Optimize

- [x] Remove `enumerator.js` strict loop length
- [x] Break down `enumerate.js` functions
- [x] Base enumerator without nested generators
- [x] TNF enumerator without nested generators
- [ ] Memoize while-loops states

### Memoize loops

- [ ] Program stack must store the parent loop
- [ ] Each loop may have a `analysis` property with `type: state`
- [ ] New function `isLoopValid` that check if a program is valid
- [ ] Memoized `filterLoop` function must take the whole loop
- [ ] Memoize only when the loop has no undefined values
- [ ] Restart loop analysis when a nested undefined loop body is generated

### Test & documentation

- [x] Parsable area enum config
- [x] Option to hide programs status in enumeration output
- [x] Split `README.js` into a docs folder & add a sections table
- [x] Improve glossary
- [x] Document to explain TNF
- [x] Comment `Prune` methods
- [x] Split `getProgData.js`
- [x] Revamp `tester.js`
- [x] Explain how stacks work in TNF document
- [x] Comment `analyzeLoop.js`
- [x] Group configs in the same file
- [ ] Array bulk test
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
- Enumerate comparator in `tester.js`
- Maximum execution steps config in `main.js`

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
