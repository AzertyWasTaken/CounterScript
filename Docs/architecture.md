# Architecture & Execution Model

This document explains how parsed CounterScript programs looks like and gives a general description of each scripts.

## High-Level Pipeline

- **Parsing / AST**
  - Programs are represented as an AST (array of instructions).
  - Instruction nodes have shapes like:
    - `{type: "inc", var: <number>}`
    - `{type: "dec", var: <number>}`
    - `{type: "while", var: <number>, body: <instruction[]> | undefined}`
  
- **Execution**
  - The interpreter executes programs using a **stack of loop frames**.
  - This supports nested `while` blocks.

- **Enumeration**
  - `enumerate.js` generates candidate programs up to a target length.
  - It uses pruning rules and can apply partial simulation / early rejection.

- **Structural analysis**
  - `getProgData.js` derives structural properties used for decisions/pruning.

## AST Contract

### Instruction Types

- `inc`
  - Fields: `type`, `var`
  - Meaning: increment counter `var` by 1.

- `dec`
  - Fields: `type`, `var`
  - Meaning: decrement counter `var` by 1 if `var > 0`.

- `while`
  - Fields: `type`, `var`, `body`
  - Meaning: execute `body` while counter `var > 0`.
  - During enumeration, `body` may be `undefined` until the body is generated.

## Module Responsibilities

- **Main**
  - **`main.js`**: Entrypoint for the enumerator
  - **`log.js`**: Debug-friendly logging helpers
  - **`tester.js`**: Sanity tests for interpreter/pruning behavior

- **Enumerator**
  - **`enumerate.js`**: Program enumeration + pruning + partial simulation
  - **`pruner.js`**: Pruning rule application
  - **`nextState.js`**: Update `state` object of enumerator
  - **`scanner.js`**: Identify unused counters in a program
  - **`getProgData.js`**: Structural properties
  - **`isLoopNonhalting.js`**: Heuristic/non-formal nonhalting check

- **Interpreter**
  - **`execute.js`**: Interpreter
  - **`parser.js`**: Parse + unparse between source and AST
  - **`counters.js`**: Counter (`vars`) operations
