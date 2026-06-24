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

- A CounterScript program operates on a finite but unbounded set of counters: `A`, `B`, `C`, ...
- All counters are initialized to 0.
- The set of all counters of a program is called its **state**.

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

In order to improve readability, we will write `#+=n` for n `#++` in a row.

The following values of BBCS(n) are **proven exact** up to **n = 10**, and **lower bounds** beyond:  

| BBCS(n) | Value | Champion | Notes
| - | - | - | -
| 1 | 1 | `A++;` | -
| 2 | 2 | `A+=2;` | -
| 3 | 3 | `A+=3;` | -
| 4 | 4 | `A+=4;` | -
| 5 | 5 | `A+=5;` | -
| 6 | 6 | `A+=6;` | -
| 7 | 7 | `A+=7;` | -
| 8 | 9 | `A+=3; while A {A--; B+=3;}` | Multiply 3 by 3
| 9 | 12 | `A+=4; while A {A--; B+=3;}` | -
| 10 | 16 | `A+=4; while A {A--; B+=4;}` | -
| 11 | 20 | `A+=5; while A {A--; B+=4;}` | -
| 12 | 25 | `A+=5; while A {A--; B+=5;}` | -
| 13 | 30 | `A+=6; while A {A--; B+=5;}` | -
| 14 | 36 | `A+=6; while A {A--; B+=6;}` | -
| 15 | 42 | `A+=7; while A {A--; B+=6;}` | -
| 16 | 49 | `A+=7; while A {A--; B+=7;}` | -

### Holdouts

An holdout is an undecided program — we do not know yet if it halts or not.

| BBCS(n) | Holdouts
| - | -
| 11 | 35
| 12 | 477
| 13 | > 535

Check `holdouts.md` to find the list of current holdouts for smaller values.

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
| 11 | Has 2-period cyclers and more complex bouncers — subtracting after a multiplication, triangular sequence growing.
| 12 | *To be explored*
| 13 | *To be explored*

### BBCS VS BB

Unlike Turing Machines, smaller CounterScript programs are much less chaotic and holdouts size reflects better their complexity.  
CounterScript is also easier to accelerate and analyze.  

## ⚙️ Project Structure

### Mental model (high level)

This repo implements a **Busy Beaver-style enumerator** for CounterScript.

- **Programs** are represented as an AST (array of instructions). Each instruction is one of:
  - `{type: "inc", var: <number>}`
  - `{type: "dec", var: <number>}`
  - `{type: "while", var: <number>, body: <instruction[]> | undefined}`
- **Variables** are “counters” initialized to `0`. Variables are identified by **numeric ids** (0, 1, 2, …) after parsing.
- **Enumeration** generates candidate programs and simulates them with the interpreter.
- **Execution** uses a stack of loop frames to support nested `while`.

### Module responsibilities

| Script | Description
| - | -
| `website.js` | Manage the UI of the CounterScript interpreter website.
| `tester.js` | Executes small test routines to validate interpreter/pruning behavior.
| `log.js` | Lightweight logging helpers for debugging (debug-friendly stringify).
| `main.js` | Entry point for the enumerator.
| `enumerate.js` | Enumerates CounterScript programs up to a given length, with pruning and partial simulation.
| `pruner.js` | Manage pruning rules application.
| `scanner.js` | Scan the program to detect unused counters.
| `counters.js` | Methods for counters (`vars`) objects.
| `execute.js` | Interpreter for CounterScript programs.
| `parser.js` | Parses CounterScript source into the AST and unparses the AST back to source-like text.
| `getProgData.js` | Derives structural properties from a program.
| `isLoopNonhalting.js` | Heuristic/non-formal check to prove that a `while` region is nonhalting.

## 🔬 Search & Optimization Techniques

The techniques below are used during enumeration to **reduce the search space** and to **early-reject** candidates that provably do not halt.

---

### Equivalence

Rules that identify **structurally different programs** (up to renaming/ordering/normal forms) that behave the same for the purpose of search.

#### Max counters id

Remove `A++; while A {B++;} D++;` to `A++; while A {B++;} C++;` equivalence.  
Every new counter id must be the smallest unused one.

#### Ordered counters id

Remove `A++; B++; A++;` to `A++; A++; B++;` equivalence.  
In every loopless sequence, instruction counters ids must be in ascending order.

Remove `A++; while A {A--; B++;} C++;` to `A++; B++; while A {A--; C++;}` equivalence.  
Every `#--` and `#++` must **not** succeed the last while loop if it has a `#` statement.

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

Remove `A++; A--; B++;` to `B++;` reduction.  
In every **loopless** sequence, `#--` must precede `#++`.

#### Vars usefulness

Remove `A++; while A {A++; while B {A--; B--;}}` to `A++; while A {A++;}` reduction.  
For each `#++`, the program must also contain a `while #`.

Exception: a halting program with a single counter `#` that has no `while #` can be allowed to improve its score.  
Example: `A++; A++; A++; while A {A--; B++; B++; B++;}`

#### Vars declaration

Remove `A++; B--; while A {A--; B++;}` to `A++; while A {A--; B++;}` reduction.  
New vars outside of loops must start with an increment (`#++`).

#### Loops usefulness

Remove `A++; while A {while A {A--; B++;}}` to `A++; while A {A--; B++;}` reduction.  
Any loop must not be on the form of `while # {while # {...}}`.

Remove `A++; while A {while B {A--; B++;}}` to `A++; while A {A--; while B {B++;}}` reduction.  
Any loop must not be on the form of `while # {while #_2 {...}}`.

Remove `A++; while A {A--: B++;} while A {A--; C++;}` to `A++; while A {A--: B++;}` reduction.  
Avoid multiple `while #` in a row if there are no `#++` between.

#### Loops repeating multiple times

Remove `A++; while A {A++; while A {A--; B++;} B++;}` to `A++; A++; while A {A--; B++;} B++;` reduction.  
Every root loops must repeat at least twice.

#### Cut root loop tail

Remove `A++; while A {A--; B++; B++;} B++;` to `A++; while A {A--; B++; B++;}` reduction.  
Every programs must not end with a tail of length < 4. (`while # {#--; #_2++; #_2++;}` doubles the value)

#### Maximum counters

Remove `A++; while A {A--; B++; B++; C--;}` to `A++; while A {A--; B++; B++;}` reduction.  
Completed programs of length `n` must have at most `floor((n + 1) / 3)` counters.

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

---

### Accelerated simulation

Rules used to **speed up** halting (or not) programs execution.

Not implemented yet.
