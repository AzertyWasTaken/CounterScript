# Loop analyzer

Performs abstract interpretation to determine loop termination properties and update analysis state during program generation.

## Overview

The loop analyzer (`Pruning/loopAnalyzer.js`) performs **abstract interpretation** over CounterScript programs. It tracks abstract values for each counter to determine:

- Whether a loop is **non-halting** (can be pruned).
- How many times a loop **iterates** (exact or bounded).
- The **resulting abstract state** after a loop completes.

This analysis is used both as a **decider** (proving non-halting) and as a **pruning aid** during TNF enumeration, where analysis state is maintained alongside the execution stack.

## Abstract values

Abstract values represent possible runtime states of a counter. There are multiple types:

| Type | Fields | Meaning |
| - | - | - |
| `isEqualTo` | `v: int` | Counter is strictly equal to `v`. |
| `isAtLeast` | `v: int` | Counter is greater than or equal to `v`. |
| `isEqualToSelf` | `d: int, i: int, p: bool` | Counter decreases by `d` then increases by `i` per iteration. If `p` is true, the starting value is positive. |
| `isGreaterOrEqualToSelf` | `p: bool` | Counter value is unknown but does not decrease. If `p` is true, the starting value is positive. |

### Value semantics

- **`isEqualTo`**: A precise value. E.g., `{t: "isEqualTo", v: 3}` means the counter is exactly 3.
- **`isAtLeast`**: A lower bound. E.g., `{t: "isAtLeast", v: 2}` means the counter is ≥ 2.
- **`isEqualToSelf`**: A self-referential value that describes how the counter changes per loop iteration. `d` is the total decrement, `i` is the total increment. If `d > i`, the counter decreases each iteration; if `d < i`, it increases. `p` indicates whether the starting value was known to be ≥ 1.

## Analysis state

An analysis state is an object with two fields:

- **`eq`**: An array of abstract values, indexed by counter ID. `state.eq[varId]` gives the abstract value for counter `varId`, or `undefined` if not set.
- **`def`**: The default abstract value used when `eq[varId]` is `undefined`.

Access is via `Value.get(state, varId)` and `Value.set(state, varId, val)` (from `valueProps.js`):

```js
Value.get(state, varId)       // returns state.eq[varId] ?? state.def
Value.set(state, varId, val)  // sets state.eq[varId] = val
```

## Value properties (`valueProps.js`)

The `Value` object provides predicates and helpers:

| Method | Description |
| - | - |
| `isZero(value)` | True if value is exactly 0. |
| `isOne(value)` | True if value is exactly 1. |
| `getMinRange(value)` | Minimum possible value of the counter. |
| `isPositive(value)` | True if the minimum possible value is > 0. |
| `isStatic(value)` | True if the value never changes (d=0, i=0). |
| `isNonhalting(value)` | True if the value is positive or static (loop never terminates). |

## Functions

### `decAndInc(value, d, i)`

Apply a decrement of `d` and increment of `i` to an abstract value. Returns the updated value.

- For `isEqualTo`: `max(v - d, 0) + i`
- For `isAtLeast`: `max(v - d, 0) + i`
- For `isEqualToSelf`: combines the deltas: `d' = d + max(d - i, 0)`, `i' = max(i - d, 0) + i`

### `countIterations(headValue, bodyValue)`

Determine how many times a loop iterates, given the head (entry) value and the body's effect on the loop variable.

Returns an abstract iteration count:

- `{t: "isEqualTo", v: N}` — exactly N iterations.
- `{t: "isAtLeast", v: N}` — at least N iterations.

Logic:

1. If `bodyValue` is `isEqualToSelf` (decreasing):
   - If `headValue` is `isEqualTo`: `ceil(headValue.v / bodyValue.d)` iterations.
   - If `headValue` has a positive minimum: `ceil(minRange / bodyValue.d)` iterations.
2. If `headValue` is positive:
   - If `bodyValue` is zero: exactly 1 iteration.
   - Otherwise: at least 1 iteration.
3. If `headValue` is zero: exactly 0 iterations.
4. Otherwise: at least 0 iterations.

### `loopInstr(headValue, bodyValue, iterations)`

Compute the resulting abstract value of a counter after a loop, given the head value, body value, and iteration count.

- If the body value is static (unchanged): return the head value.
- If head and body are both `isEqualTo` with the same value: return the head value.
- If iterations are positive:
  - For `isEqualTo`/`isAtLeast` body values: return the body value.
  - For `isEqualToSelf` body values:
    - If iterations are exact: apply `iteratedAddSub` to compute the net effect.
    - If the body increases (`d < i`): compute a lower bound.
    - Otherwise: return `isAtLeast` with the body's increment.
