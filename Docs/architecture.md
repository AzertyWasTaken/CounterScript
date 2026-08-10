# Architecture & execution model

This document explains how parsed CounterScript programs look and gives a general description of each module.

## High-level pipeline

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
  - `enumerator.js` generates candidate programs up to a target length.
  - It uses pruning rules and can apply partial simulation / early rejection.

- **Structural analysis**
  - `scanner.js` derives structural properties (counter usage, undefined loops).
  - `loopAnalyzer.js` performs abstract interpretation for loop termination.

## AST contract

### Instruction types

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

## Module responsibilities

### Root

- **`main.js`**: Entrypoint for the enumerator
- **`parser.js`**: Parse + unparse between source and AST
- **`config.js`**: Constants (`ENUM`, `LOG`, `AREA`)
- **`log.js`**: Debug-friendly logging helpers
- **`tester.js`**: Sanity tests for interpreter/pruning behavior

### Execute

- **`execute.js`**: Interpreter — `execute(config, ctx)` and `run(program, config)`
- **`counters.js`**: Counter (`vars`) operations — `inc`, `dec`, `isZero`, etc.
- **`exeStack.js`**: Execution stack frames — `getCtx`, `newFrame`, `cloneStack`, `updateFrame`
- **`decider.js`**: Translated-cycler detection — `isTransCycler`

### Enumerate

- **`enumerator.js`**: Program enumeration — `enumerate(area)` entry point, `nextInstr`, `endProgram`, `yieldProgram`
- **`enumActions.js`**: Apply/undo instructions — `appBasicInstr`, `appWhileLoop`, `runLoopBody`, `exitLoopBody`
- **`nextState.js`**: Update enumeration `state` object — `basicInstr`, `loopVar`, `loopBody`, `holdout`
- **`nextStack.js`**: Update enumeration stack — `default`, `frame`
- **`areaBuilder.js`**: Build initial stack/state from an area prefix — `buildArea`

### Pruning

- **`pruner.js`**: Pruning rule application — `Prune.program`, `Prune.basicInstr`, `Prune.loopVar`, `Prune.newLoopBody`, `Prune.loopBody`, `Prune.holdout`, `Prune.undefinedLoop`
- **`scanner.js`**: Counter analysis — `scanVars`, `hasUndefinedLoop`, `hasWhileLoop`
- **`loopAnalyzer.js`**: Abstract interpretation — `analyzeLoop`, `filterLoop`, `countIterations`, `loopBody`, `decAndInc`, `defaultState`
- **`valueProps.js`**: Abstract value predicates — `Value.get`, `Value.set`, `isZero`, `isOne`, `isPositive`, `isStatic`, `isNonhalting`, `getMinRange`
- **`areVarsOrdered.js`**: Ordered counter IDs for basic instructions — `areVarsOrdered`
- **`isLoopNested.js`**: Unnecessary loop nesting detection — `isLoopNested`

### Website

- **`runner.js`**: Browser-based interpreter runner
- **`renderCounters.js`**: Counter display rendering
- **`lineNumbers.js`**: Text editor line numbers
