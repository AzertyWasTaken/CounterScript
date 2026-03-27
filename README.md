## Description

**CounterScript** is an esolang created in March 2026 by Azerty (me).  
It has an unbounded number of variables that can store any nonnegative integer.

Each program has 3 instructions:
- Increment *var* by 1
- If *var* is above 0 then decrement *var* by 1 end
- While *var* is above 0 do *function* end

Counters are set to 0 by default.  
The length of the program is the number of instructions it contains.

## Notation

| Instruction | Definition |
| - | - |
| A++; | Increment *A* |
| A--; | Decrement *A* |
| while A > 0 {} | Repeat while *var* is above 0 |

## Difficulty

### Hardest decidability

A list of the hardest programs of length *n* to decide.

- `A++;`
- `A++; while A > 0 {}`
- `A++; while A > 0 {A++;}`
- `A++; while A > 0 {A--; A++;}`
- `A++; while A > 0 {while B > 0 {A--; B--;}}`
- `A++; while A > 0 {B--; while B > 0 {A--; B--;}}`
- `A++; while A > 0 {while B > 0 {while A > 0 {A--; B++;} B--;}}`

### BBCS(n) vs BB(n,m)

| BBCS(n) | BB(n,m) | Explanation |
| - | - | - |
| BBCS(6) | BB(2,2) | Both have cyclers and translated cyclers with a nontrivial period. |

## How it works

### Scripts

| Name | Description |
| - | - |
| canHalt | Checks if some programs have nonhalting loops. |
| config | Configurations of the enumerator and results printing. |
| enumerate | Generates a list of possible length *n* programs. |
| execute | Interprets parsed CounterScript. |
| main | Runs other scripts and prints results. |
| print | Custom print function. |
| reachableLoops | Checks if all loops can be reached. |
| unparse | Converts the code into more a more readable string. |

### Enumeration

Generator functions are used to iterate through all possible length *n* programs.  
Recursion is used to split enumeration into multiple branches.

Each program are executed once.
Execution ends when the maximum steps count is reached to avoid getting stuck on nonhalting loops forever.  
The steps counter increments only when a while loop condition is checked.

## Holdouts reduction

### Enumeration

While *var* loops must always contain a dec *var* **not** followed by inc *var*.  
Ensures that *var* can reach 0, causing the loop to halt.  
Decides most trivial non halting program.

In every string that does **not** contain any while loop, instructions must be ordered by their var name with decrements before increments.  
If inc *var* follows dec *var*, they cancel each other.
Removes some programs equivalence.

New variables outside of a loop must start with an increment.
Prevents some wasted instructions.

Any *var* loop must not end with another *var* loop.
When a *var* loop ends, *var* equals 0, ending immediately the other *var* loop.
Prevents some wasted instructions.

Each *var* must have an increment *var*.
Prevents unreachable loops and unused instructions.
Prevents some wasted instructions.

### Execution

Programs must end with a while loop.
Incrementing or decrementing at the end do **not** change the halting status.
It removes wasted instructions.

## Holdouts

### BBCS(7)

```
A++; A++; B++; while A > 0 {while B > 0 {A--; B--;}}
A++; B++; B++; while B > 0 {while A > 0 {A--; B--;}}
A++; B++; while A > 0 {A++; while B > 0 {B--;} A--;}
A++; B++; while A > 0 {A++; while B > 0 {A--; B--;}}
A++; B++; while A > 0 {B--; while B > 0 {A--; B--;}}
A++; B++; while B > 0 {A--; while A > 0 {A--; B--;}}
A++; B++; while B > 0 {B++; while A > 0 {A--;} B--;}
A++; B++; while B > 0 {B++; while A > 0 {A--; B--;}}
A++; while A > 0 {A--; B++; while B > 0 {A++; B--;}}
A++; while A > 0 {A++; B++; while B > 0 {B--;} A--;}
A++; while A > 0 {A++; B++; while B > 0 {A--; B--;}}
A++; while A > 0 {A++; while B > 0 {B--;} A--; B++;}
A++; while A > 0 {A++; while B > 0 {A--; B--;} B++;}
A++; while A > 0 {B--; while B > 0 {A--; B--;} B++;}
A++; while A > 0 {B++; while B > 0 {A++; B--;} A--;}
A++; while A > 0 {while A > 0 {while B > 0 {A--; B--;}} B++;}
A++; while A > 0 {while B > 0 {B--; while A > 0 {A--; B++;}}}
A++; while A > 0 {while B > 0 {B++; while A > 0 {A--;} B--;}}
A++; while A > 0 {while B > 0 {B++; while A > 0 {A--; B--;}}}
A++; while A > 0 {while B > 0 {B++; while B > 0 {B--;} A--;}}
A++; while A > 0 {while B > 0 {while A > 0 {A--; B++;} B--;}}
```