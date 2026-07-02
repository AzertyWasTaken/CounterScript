# Search & Optimization Techniques

During enumeration, this project reduces the search space and early-rejects candidates using four main ideas: **Equivalence**, **Reduction**, **Deciders** and **Accelerated Simulation**.

> **Note**: Brackets `()` are used just for highlighting changes. They have no effect on the program.

## Equivalence Rules

Rules that identify **structurally different programs** (up to renaming/ordering/normal forms) that behave the same for the purpose of search.

### Counters Declaration Order

- Example: `A++; while A {A--; B++;} (D++;)` to `A++; while A {A--; B++;} (C++;)`

Replace counter names by id integer. When a new counter is declared, it uses the first undeclared id.

### Ordered Counters Id for Basic Instructions

- Example: `A++; (B++;) A++;` to `A++; A++; (B++;)`

In every loopless sequence, instruction counter ids must be in ascending order.

- Example: `A++; while A {A--; (B++;)} (C++;)` to `A++; (B++;) while A {A--; (C++;)}`

If a `while #` loop never change the value of `#` then `#--` and `#++` must **not** succeed the loop until appearing in a loop body.

### Tree Normal Form

- Example: `A++; while A {A++;} (A--;)` to `A++; while A {A++;}`

Normalizes certain loop patterns during enumeration to avoid generating equivalent candidates. During enumeration, if the generated program does not halt, stop generating further.

- Example: `A++; while A {while B {(A++; B--;)} A++;}` to `A++; while A {while B {} A++;}`

When a while loop is generated, wait its execution to generate its body.

### Ordered Counter Values

- Example: `A++; B++; (while B {A++; B--;})` to `A++; B++; (while A {A--; B++;})`

When adding a `#` instruction outside of a loop, the value of `#` must not be equal to the value of any counter with a smaller id.

## Reduction Rules

Rules that **rewrite** programs into a smaller / more canonical form (while preserving equivalence class for search).

### Ordered Instructions

- Example: `(A++; A--;) B++;` to `B++;`

In every **loopless** sequence, `#--` must precede `#++`. This prevents instructions cancelling each other.

### Counters Usefulness

- Example: `A++; while A {A--; (while B {B--;})}` to `A++; while A {A--;}`

For each `#++`, the program must also contain a `while #`.

Exception: if a program is halting, an additional counter containing only increments can be allowed to improve its score (e.g. `A++; A++; A++; while A {A--; B++; B++; B++;}`).

### Counters Declaration

- Example: `A++; (B--;) while A {A--; B++;}` to `A++; while A {A--; B++;}`

Any new counters `#` outside of loops must be declared with `#++`.

- Example: `A++; while A {A--; B++; while B {B--;}}`

Completed programs of length `n` must have at most `floor((n + 1) / 3)` counters.

### Nested Loops

- Example: `A++; while A {while B {(A--;) B--;}}` to `A++; while A {(A--;) while B {B--;}}

Any `while #` loop must not contain a single `while #_2` loop with no other instructions outside of `while #_2` body.

### Loops Usefulness

- Example: `A++; while A {A--: B++;} (while A {A--; C++;})` to `A++; while A {A--: B++;}`

Avoid multiple `while #` in a row if there are no `#++` between.

- Example: `A++; (while A {A++; while A {A--; B++;} B++;})` to `A++; A++; (while A {A--; B++;} B++;)`

Root loops must repeat at least twice.

### Root Loop Tail Length

- Example: `A++; while A {A--; B++; B++;} B++;` to `A++; while A {A--; B++; B++;}`

If a program has a root tail, it must be of length ≥ 4 (`while # {#--; #_2++; #_2++;}` doubles the value).

## Deciders

A **decider** proves a program **does not halt**.

### Loop Structure

- Example: `A++; while A {A++; B--;}`

Every `while #` must have a `#--` in its body.

- Example: `A++; while A {A--; A++;}`

Inside each while `#`, every occurrence of `#++` must be followed by `#--` before the loop body end.

- Example: `A++; while A {A++; while A {A--; B++;} while B {A++; B--;}}`

For each `while #_2` within `while #`, if `#` is always greater than 0 when `while #_2` body executes, then check if `#_2` is also greater than 0 before reaching `while #_2`.

### Cyclers

- Example: `A++; while A {while A {A--; B++;} while B {A++; B--;}}`

Decide programs as nonhalting if every counter keeps the same value at the next loop iteration.

- Example: `A++; while A {A++; A++; B++; while B {A--; B--;}}`

If a counter did not reach 0 but is not less than its previous value, it counts like a cycler.

## Accelerated Simulation

Rules used to **speed up** halting (or not) programs execution.

Not implemented yet.
