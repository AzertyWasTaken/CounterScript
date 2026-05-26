# TODO

<!-- AGENT-SAFE START -->
This file is a shared task-board. When editing, only:

- Add new items
- Update checkboxes/status lines
- Do NOT delete headings or existing bullet ideas
<!-- AGENT-SAFE END -->

## Reference (for tests)

Length 9:

- Total: 5640
- Halted: 5210
- Nonhalted: 430
- Holdout: 0

## Enumeration

- [x] Enumerate BBCS(11)
- [x] Optimise enumerator (remove strict loop length)
- [x] Enumerate comparator in `tester.js`
- [x] Break down `enumerate.js` functions
- [x] Fix and improve root loops ending equivalence
- [x] Avoid multiple `while #` in a row
- [x] Add *ordered counters and while loops* pruning rule back
- [x] Update `README.md`
- [ ] Remove nested generators from `enumerate.js` (use call stack)
- [ ] Label loops to avoid recalculating `isLoopNonhalting`
- [ ] `isLoopNonHalting` auto test
- [ ] Create champions leaderboard (to find other long halting programs)
- [ ] Decide more bouncers
  - `A++; while A {while A {A--; B++; B++; B++;} while B {A++; B--;} A--;}`
  - Can solve A => A*3-1
  - Use equations solving system

### E/Ideas

- Split enumeration into tasks
- Programs simplification decider
  - Use custom instructions like `A=+B` or `C=0`
  - Should decide most BBCS(11) nonhalting programs
- Decide multiperiod cyclers

## Repo & Website

- [x] Update `README.js` techniques list
- [x] Show error messages
- [x] Add comments
- [x] Text editor line numbers
- [x] Display compiled program
- [ ] Auto programs coloring
- [ ] Color selected line

### W/Ideas

- Show steps count
- Display compiled program
- Step by step execution

## Prompt for AI

- Improve this program to make it more readable. Use the latest JavaScript version. Avoid long variable names and short functions with many arguments. Do not hurt time performances. Do not use classes.
- Find potential bugs in `script.js` that change the output of `enumerate(11)`.
- Find why `D:\VSC\BusyBeaver\enumerate.js` do not enumerate `A++; A++; B++; while B {while A {while B {A--; B--;}}}`
<!-- The local shell hit a sandbox setup failure before I could even read the files, so I’m retrying with elevated access just to inspect the project and make the fix cleanly. -->
