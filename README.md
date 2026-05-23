# About

![Status](https://img.shields.io/badge/Status-Active-informational)
![Research](https://img.shields.io/badge/Type-Busy_Beaver-informational)
![Language](https://img.shields.io/badge/Language-JavaScript-purple)
[![Discord](https://img.shields.io/badge/Discord-Join-5865F2)](https://discord.gg/H3FnyZwA6P)

## 🚀 Getting Started

This project studies the Busy Beaver function for CounterScript, a minimal computational model.  

The goals are multiple and include:  

- **Searching for champions** — programs that run for a very long time
- **Finding cryptids** — programs that are mathematically hard to decide
- **Proving the behavior of programs** — decide if a program either halt or not

## 🔢 CounterScript

CounterScript is a minimal model of computation created in March 2026 by Azerty.
It shares many similarities with Minsky's machines, Brainfuck and Fractran.
CounterScript is Turing-Complete (e.g. it can simulate a Turing machine).

### Counters

- CounterScript is a model of computation that uses a minimal instructions set.
- A CounterScript program operates on a finite but unbounded set of counters: A, B, C, ...
- All counters are initialized to 0.  

### Instructions

A CounterScript program is composed of 3 instruction types:

| Instruction | Description
| - | -
| `#++;` | Increment `#` by 1
| `#--;` | Decrement `#` by 1 if `#` > 0
| `while # {...}` | Execute body while `#` > 0

`#`, `#_2`, `#_3`, ... are used to represent any counter.

### Example

``` text
`A++; A++; while A {A--; B++; B++; B++;}`
```

- When the program starts, `A` = 0 and `B` = 0 because all counters are initialized to 0
- After `A++; A++;` executes, `A` = 2 and `B` = 0
- After the 1st loop iteration, `A` = 1 and `B` = 3
- After the 2nd loop iteration, `A` = 0 and `B` = 6
- The loop ends because `A` = 0
- The program ends with `A` = 0 and `B` = 6

## 📈 BBCS Results

The Busy Beaver function for CounterScript, denoted **BBCS(n)**, returns the largest value a counter can store after a CounterScript program of length *n* halts.  
The length of a program is the number of instructions it contains.  

### Lower Bounds

The following values of BBCS(n) are **proven exact** up to **n = 10**, and **lower bounds** beyond:  

| BBCS(n) | Value | Champion | Notes
| - | - | - | -
| 1 | 1 | `A++;` | -
| 2 | 2 | `A++; A++;` | -
| 3 | 3 | `A++; A++; A++;` | -
| 4 | 4 | `A++; A++; A++; A++;` | -
| 5 | 5 | `A++; A++; A++; A++; A++;` | -
| 6 | 6 | `A++; A++; A++; A++; A++; A++;` | -
| 7 | 7 | `A++; A++; A++; A++; A++; A++; A++;` | -
| 8 | 9 | `A++; A++; A++; while A {A--; B++; B++; B++;}` | Multiply 3 by 3
| 9 | 12 | `A++; A++; A++; A++; while A {A--; B++; B++; B++;}` | -
| 10 | 16 | `A++; A++; A++; A++; while A {A--; B++; B++; B++; B++;}` | -
| 11 | 20 | `A++; A++; A++; A++; A++; while A {A--; B++; B++; B++; B++;}` | -
| 12 | 25 | `A++; A++; A++; A++; A++; while A {A--; B++; B++; B++; B++; B++;}` | -
| 13 | 30 | `A++; A++; A++; A++; A++; A++; while A {A--; B++; B++; B++; B++; B++;}` | -
| 14 | 36 | `A++; A++; A++; A++; A++; A++; while A {A--; B++; B++; B++; B++; B++; B++;}` | -
| 15 | 42 | `A++; A++; A++; A++; A++; A++; A++; while A {A--; B++; B++; B++; B++; B++; B++;}` | -
| 16 | 49 | `A++; A++; A++; A++; A++; A++; A++; while A {A--; B++; B++; B++; B++; B++; B++; B++;}` | -

### Holdouts

An holdout is an undecided program — we do not know yet if it halts or not.

| BBCS(n) | Holdouts
| - | -
| 11 | 39

Check Holdouts.md to find the list of current holdouts for smaller values.

### Difficulty

**Note:** the function `BB(n)` refers to the original Busy Beaver function — with Turing machines.

| BBCS(n) | Analysis
| - | -
| 1 | Every programs halt in a single step.
| 2 | Has nonhalting empty loops.
| 3 | Has translated cyclers — infinitely increasing counters.
| 4 | Has cyclers with `#--` and `#++` cancelling each other.
| 5 | Has `while #` but the only `#--` is inside an unreachable loop.
| 6 | -
| 7 | Has nontrivial translated cyclers with preperiod.
| 8 | Has nontrivial champions. Difficulty is comparable to `BB(2)`.
| 9 | Has bouncers — values that repeatedly bounce from 0 to an increasing value.
| 10 | -
| 11 | Has more complex bouncers (e.g. an-b or triangular-like) and 2-period cyclers.

### BBCS VS BB

Unlike Turing Machines, smaller CounterScript programs are much less chaotic and holdouts size reflects better their complexity.  
CounterScript is also easier to accelerate and analyze.  

## ⚙️ Project Structure

| Script | Description
| - | -
| website.js | Manage the UI of the CounterScript interpreter website.
| tester.js | Tests new function to check if they work like intended.
| log.js | Modified version of console.log function.
| main.js | The script that should be run to search programs.
| enumerate.js | Enumerate CounterScript programs up to length `n`.
| execute.js | Execute CounterScript programs.
| parse.js | Converts CounterScript code to a string or a plain object.
| getProgData.js | Collects data from programs, like the set of used vars.
| isLoopNonhalting.js | Decide some nonhalting loops by checking their structure.

## 🔬 Search & Optimization Techniques

The techniques below are used during enumeration to **reduce the search space** and to **early-reject** candidates that provably do not halt.

---

### Equivalence

Rules that identify **structurally different programs** (up to renaming/ordering/normal forms) that behave the same for the purpose of search.

#### Max counters id

Remove `A++; while A {B++;} D++;` to `A++; while A {B++;} C++;` equivalence.  
Each new counters id must be the smallest used one.

#### Ordered counters id

Remove `A++; B++; A++;` to `A++; A++; B++;` equivalence.  
In every loopless sequence, instruction counters ids must be in ascending order.

<!-- Remove `A++; while A {A--; B++;} C++;` to `A++; B++; while A {A--; C++;}` equivalence.  
Every `#--` and `#++` must **not** succeed a while loop if it has `#`. -->

#### Tree Normal Form

Remove `A++; while A {A++;} A--;` to `A++; while A {A++;}` equivalence.  
During enumeration, run the generated program and **stop generating further** if the program does **not** halt.

Remove `A++; while A {while B {A++; B--;} A++;}` to `A++; while A {while B {} A++;}` equivalence.  
Wait for a loop to run to generate its body.

#### Ordered vars value

Remove `A++; B++; while B {A++; B--;}` to `A++; B++; while A {A--; B++;}` equivalence.  
When adding a `#` instruction outside of a loop, its value must **not** be equal to the value of the previous counter.

---

### Reduction

Rules that **rewrite** programs into a smaller / more canonical form (while preserving the equivalence class for search).

#### Ordered instructions

Remove `A++; A--; B++;` to `B++;` equivalence.  
In every loopless sequence, `#--` must precede `#++`.

#### Vars usefulness

Remove `A++; while A {A++; while B {A--; B--;}}` to `A++; while A {A++;}` equivalence.  
For each counter `#`, the program must also contain:

- A `#++` outside of any `while #`
- A `while #` inside or preceding its root loop

Exception: a halting program with a single counter `#` and no `while #` can be allowed to improve its score.  
Example: `A++; A++; A++; while A {A--; B++; B++; B++;}`  

#### Vars declaration

Remove `A++; B--; while A {A--; B++;}` to `A++; while A {A--; B++;}` equivalence.  
New vars outside of loops must start with an increment (`#++`).  

#### Loops usefulness

Remove `A++; while A {while A {A--; B++;}}` to `A++; while A {A--; B++;}` equivalence.  
Any loop must not be on the form of `while # {while # {...}}`.  

#### Loops repeating multiple times

Remove `A++; while A {A++; while A {A--; B++;} B++;}` to `A++; A++; while A {A--; B++;} B++;` equivalence.  
Every root loops must repeat at least twice.  

---

### Decider

A **decider** is a rule that proves a program **does not halt**.

#### Loops structure

Decide `A++; while A {}` as nonhalting.  
Each loop must be nonempty.

Decide `A++; while A {B++;}` as nonhalting.  
Each `while #` must have a `#--`.

Decide `A++; while A {A--; A++;}` as nonhalting.  
Inside each `while #`, every occurrence of `#--` must be followed by `#++` before the loop ends.

Decide `A++; while A {A++; while A {A--; B++;} while B {A++; B--;}}` as nonhalting.  
For each `while #_2` within `while #`: if `#` is greater than 0 when `while #_2` ends, then require that `#_2` is also greater than 0.

#### Cyclers

Decide `A++; while A {while A {A--; B++;} while B {A++; B--;}}` as nonhalting.  
Decide programs as nonhalting if every counter keeps the same value at the next loop iteration.

Decide `A++; while A {A++; A++; B++; while B {A--; B--;}}` as nonhalting.  
If a counter did not reach 0 but is not less than its previous value, it counts like a cycler.

<!-- #### Unreachable loops

Decide `A++; B++; while A {A++; while B {A--; B--;}}` as nonhalting.  
Filter out parts of a loop body that became unreachable, then apply the *Halting loops* decider again. -->

---

### Accelerated Simulation

Rules used to **speed up** halting (or not) programs execution.

Not implemented yet.
