# TODO

<!-- AGENT-SAFE START -->
This file is a shared task-board. When editing, only:

- Add new items
- Update checkboxes/status lines
- Do NOT delete headings or existing bullet ideas
<!-- AGENT-SAFE END -->

## Enumeration

- [ ] Enumerate BBCS(11)
- [ ] Create champions leaderboard (to find other long halting programs)
- [ ] Avoid multiple `while #` in a row
  - [ ] Add to `README.md`
- [ ] Add ordered counters and while loops pruning rule back

### Complete TNF enum

none => TNF => nestTNF => [fullTNF] => optTNF  

Length: 6

- Total: 9852
- New total: 9253
- New total 2: 5949
- With pruning: 2282

### E/Ideas

- Decide more bouncers
  - `A++; while A {while A {A--; B++; B++; B++;} while B {A++; B--;} A--;}`
  - Solve A => A*3-1
  - Use equations solving system
- Decide multiperiod cyclers
- Label loops to avoid recalculating

## Website

### Show errors

### W/Ideas

- Add comments
- Show steps count
- Display compiled program
- Step by step execution

## Prompt for AI

- Improve this program to make it more readable. Use the latest JavaScript version. Avoid long variable names and short functions with many arguments. Do not hurt time performances. Do not use classes.
- *The local shell hit a sandbox setup failure before I could even read the files, so I’m retrying with elevated access just to inspect the project and make the fix cleanly.*
