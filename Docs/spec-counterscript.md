# CounterScript Specification

CounterScript is a minimal model of computation created the **19 March 2026** by **Azerty**. It shares many similarities with **Minsky’s machines**, **Brainfuck** and **Fractran**.

It is **Turing-complete**, meaning it can simulate any Turing-complete system (e.g. Turing machines).

## Counters

A CounterScript program operates on a finite but unbounded set of counters: `A`, `B`, `C`, ...

- All counters are initialized to `0`.
- The set of all counters of a program is called its **state**.

## Instructions

A CounterScript program is composed of 3 instruction types:

| Instruction | Description |
| - | - |
| `A++;` | Increment counter `A` by 1 |
| `A--;` | Decrement `A` by 1 if `A > 0` |
| `while A {...}` | Execute body while `A > 0` |

`A`, `B`, `C`, ... may represent any counter.

## Example

```text
`A++; A++; while A {A--; B++; B++; B++;}`
```

Informal execution trace:

1. Initially, `A = 0` and `B = 0`
2. After `A++; A++;`, `A = 2` and `B = 0`
3. After first loop iteration (`A` > 0), `A = 1` and `B = 3`
4. After second loop iteration (`A` > 0), `A = 0` and `B = 6`
5. Loop ends because `A = 0`
6. Since there are no instructions after the loop, the program ends, with `A = 0` and `B = 6`
