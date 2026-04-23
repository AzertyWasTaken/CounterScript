# BBCS enumerator & decider

![Status](https://img.shields.io/badge/status-research-blue)
[![Maintenance](https://img.shields.io/badge/maintained%3F-yes-green.svg)](https://GitHub.com/Naereen/StrapDown.js/graphs/commit-activity)
[![GitHub license](https://badgen.net/github/license/Naereen/Strapdown.js)](https://github.com/Naereen/StrapDown.js/blob/master/LICENSE)

## 🚀 Getting Started

This project studies the Busy Beaver function for CounterScript, a minimal computational model.  

The goals are multiple and includes:  

- **Searching for champions** — programs that run for a very long time
- **Finding cryptids** — programs that are mathematically hard to decide
- **Proving the behavior of programs** — decide if a program either halt or not

## 🧠 CounterScript

CounterScript is a model of computation created in March 2026 by Azerty.  
It uses a minimal instruction set designed around incrementing, conditional decrementing, and looping.  
The language has an unlimited number of variables (called counters), each storing a nonnegative integer.  
All counters are initialized to 0.  

### Example

This program sets B to 6 by multiplying 2 by 3.  

`A++; A++; while A {A--; B++; B++; B++;}`  

### Instructions

A CounterScript program is composed of 3 instruction types:

| Instruction | Description
| - | -
| `A++;` | Increment A by 1
| `A--;` | If A is greater than 0, decrement A by 1
| `while A {...}` | Repeat while A is greater than 0

## 📈 BBCS results

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
| 10 | 5

Check Holdouts.md to find the list of current holdouts for smaller values.  

### Difficulty

| BBCS(n) | Analysis
| - | -
| 1 | Every programs halt in a single step.
| 2 | Has nonhalting empty loops.
| 3 | Has nonempty but nondecreasing loops.
| 4 | Has `while #` with `#--` and `#++` that cancel each other.
| 5 | Has `while #` with the `#--` inside an unreachable loop.
| 6 | Similar to the previous value but with translated cyclers.
| 7 | Requires filtering unreachable loops after the program started.
| 8 | Has translated cyclers with loops executing equivalence and nontrivial champions. Difficulty is comparable to **BB(2)**.
| 9 | Has bouncers — values that repeatedly bounce from 0 to an increasing value.
| 10 | Similar to the previous value but with translated cyclers.

### BBCS vs BB

Unlike Turing Machines, smaller CounterScript programs are much less chaotic and holdouts size reflects better their complexity.  
CounterScript is also easier to accelerate and analyze.  

## ⚙️ Project structure

| Script | Description
| - | -
| website.js | Manage the UI of the CounterScript interpreter website.
| tester.js | Tests new function to check if they work like intended.
| log.js | Modified version of console.log function.
| main.js | The script that should be run to search programs.
| enumerate.js | Enumerate CounterScript programs up to length *n*.
| execute.js | Execute CounterScript programs.
| parse.js | Converts CounterScript code to a string or a plain object.
| getProgData.js | Collects data from programs, like the set of used vars.

## 🔬 Search & Optimization Techniques

A list of techniques currently applied to reduce the search space and decide programs.  

### Equivalence

#### Max vars id

Remove `A++; while A {B++;} D++;` to `A++; while A {B++;} C++;` equivalence.  
Each new var id must be the smallest used one.  

#### Ordered vars id

Remove `A++; B++; A++;` to `A++; A++; B++;` equivalence.  
In every loopless sequences, instr vars id must be in ascending order.  

Remove `A++; while A {A--; B++;} C++;` to `A++; B++; while A {A--; C++;}` equivalence.  
Every `#--` and `#++` must **not** succeed a while loop if `#` appears in its body.  

#### Tree Normal Form

Remove `A++; while A {A++;} A--;` to `A++; while A {A++;}` equivalence.  
Run each program during enumeration outside of loops and stop generating further if the program does **not** halt.  

#### Ordered vars value

Remove `A++; B++; while B {A++; B--;}` to `A++; B++; while A {A--; B++;}` equivalence.  
Before adding a `#` instruction outside of a loop, its value must **not** be equal to the value of the previous `#` id.  

### Reduction

#### Ordered instructions

Remove `A++; A--; B++;` to `B++;` equivalence.  
In every loopless sequences, `#--` must precede `#++`.  

#### Vars usefulness

Remove `A++; while A {A++; while B {A--; B--;}}` to `A++; while A {A++;}` equivalence.  
For each `#`, the program must also contain an `#++` outside of a `while #` and an `while #` inside or preceding its root loop.  
An exception can be made for halting programs with a single `#` without any `while #` to improve their score.  
Example: `A++; A++; A++; while A {A--; B++; B++; B++;}`  

#### Vars declaration

Remove `A++; B--; while A {A--; B++;}`to `A++; while A {A--; B++;}` equivalence.  
New vars outside of loops must start with an inc.  

#### Loops usefulness

Remove `A++; while A {A++; while A {A--; B++;} B++;}` to `A++; while A {A++; B++;}` equivalence.  
Every `while #` inside a `while #` must precede an `#++` inside a *var'* loop.  

Remove `A++; while A {A++; while B {while A {A--; B++;}} B++;}` to `A++; while A {A++; B++;}` equivalence.  
Every "useless for `#`" loops inside a `while #` must precede an `#++` inside a *var'* loop.  

### Decider

A decider is a rule that proves a program does not halt.  

#### Loops structure

Decide `A++; while A {}` as nonhalter.  
Each loops must be nonempty.  

Decide `A++; while A {B++;}` as nonhalter.  
Each `while #` must have a `#--`.  

Decide `A++; while A {A--; A++;}` as nonhalter.  
A `while #` contains a canceling decrement if every occurrence of `#--` is followed by `#++` before the loop end.  

Decide `A++; while A {A++; while A {A--; B++;} while B {A++; B--;}}` as nonhalter.  
~~Each `while #` must not be preceded by `#++` if it ends with a loop that always increases `#`.~~  
Find cycles of self transferring counters.  

#### Cyclers

Decide `A++; while A {while A {A--; B++;} while B {A++; B--;}}` as nonhalter.  
Decide programs as nonhalting if every counters keep the same value the next loop iteration.  

Decide `A++; while A {A++; A++; B++; while B {A--; B--;}}` as nonhalter.  
When comparing counters at end of a `while #` iteration, ignore every `#_2` that do not have a `while #_2` but check if `#` does not decrease.

#### Unreachable loops

Decide `A++; B++; while A {A++; while B {A--; B--;}}` as nonhalter.  
Filter out parts of a loop body that became unreachable then apply *Halting loops* decider again.  

### Simulation

N/A  

<!-- ## 🤝 Contributing

If you are interested, you can join my Discord server: <https://discord.gg/H3FnyZwA6P>   -->