- If the body is `isEqualToSelf` with `d ≤ i`: return `isAtLeast` with the head's minimum.
- Otherwise: return `isAtLeast` with the minimum of head and body ranges.

### `loopBody(state, bodyState, iterations)`

Merge a loop body's analysis state into the current state, iterated `iterations` times.

- Updates `state.def` if the body's default is not `isEqualToSelf`.
- For each variable, computes the new value via `loopInstr` and sets it in `state`.

### `defaultState(loopVar)`

Create a fresh analysis state for a loop with the given loop variable.

- `eq` is empty.
- `def` is `{t: "isEqualToSelf", d: 0, i: 0, p: false}` (no change by default).
- If `loopVar` is an integer, sets `eq[loopVar]` to `{t: "isEqualToSelf", d: 0, i: 0, p: true}` (the loop variable starts positive).

### `analyzeLoop(program, whileVar)`

The main analysis function. Walks a program (list of instructions) and computes the resulting analysis state.

Returns:

- The analysis state if the program is valid.
- `null` if:
  - A `dec` is applied to a counter proven to be zero.
  - A `while` loop's condition counter is proven to be zero.
  - A nested loop body is proven non-halting.
  - A loop is proven to repeat exactly once (equivalent to inlining).

For each instruction:

- **`inc`**: Apply `decAndInc(value, 0, 1)`.
- **`dec`**: If the value is zero, return `null`. Otherwise, apply `decAndInc(value, 1, 0)`.
- **`while`**:
  1. Get the head value of the loop variable.
  2. If zero, return `null`.
  3. Recursively analyze the body.
  4. If the body is non-halting, return `null`.
  5. Count iterations. If exactly 1, return `null` (equivalent to inlining).
  6. Merge the body state via `loopBody`.
  7. Set the loop variable to 0 (it is exhausted after the loop).

### `filterLoop(program, loopVar)`

Return `true` if the while-loop is proven non-halting or equivalent (should be pruned).

Calls `analyzeLoop` and checks if the resulting loop variable value is non-halting.

## Updating analysis state during program generation

During TNF enumeration, the analysis state is maintained **alongside** the execution stack. Each program stack frame carries an `analysis` field (initialized via `defaultState`) that tracks abstract counter values as instructions are appended.

### `appBasicInstr` (in `enumActions.js`)

When a basic instruction (inc/dec) is appended inside a loop body:

1. Save the current abstract value of the affected counter.
2. Apply `decAndInc` to update the value (inc → `decAndInc(value, 0, 1)`, dec → `decAndInc(value, 1, 0)`).
3. Store the new value via `Value.set`.
4. The undo function restores the saved value.

### `appWhileLoop` (in `enumActions.js`)

When a while-loop header is appended:

1. A new program stack frame is created with `NextStack.frame(instr, [])`.
2. The frame's `analysis` is initialized via `defaultState(instr.var)`.
3. If the loop condition is true (counter is non-zero at runtime), the body is expanded immediately with a fresh analysis state.
4. If the loop condition is false, the body is left empty.

### `exitLoopBody` (in `enumActions.js`)

When a loop body is completed and the loop exits:

1. The body frame is popped from the program stack.
2. If still inside a nested loop (`stack.length > 1`):
   - Save a shallow copy of the parent's analysis state (for undo).
   - Get the head value and body value of the loop variable.
   - Count iterations via `countIterations`.
   - Merge the body state into the parent state via `loopBody`.
   - Set the loop variable to 0 in the parent state.
3. If the loop halted normally, generate the loop tail.
4. If execution is still in progress (undefined body), generate the next nested body.

### `cloneAnalysisState` (in `enumActions.js`)

A shallow copy of the analysis state's `eq` array (the `def` is immutable and shared). Used to save/restore analysis state during undo operations.

### Pruning integration

The analysis state is used by the pruner (`pruner.js`) to make decisions:

- **`Prune.basicInstr`**: Prunes a `dec` on a counter proven zero via `Value.isZero`.
- **`Prune.loopVar`**: Prunes a `while` loop on a counter proven zero.
- **`Prune.newLoopBody`**: Checks if a nested loop repeats exactly once (via `countIterations` + `Value.isOne`) and prunes it.
- **`Prune.loopBody`**: Checks all execution stack frames for non-halting loops (via `filterLoop`).
- **`Prune.holdout`**: Checks all generation stack frames for invalid nesting or non-halting loops.
