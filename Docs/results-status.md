# BBCS results & open problems

This section summarizes the **Busy Beaver** results for **CounterScript** (BBCS).

## What is BBCS?

**BBCS(n)** is the largest score a CounterScript program of length **n** can have when it halts. Nonhalting programs are ignored.

- The **score** is the largest value of the counters.
- The **length** of a program is the total number of instructions in the program.

## Lower bounds

For readability purposes, some sequences use macros.

| Name | Macro | Definition | Size | Function |
| - | - | - | - | - |
| Constant addition | `A+=n` | Increment `A` by `n` | `n` | `repeat n {A++}` |
| Transfer value | `A>>B*n` | Increment `B` by `A*n` then set `A` to 0 | `n+2` | `while A {A--; repeat n {B++}}` |

### Champions

A list of lower bounds found by the script.

| *n* | BBCS(*n*) | Champion |
| - | - | - |
| 1 | 1 | `A++;` |
| 2 | 2 | `A+=2;` |
| 3 | 3 | `A+=3;` |
| 4 | 4 | `A+=4;` |
| 5 | 5 | `A+=5;` |
| 6 | 6 | `A+=6;` |
| 7 | 7 | `A+=7;` |
| 8 | 9 | `A+=3; A>>B*3;` |
| 9 | 12 | `A+=4; A>>B*3;` |
| 10 | 16 | `A+=4; A>>B*4;` |
| 11 | ≥ 20 | `A+=5; A>>B*4;` |
| 12 | ≥ 25 | `A+=5; A>>B*5;` |
| 13 | ≥ 30 | `A+=6; A>>B*5;` |
| 14 | ≥ 36 | `A+=6; A>>B*6;` |
| 15 | ≥ 42 | `A+=7; A>>B*6;` |
| 16 | ≥ 49 | `A+=7; A>>B*7;` |

### Designed champions

A list of stronger lower bounds using designed programs. These supersede the script-found champions for the same *n* where they overlap.

| *n* | BBCS(*n*) | Champion |
| - | - | - |
| 13 | ≥ 42 | `A++; while A {A++; while B {A--; B--; C+=2;} C>>B*2; C++;}` |
| 14 | ≥ 129 | `A++; while A {A++; while B {A--; B--; C+=2;} C>>B*3; C++;}` |
| 15 | ≥ 340 | `A+=4; while A {A--; B++; B>>C*2; C>>B*2;}` |
| 16 | ≥ 1,554 | `A+=4; while A {A--; B++; B>>C*3; C>>B*2;}` |
| 17 | ≥ 9,330 | `A+=5; while A {A--; B++; B>>C*3; C>>B*2;}` |
| 18 | ≥ 66,429 | `A+=5; while A {A--; B++; B>>C*3; C>>B*3;}` |
| 19 | ≥ 8.08e57 | `A++; while A {A++; while B {A--; B--; C++;} while C {B++; C--; B>>D*3; D>>B;} C++;}` |
| 20 | ≥ 2e19,728 | `A+=4; while A {A--; B++; while B {B--; C++; C>>D*2; D>>C;} C>>B;}` |
| 21 | ≥ e6e19,727 | `A+=5; while A {A--; B++; while B {B--; C++; C>>D*2; D>>C;} C>>B;}` |
| 22 | ≥ ee6e19,727 | `A+=6; while A {A--; B++; while B {B--; C++; C>>D*2; D>>C;} C>>B;}` |
| 23 | ≥ eee6e19,727 | `A+=7; while A {A--; B++; while B {B--; C++; C>>D*2; D>>C;} C>>B;}` |
| 24 | ≥ t65,533 | `A++; while A {A++; while B {A--; B--; C++;} while C {B++; C--; while B {B--; D++; D>>E*2; E>>D;} D>>B;} C++;}` |
| 25 | ≥ te6e19,727 | `A++; while A {A++; while B {A--; B--; C+=2;} while C {B++; C--; while B {B--; D++; D>>E*2; E>>D;} D>>B;} C++;}` |
| 26 | ≥ tt65,533 | `A+=4; while A {A--; B++; while B {B--; C++; while C {C--; D++; D>>E*2; E>>D;} D>>C;} C>>B;}` |

## Analysis

**BBCS(1) to BBCS(7)**:

These champions are trivial. Every instruction increments the same counter by 1.

**BBCS(8) to BBCS(16)**:

These champions perform a single multiplication (repeated additions) with 2 numbers.

## Holdouts

A **holdout** is an undecided program: we do not yet know if it halts or not.

| *n* | Holdouts |
| - | - |
| 11 | 1 |
| 12 | ~~134~~ |
| 13 | ~~≥ 300~~ |

> **Note**: Struck-through values indicate revised (lower) counts from previous estimates. The `BBCS(12)` and `BBCS(13)` holdouts list might have missing holdouts.

For the detailed list, see the repo's holdout artifacts (tracked in the `Holdouts/` directory).

## Difficulty notes

A qualitative guide for why some BBCS(n) are harder to resolve. Like with champions, we will use macros.

> **Note**: `BB(n)` refers to the original Busy Beaver function for Turing machines.

**BBCS(1)**:

Every program halts in a single step.

- `A++;`
- `A--;`
- `while A {}`

**BBCS(2)**:

Nonhalting empty loops.

```js
A++; while A {}
```

**BBCS(3)**:

**Translated cyclers** — infinitely increasing counters.

```js
A++; while A {A++;}
```

**BBCS(4)**:

Self-cancelling cyclers.

```js
A++; while A {A--; A++;}
```

**BBCS(5)**:

Decrements inside unreachable loops.

```js
A++; while A {while B {A--; B--;}}
```

**BBCS(7)**:

Cycler with a preperiod.

```js
A++; A++; B++; while A {while B {A--; B--;}}
```

**BBCS(8)**:

Nontrivial champions.

Difficulty is comparable to **BB(2)**.

**BBCS(9)**:

**Bouncers** — values that repeatedly bounce from 0 to an increasing value.

```js
A++; while A {A>>B*2; B>>A}

// start -> F(1)
// F(a) -> F(2a)
// F(0) -> halt
```

**BBCS(11)**:

2-period cyclers.

```js
A++; while A {B+=3; while A {A--; B--;} B>>A;}

// start -> F(1)
// F(a) -> F(3-a)
// F(0) -> halt
```

More complex bouncers — subtracting after a multiplication.

```js
A+=2; while A {A>>B*2; B>>A; A--;}

// start -> F(2)
// F(a) -> F(2a-1)
// F(0) -> halt
```

Bouncers but the bouncing counter is not the same as the loop counter.

```js
A++; while A {
  B++;
  while B {A++; B--; C++;}
  while C {A--; B++; C--;}
}
```

**BBCS(23)**:

Hydra-like **cryptid** that requires solving a collatz-like problem.

```js
A++; B++; while B {
  while A {
    A--; C++; E++;
    while D {D--; E--;}
    while E {C++; D++; E--;}
  }
  C>>A; D>>B*3; B--;
}

// start -> (1, 1)
// (2a, b+1) -> (3a, b)
// (2a+1, b) -> (3a+2, b+2)
// (a, 0) -> halt
```

## BBCS vs BB

Unlike Turing Machines, smaller CounterScript programs are less chaotic, and holdout size tends to reflect complexity more directly.

CounterScript programs are also easier to accelerate and analyze.
