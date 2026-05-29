# TODO

<!-- AGENT-SAFE START -->
This file is a shared task-board. When editing, only:

- Add new items
- Update checkboxes/status lines
- Do NOT delete headings or existing bullet ideas
<!-- AGENT-SAFE END -->

## Reference (for tests)

Length 9:

- Total: 6977

## Enumeration

- [x] Enumerate BBCS(11)
- [x] Fix and improve root loops ending equivalence
- [x] Avoid multiple `while #` in a row
- [x] Add *ordered counters and while loops* pruning rule back
- [ ] Create champions leaderboard (to find other long halting programs)
- [ ] Decide more bouncers
- `A++; while A {while A {A--; B++; B++; B++;} while B {A++; B--;} A--;}`
- Can solve A => A*3-1
- Use equations solving system

### Optimize

- [x] Remove `enumerator.js` strict loop length
- [x] Break down `enumerate.js` functions
- [ ] Optimize loops row reduction (Just-in-time computation) TODO
- [ ] Remove nested generators from `enumerate.js` (use call stack)

### Test & Documentation

- [x] Enumerate comparator in `tester.js`
- [x] Update `README.md`
- [x] Improve `execute.js` readability
- [ ] `isLoopNonHalting` auto test

### E/Ideas

- Split enumeration into tasks
- Programs simplification decider
  - Use custom instructions like `A=+B` or `C=0`
  - Should decide most BBCS(11) nonhalting programs
- Decide multiperiod cyclers
- Optimize `isLoopNonhalting` (Just-in-time computation)

## Repo & Website

- [x] Update `README.js` techniques list
- [x] Show error messages
- [x] Add comments
- [x] Text editor line numbers
- [x] Display compiled program
- [ ] Auto programs coloring
- [ ] Color selected line
- [x] Run step by step
- [x] Option to change run speed (slider)
- [x] Run/Pause button
- [x] Step button
- [x] Show steps count

### W/Ideas

- [ ] Visualize running program

## Prompt for AI

- Improve this program to make it more readable. Use the latest JavaScript version. Avoid long variable names and short functions with many arguments. Do not hurt time performances. Do not use classes.
- Find potential bugs in `script.js` that change the output of `enumerate(11)`.
- Find why `D:\VSC\BusyBeaver\enumerate.js` do not enumerate `A++; A++; B++; while B {while A {while B {A--; B--;}}}`
<!-- The local shell hit a sandbox setup failure before I could even read the files, so I’m retrying with elevated access just to inspect the project and make the fix cleanly. -->
- Make this project easier to understand and update by both humans and AI agents.
- Resume and complete the task.
