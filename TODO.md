# TODO

<!-- AGENT-SAFE START -->
This file is a shared task-board. When editing, only:

- Add new items
- Update checkboxes/status lines
- Do NOT delete headings or existing bullet ideas
<!-- AGENT-SAFE END -->

## Reference (for tests)

- `A++; while A {A++; while B {A--; B--; C++;} while C {B++; C--; while B {B--; D++; D++; D++;} while D {D--; B++;}} C++;}`

### BBCS(12) `A+ wA{ B+ wB{`

- Total: 3130
- Halted: 200
- Nonhalted: 2910
- Holdout: 20
- Duration: 11.5s

## Enumeration

- [x] Prune short loop tails
- [x] Maximum counters count pruning
- [x] Enumerate BBCS(12)
- [x] Fix `isLoopNonhalting.js` and enumeration bugs
- [x] Loop structure analyzer
- [x] Filter out 2-period cyclers in BBCS(12)

### Loop analyzer

- [x] Switch to objects
- [x] Create `is equal to n` type
- [x] Create `is at least n` type
- [x] Add `isEqualToSelfAndIsPositive`
- [x] Add `inc` and `dec` keys in `isEqualToSelf`
- [x] Replace `isEqualToSelfAndIsPositive` by a `isPositive` boolean key in `isEqualToSelf`
- [x] Decide 2-period cyclers
- [x] Fix nested loops decider
- [ ] Merge analyzer with `areVarsOrdered.js`
  - [ ] Loop history and allowed vars list
- [ ] Nonhalting function that depend of starting counters
- [ ] Ignore `while # {#--;}` if `#` is proven to be 2 or less

### E/Ideas

- `isInLoop` argument for pruning functions
- `isLoopNonHalting` auto test
- Early detect programs with useless counters (each must have inc, dec and while loop)
- Remove equivalence `A++; while A {while A {...} ... w/out A++}`
- Remove equivalence `while A {A--; B++;} while B {A++; A++; B--;}`
- Partial area enumeration (split while-loop and other instr)
- Just-in-time `areVarsOrdered`
- Just-in-time `hasRowWhileVars`
- Enumerate comparator in `tester.js`
- Decide multi-period cyclers

## Optimize

- [x] Remove `enumerator.js` strict loop length
- [x] Break down `enumerate.js` functions
- [x] Base enumerator without nested generators
- [x] TNF enumerator without nested generators

### Just-in-time while-loops states

- [ ] New eq state param to stack
- [ ] Update stack during enumeration
- [ ] Filter out unused intructions
- [ ] Check loop nonhalting at end
- [ ] Disable when/after empty loop is filled
- [ ] Methods for enum stack

## Tests

- [x] Parsable area enum config
- [x] Option to hide programs status in enumeration output
- [x] Split `getProgData.js`
- [x] Revamp `tester.js`
- [x] Group configs in the same file
- [x] Refractor files and add folders
- [x] Array bulk test
- [x] Function to reuse call stack appends from `execute.js`
- [x] New script for managing enumeration stack
- [x] Function to append instructions
- [ ] Rename functions, variables and scripts
- [ ] Undefined loops parser `while # undefined`

## Documentation

- [x] Split `README.js` into a docs folder & add a sections table
- [x] Improve glossary
- [x] Document to explain TNF
- [x] Comment `Prune` methods
- [x] Explain how stacks work in TNF document
- [x] Comment `analyzeLoop.js`
- [x] Review `search-techniques.md` & add proofs
- [x] Add loop structure decider in `search-techniques.md`
- [ ] Include results for manually designed champions and cryptids

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
- [x] Fix empty loops crash bug
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
