# TODO

<!-- AGENT-SAFE START -->
This file is a shared task-board. When editing, only:

- Add new items
- Update checkboxes/status lines
- Do NOT delete headings or existing bullet ideas
<!-- AGENT-SAFE END -->

## Reference (for tests)

Length 9 (bugged):

- Total: 42371
- Halted: 41948
- Nonhalted: 420
- Holdout: 0

## Enumeration

- [x] Enumerate BBCS(11)
- [ ] Avoid multiple `while #` in a row
  - [ ] Add new argument *banned whiles* in enumerate.js (must be a Set)
  - [ ] Function to remove argument if some while var appear
  - [ ] Actually prune programs
  - [ ] Write on `README.md`
- [ ] Add *ordered counters and while loops* pruning rule back
- [ ] Create champions leaderboard (to find other long halting programs)
- [ ] Decide more bouncers
  - `A++; while A {while A {A--; B++; B++; B++;} while B {A++; B--;} A--;}`
  - Can solve A => A*3-1
  - Use equations solving system
- [ ] Label loops to avoid recalculating

### Complete TNF enum

none => TNF => nestTNF => [fullTNF] => optTNF  

Length: 6

- Total: 9852
- New total: 9253
- New total 2: 5949
- With pruning: 2282

### E/Ideas

- Split enumeration into tasks
- Programs simplification decider
  - Use custom instructions like `A=+B` or `C=0`
  - Should decide most BBCS(11) nonhalting programs
- Decide multiperiod cyclers

## Website

### Show errors

### W/Ideas

- Add comments
- Show steps count
- Display compiled program
- Step by step execution

## Prompt for AI

- Improve this program to make it more readable. Use the latest JavaScript version. Avoid long variable names and short functions with many arguments. Do not hurt time performances. Do not use classes.
- Find potential bugs in `script.js` that change the output of `enumerate(11)`.
<!-- The local shell hit a sandbox setup failure before I could even read the files, so I’m retrying with elevated access just to inspect the project and make the fix cleanly. -->
