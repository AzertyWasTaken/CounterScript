## Description

**CounterScript** is an esolang created by Azerty (me).  
It has an unbounded number of variables that can store any nonnegative integer.

Each program has 3 instructions:
- Increment *var* by 1
- If *var* is above 0 then decrement *var* by 1 end
- While *var* is above 0 do *function* end

Counters are set to 0 by default.  
The length of the program is the number of instructions it contains.

## Hardest programs

A list of the hardest programs of length *n* to decide.
- `A++`
- `A++; while A > 0 {}`
- `A++; while A > 0 {A++}`
- `A++; while A > 0 {A--; A++}`
- `A++; while A > 0 {while B > 0 {A--; B--}}`

## Enumeration

Generator functions are used to iterate through all possible length *n* programs.  
Recursion is used to split enumeration into multiple branches.

Each program are executed once.
Execution ends when the maximum steps count is reached to avoid getting stuck on nonhalting loops forever.  
The steps counter increments only when a while loop condition is checked.

## Holdouts reduction

### Enumeration

While *var* loops must always contain a dec *var* instruction not followed by inc *var*.  
This ensure that *var* can reach 0, causing the loop to halt.  
This divides programs and holdouts count exponentially.

In every string that do not contain any while loop, instructions must be ordered by their var name with decrements before increments.  
If inc *var* follows dec *var*, they cancel each other.

New variables outside of a loop must start with an increment.

### Execution