# TODO

## Current baseline

BBCS(12) — `A+ wA{ B+ wB{`

- Total: 2665 (3130)
- Halted: 200 (200)
- Nonhalted: 2445 (2910)
- Holdout: 20 (20)
- Highscore: 5

## Update logs

### L/Enumeration

- [x] Loop structure analyzer
- [x] Create `loopAnalyzer.js`
- [x] Decide 2-period cyclers
- [x] Fix nested loops decider
- [x] Just-in-time while-loops states
- [x] Update analysis when a child undefined loop gets a body
- [x] Fix pruning bug
- [x] Earlier pruning for invalid loops

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
- [x] Refractor analyzer operations

### L/Website

- [x] Show error messages
- [x] Add comments
- [x] Text editor line numbers
- [x] Display compiled programs
- [x] Run step by step
- [x] Fix empty loops crash bug

## Enumeration

- [ ] Enumerate BBCS(12) again

### Keep intermediate layers

- [ ] New stack parameter to mark intermediate frames: `isDone`
- [ ] Keep intermediate enumeration stack layers when generating into undefined loops.

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
- Undo state for better time performances

### I/Website

- Presets programs
- Visualize running program
- Search and replace
- Accelerated simulation (auto multiply/transfer counters)
- Functional programming `function A {...}` (compile to standard CS before running)
- Variable scopes
