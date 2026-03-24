## Description

**CounterScript** is an esolang created by Azerty (me).  
It has an unbounded number of variables that can store any nonnegative integer.

Each program has 3 instructions:
- Increment *var* by 1
- If *var* is above 0 then decrement *var* by 1 end
- While *var* is above 0 do *function* end

Counters are set to 0 by default.  
The length of the program is the number of instructions it contains.

## Enumeration

Generator functions are used to iterate through all possible length *n* programs.  
Recursion is used to split enumeration into multiple branches.

Each program are executed once.
Execution ends when the maximum steps count is reached to avoid getting stuck on nonhalting loops forever.  
The steps counter increments only when a while loop condition is checked.

## Holdouts Reduction

While loops must never be empty.  
Empty while loops either never run or never halt.  
This decreases programs count exponentially.