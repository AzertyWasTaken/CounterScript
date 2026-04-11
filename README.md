# About

The goal of this project is to prove the first values of the Busy Beaver function for CounterScript.  
If you are interested, you can join my Discord server by pressing this link: https://discord.gg/H3FnyZwA6P

# CounterScript

CounterScript is a model of computation created in March 2026 by Azerty.  
It uses a minimal instruction set designed around incrementing, conditional decrementing, and looping.  
The language has an unlimited number of variables (called counters), each storing a nonnegative integer.  
All counters are initialized to 0.

## Instructions

A CounterScript program is composed of 3 instruction types:

| Instruction | Description
| - | -
| `A++;` | Increment A by 1
| `A--;` | If A is greater than 0, decrement A by 1
| `while A {...}` | Repeat while A is greater than 0

# BBCS

The Busy Beaver function for CounterScript, denoted BBCS(n), returns the largest value a counter can store after a CounterScript program of length *n* halts.  
The length of a program is the number of instructions it contains.

## Lower Bounds

The first 7 values of BBCS are proven.

| BBCS(n) | Value | Champion | Notes
| - | - | - | -
| 1 | 1 | `A++;` |
| 2 | 2 | `A++; A++;` |
| 3 | 3 | `A++; A++; A++;` |
| 4 | 4 | `A++; A++; A++; A++;` |
| 5 | 5 | `A++; A++; A++; A++; A++;` |
| 6 | 6 | `A++; A++; A++; A++; A++; A++;` |
| 7 | 7 | `A++; A++; A++; A++; A++; A++; A++;` |
| 8 | 9 | `A++; A++; A++; while A > 0 {A--; B++; B++; B++;}` |
| 9 | 12 | `A++; A++; A++; A++; while A > 0 {A--; B++; B++; B++;}` |
| 10 | 16 | `A++; A++; A++; A++; while A > 0 {A--; B++; B++; B++; B++;}` |
| 11 | 20 | `A++; A++; A++; A++; A++; while A > 0 {A--; B++; B++; B++; B++;}` |
| 12 | 25 | `A++; A++; A++; A++; A++; while A > 0 {A--; B++; B++; B++; B++; B++;}` |
| 13 | 30 | `A++; A++; A++; A++; A++; A++; while A > 0 {A--; B++; B++; B++; B++; B++;}` |
| 14 | 36 | `A++; A++; A++; A++; A++; A++; while A > 0 {A--; B++; B++; B++; B++; B++; B++;}` |
| 15 | 42 | `A++; A++; A++; A++; A++; A++; A++; while A > 0 {A--; B++; B++; B++; B++; B++; B++;}` |
| 16 | 49 | `A++; A++; A++; A++; A++; A++; A++; while A > 0 {A--; B++; B++; B++; B++; B++; B++; B++;}` |

## Holdouts

| BBCS(n) | Count
| - | -
| 7 | 1
| 8 | 16
| 9 | 124
| 10 | 992

### BBCS(7)

```
A++; B++; while A > 0 {A++; while B > 0 {A--; B--;}}
```

### BBCS(8)

```
A++; A++; B++; while A > 0 {A++; while B > 0 {A--; B--;}}
A++; B++; while A > 0 {A++; A++; while B > 0 {A--; B--;}}
A++; B++; while A > 0 {A++; B--; while B > 0 {A--; B--;}}
A++; B++; while A > 0 {A++; while B > 0 {A--; B--;} B--;}
A++; B++; while A > 0 {A++; while B > 0 {A--; B--; B--;}}
A++; while A > 0 {A--; B++; B++; while B > 0 {A++; B--;}}
A++; while A > 0 {A--; B++; while B > 0 {A++; B--;} B++;}
A++; while A > 0 {A--; B++; while B > 0 {A++; A++; B--;}}
A++; while A > 0 {A++; A++; B++; while B > 0 {A--; B--;}}
A++; while A > 0 {A++; A++; while B > 0 {A--; B--;} B++;}
A++; while A > 0 {A++; B--; while B > 0 {A--; B--;} B++;}
A++; while A > 0 {A++; B++; while B > 0 {A++; B--;} A--;}
A++; while A > 0 {A++; while B > 0 {A++; B--;} A--; B++;}
A++; while A > 0 {B++; B++; while B > 0 {A++; B--;} A--;}
A++; while A > 0 {B++; while B > 0 {A++; B--;} A--; B++;}
A++; while A > 0 {B++; while B > 0 {A++; A++; B--;} A--;}
```

