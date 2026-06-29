# BBCS Results & Open Problems

This section summarizes the **Busy Beaver** results for **CounterScript** (BBCS).

## What is BBCS?

**BBCS(n)** is the largest score a CounterScript program of length **n** can have when it halts. Nonhalting programs are ignored.

- The **score** is the largest value of the counters.
- The **length** of a program is the total number of instructions in the program.

## Lower Bounds

For readability purposes, sequences containing `#++` repeated `n` times in a row are replaced by `#+=n`.

| BBCS(n) | Value | Champion |
| - | - | - |
| 1 | 1 | `A++;` |
| 2 | 2 | `A+=2;` |
| 3 | 3 | `A+=3;` |
| 4 | 4 | `A+=4;` |
| 5 | 5 | `A+=5;` |
| 6 | 6 | `A+=6;` |
| 7 | 7 | `A+=7;` |
| 8 | 9 | `A+=3; while A {A--; B+=3;}` |
| 9 | 12 | `A+=4; while A {A--; B+=3;}` |
| 10 | 16 | `A+=4; while A {A--; B+=4;}` |
| 11 | ≥ 20 | `A+=5; while A {A--; B+=4;}` |
| 12 | ≥ 25 | `A+=5; while A {A--; B+=5;}` |
| 13 | ≥ 30 | `A+=6; while A {A--; B+=5;}` |
| 14 | ≥ 36 | `A+=6; while A {A--; B+=6;}` |
| 15 | ≥ 42 | `A+=7; while A {A--; B+=6;}` |
| 16 | ≥ 49 | `A+=7; while A {A--; B+=7;}` |

## Analysis

### BBCS(1) to BBCS(7)

These champions are trivial. Every instructions increment the same counter.

### BBCS(8) to BBCS(16)

These champions perform a single multiplication (repeated additions) with 2 numbers.

## Holdouts

An **holdout** is an undecided program: we do not yet know if it halts or not.

| BBCS(n) | Holdouts |
| - | - |
| 11 | 35 |
| 12 | 477 |
| 13 | > 535 |

For the detailed list, see the repo’s holdout artifacts (tracked in the `Holdouts/` directory).

## Difficulty Notes

A qualitative guide for why some BBCS(n) are harder to resolve.

> **Note**: `BB(n)` refers to the original Busy Beaver function for Turing machines.

| BBCS(n) | Analysis |
| - | - |
| 1 | Every programs halt in a single step. |
| 2 | Has nonhalting empty loops. |
| 3 | Has translated cyclers — infinitely increasing counters. |
| 4 | Has cyclers with `#--` and `#++` cancelling each other. |
| 5 | Has `while #` that have every `#--` inside unreachable loops. |
| 6 | *Not interesting* |
| 7 | Has nontrivial translated cyclers with preperiod. |
| 8 | Has nontrivial champions. Difficulty is comparable to BB(2). |
| 9 | Has bouncers — values that repeatedly bounce from 0 to an increasing value. |
| 10 | *Not interesting* |
| 11 | Has 2-period cyclers and more complex bouncers — subtracting after a multiplication, triangular sequence growing. |
| 12 | *To be explored* |
| 13 | *To be explored* |

## BBCS vs BB

Unlike Turing Machines, smaller CounterScript programs are much less chaotic, and holdouts size tends to reflect complexity more directly.  
CounterScript is also easier to accelerate and analyze.
