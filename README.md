## Description

**CounterScript** is an esolang created by Azerty (me).  
It has an unbounded number of variables that can store any nonnegative integer.

Each program has 3 instructions:
- Increment \<var> by 1
- If \<var> is above 0 then decrement \<var> by 1 end
- While \<var> is above 0 do \<function> end

Counters are set to 0 by default.  
The length of the program is the number of instructions it contains.

## Execute

Programs execution must end when a certain amount of steps is reached in order to avoid getting stuck on nonhalting loops forever.  
The steps counter increments only when a while loop condition is checked.

## Tree Normal Form

**TODO**

Tree normal form enumeration is a process for enumerating programs while running them.  
If a loop times out, the program cannot be extended.

If an instruction is undefined, split the enumeration.
If a new loop can run, enumerate loop body then tail.
IF a new loop cannot run, enumerate tail first.

The enumeration is split into two functions:
- A function that run programs.
- A function that extends programs then split into multiples branches.

The tree normal form enumerator must be a function that can split after getting called recursively then resume without merging.

## Holdouts Reduction

*While loops must never be empty.  
Empty while loops either never run or never halt.  
This decreases programs count exponentially.*

**TODO**

While \<var> loops must always contain a dec \<var> instruction.  
This ensure that \<var> can reach 0, causing the loop to halt.  
This decreases programs and holdouts count exponentially.