# How it works

| Script | Description
| - | -
| main.js | Only script that should be run outside of tests. It also contains configurations.
| search.js | Collects and logs results from other scripts.
| enumerate.js | Gets all possible CounterScript programs of a specific length.
| execute.js | Runs CounterScript programs.
| unparse.js | Converts CounterScript objects to readable strings.
| log.js | Modified version of console.log function.
| canHalt.js | Checks if a *var* loop has dec *var*.
| getUsedVar.js | Get the set of counters used in a program.
| hasIncVar.js | Checks if for every *var*, the program has inc *var* outside of a *var* loop.
| compare.js | Compare the value of every counters.

## Equivalence

### Ordered counter names

`A++; B++; A++;` is equivalent to `A++; A++; B++;`:  
In every loopless sequences, instruction counter names must be in ascending order.  
enumerate.js - Add a minInstr param that forces instructions ordering and resets when a loop is generated.

### Ordered while loops

`A++; while A {...} B++;` is equivalent to `A++; B++; while A {...}` where `{...}` refers to any statements that does not involve *B*:  
Every dec *var* and inc *var* must be before a while loop if *var* appears in its body.
enumerate.js - When a loop is generated, create a set of counters used inside its body. The next loopless sequence must contain only variables from this set.

### Tree enumeration

enumerate.js - Execute and store programs during enumeration.

### Ordered counter values

`A++; B++; while B {A++; B--;}` is equivalent to `A++; B++; while A {A--; B++;}`:  
If *var* has the same value as *var'*, the next instruction must not be *var'*.

## Reduction

### Ordered instructions

`A++; A--; B++;` is equivalent to `B++;`:  
Any dec *var* after inc *var* cancel each other.  
In every loopless sequences, dec *var* must be before inc *var*.  
enumerate.js - Make the minInstr param include decrements and increments order.

### Counters declaration

New variables outside of loops must start with an increment.  
enumerate.js - Add a isInLoop param which return if the generating program is inside a loop.

### Programs ending

The length 4 loop `while A {A--; B++; B++;}` is the smallest loop that increases a variable nontrivially:  
Programs must end with a loop of length > 3.  
enumerate.js - Skip loop generation if 0 < remaining length < 4.

### Useless counters

For every *var*, the program must also contains an inc *var* somewhere inside or before its root loop.  
search.js - Skip programs with unused counters.

### Useless loops

`A++; while A {while A {A--;}}` is equivalent to `A++; while A {A--;}`:  
`A++; B++; while A > 0 {while B > 0 {while A > 0 {A--; B--;}}}` is equivalent to `A++; B++; while A > 0 {A--; B--;}}`:  
If a *var* whle loop has a *var* while loop inside nested, it must be followed by an inc *var* inside another loop.  
enumerate.js - When a loop is generated, verify if it satisfies these conditions.

### Useless counters

For every *var*, the program must also contains a while *var*.  
An exception var may be added for busy beavers.

## Decider

### Nondecreasing loops

`A++; while A {A--; A++;}` never halts:  
While *var* loops either never halts or are never used if they do not contains any dec *var* **not** followed by inc *var*.  
enumerate.js - Set minimum loop length to 1 and skip nondecreasing loops generation.

### Cycler

Decide programs as nonhalting if all counter values repeat in the beginning of a loop.  
execute.js - Save counters in the beginning of each loop then compare it with current counters at the next iteration.

## Simulation

N/A