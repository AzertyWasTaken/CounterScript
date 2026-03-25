## Description

**CounterScript** is an esolang created by Azerty (me).  
It has an unbounded number of variables that can store any nonnegative integer.

Each program has 3 instructions:
- Increment *var* by 1
- If *var* is above 0 then decrement *var* by 1 end
- While *var* is above 0 do *function* end

Counters are set to 0 by default.  
The length of the program is the number of instructions it contains.

## Hardest Programs

A list of the hardest programs of length *n* to decide.
- `A++`
- `A++; while A > 0 {}`
- `A++; while A > 0 {A++}`
- `A++; while A > 0 {A--; A++}`

## Enumeration

Generator functions are used to iterate through all possible length *n* programs.  
Recursion is used to split enumeration into multiple branches.

Each program are executed once.
Execution ends when the maximum steps count is reached to avoid getting stuck on nonhalting loops forever.  
The steps counter increments only when a while loop condition is checked.

## Holdouts Reduction

### Enumeration

While loops must never be empty.  
Empty while loops either never run or never halt.  
This decreases programs count exponentially.

### Execution

While \<var> loops must always contain a dec \<var> instruction.  
This ensure that \<var> can reach 0, causing the loop to halt.  
This decreases programs and holdouts count exponentially.