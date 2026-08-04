# TODO

## Current baseline

BBCS(12) `A+ wA{ B+ wB{`:

- Total: 2244 (3130)
- Halted: 137 (200)
- Nonhalted: 2087 (2910)
- Holdout: 20 (20)

## Update log

### L/Enumeration

- [x] Loop structure analyzer
- [x] Create `loopAnalyzer.js`
- [x] Decide 2-period cyclers
- [x] Fix nested loops decider
- [x] Just-in-time while-loops states

### L/Documentation

- [x] Include results for manually designed champions
- [x] Option to hide programs status in enumeration output
- [x] Revamp `tester.js` (array bulk test)
- [x] Move group configs in the same file
- [x] New script for managing enumeration stack
- [x] Function to append instructions `enumAction.js`
- [x] Extract properties methods from `analyzeLoop.js`
- [x] Area test mode analysis
- [x] Revamp `TODO.md`
- [x] Project overview `README.md`
- [x] Update general documentation
- [x] Create `AGENTS.md`
- [x] Replace difficulty table with a more complete analysis
- [x] "Is greater or equal to self" value `loopAnalyzer.js`

### L/Website

- [x] Show error messages
- [x] Add comments
- [x] Text editor line numbers
- [x] Display compiled programs
- [x] Run step by step
- [x] Fix empty loops crash bug

## Enumeration

- [ ] Enumerate BBCS(12) again
- [ ] Merge `enumActions.js` and `nextState.js` and undo state for better time performances

### Fix bug related to undefined loops and loopAnalyzer

File: `enumActions.js`

The bug is caused by loop state analysis merging skipping a level when a previously undefined loop is completed.

1. When an undefined loop is generated, keep the previous frame and label it as finished.
2. When the previously undefined loop generation ends, update intermediate frames with new analysis then check pruning.

### Just-in-time pruning `areVarsOrdered.js`

- [ ] Create `stack` param to store allowed counters list

### "Is equal to var" value `loopAnalyzer.js`

- [ ] Plan comment
- [ ] Update props functions

## Undefined loops parser

For `while # {undefined}`.

- [ ] Parser
- [ ] Unparser

## Testing

- [ ] Count pruned programs
- [ ] Count nextInstr calls

## Website

- [ ] Auto programs coloring
- [ ] Color selected line

### Add macros parser

Convert macros to a serie of standard instructions.

- [ ] `A+=n`
- [ ] `A>>B`

### Undo step option

- [ ] States history object

## Ideas

### I/Enumeration

- Early detect programs with useless counters (each must have inc, dec and while loop)
- Remove multiplication equivalence `while A {A--; B++;} while B {A++; A++; B--;}`
- Enumerate comparator in `tester.js`
- Decide multi-period cyclers
- Ignore `while # {#--;}` if `#` is proven to be 2 or less
- Nonhalting function that depend of starting counters

### I/Website

- Presets programs
- Visualize running program
- Search and replace
- Accelerated simulation (auto multiply/transfer counters)
- Functional programming `function A {...}` (compile to standard CS before running)
- Variable scopes
