# Tree Normal Form Enumeration

This document explains how **tree normal form enumeration** works in the CounterScript algorithm.

Tree Normal Form (TNF) enumeration builds candidate programs while simultaneously **executing** them (as far as possible during construction). This avoids emitting instructions that would never be reached by any execution path.

## Key Idea

When the enumerator appends an instruction, it also updates two parallel lightweight states for that partially built program:

- **Execution state**: the runtime counter values and call stack, used to decide whether a `while` condition is true/false and what happens when the loop is entered.
- **Analysis state**: an abstract interpretation state (see `Docs/loop-analyzer.md`) that tracks symbolic counter values, enabling pruning decisions (e.g., "this counter is provably zero") without full simulation.

Control-flow constructs (notably while-loops) are expanded only when execution indicates they will be used.

## Rules of Construction

### Basic Instruction

When the next instruction is a basic operation (i.e., not a control-flow construct):

- **Append** the instruction to the program.
- **Update** the current execution state accordingly.
- **Update** the analysis state: apply `decAndInc` to the abstract value of the affected counter (see `Docs/loop-analyzer.md` → `appBasicInstr`).

### While-loop Construction

When the enumerator appends a `while #` loop, it must decide whether the loop body is reachable immediately:

- **Append** the `while` loop node.
- **Check** whether the loop condition indicates immediate execution.
  - If the loop condition is satisfied, so the enumerator should **generate the loop body**.
  - If the loop condition is **not** satisfied, so the enumerator should **not generate the loop body**.
- **Initialize** a new analysis state for the loop body via `defaultState(loopVar)`.

### Loop End Behavior

After expanding the loop body, the enumerator must repeatedly simulate the loop and decide what to emit next:

- **Repeatedly execute the loop** until the loop terminates or new structure must be created.
  - If the loop terminates:
    - **Generate the loop tail** (the code that follows the loop).
    - **Merge** the body's analysis state into the parent frame's analysis state via `loopBody` (see `Docs/loop-analyzer.md` → `exitLoopBody`).
  - If the loop body is undefined when execution reaches it:
    - **Generate the loop body** at that point.
    - Then **resume execution** of the root loop to continue expanding from the correct control-flow location.

## Stacks Management

The enumerator maintains two related "stacks":

- **Program stack (TNF generation stack)**: the stack of *generation frames* used to know **which TNF subtree is currently being expanded** (i.e. what the current `.program` array is).
- **Execution stack (interpreter/call stack)**: the stack of **interpreter frames** used for the lightweight simulation that decides whether a `while` condition is true/false and what happens when the loop is entered.

### Program Stack

- Each frame on the program stack corresponds to a partially-built TNF region:
  - `frame.program`: The TNF node list currently being appended to.
  - `frame.loopVar`: Records which loop variable the current root of this generation frame represents.
  - `frame.callStack`: Carries the execution stack snapshot needed to continue loop simulation later.
  - `frame.analysis`: The abstract interpretation state for this loop body, initialized via `defaultState(loopVar)` (see `Docs/loop-analyzer.md`). Tracks abstract counter values as instructions are appended, enabling pruning decisions without full simulation.

- **Push when entering a loop body region**:
  - When a while-loop node is appended and the construction decides the body must be expanded *immediately*, the enumerator creates a fresh child generation frame with an empty execution stack for the new body.

- **Pop when loop-body generation finishes**:
  - After the enumerator finishes expanding the body region (including any nested loop expansions), it returns (pops) to the parent generation frame so sibling expansions can proceed with a clean control context.

### Execution Stack

The execution stack is what the enumerator clones/saves while simulating loop behavior.

- **Fresh call stack for immediate body expansion**:
  - If execution indicates the loop condition is already true at the moment the while-loop is constructed, the body expansion starts with a new, empty interpreter/call stack.
  - This prevents the simulation state from being "contaminated" by whatever simulation path led to selecting that body region.

- **Pause-and-resume for undefined loop-body execution**:
  - During loop simulation, the interpreter may reach a point where the enumerator needs the loop body **but it hasn’t been generated yet**.
  - In that case:
    1. Execution is paused and stored in the new program stack frame.
    2. The enumerator passes the *current* execution stack snapshot into the child frame.
    3. After generating that body region, execution is resumed by continuing the original loop expansion logic from the saved control/simulation state.

- **No body generation when the loop terminates immediately**:
  - If simulation determines the loop halted, the enumerator does **not** generate an additional body; instead it proceeds to emit the loop tail.

### Correctness Intuition

- The **program stack** controls *where* new TNF nodes may be appended.
- The **execution stack** controls *what execution path is currently being simulated*.
- When the algorithm must create a loop body that is not yet present, it effectively **suspends simulation by storing the execution stack snapshot**, generates the required missing subtree, then **restores simulation context** by reusing that snapshot.

## Why this avoids unused instructions?

Because expansion decisions are tied to execution:

- The enumerator does **not** emit a loop body when the condition is immediately false.
- It only emits missing loop-body structure when execution actually reaches that part of the control-flow.
- It emits loop tail only after the simulated loop actually terminates.

This keeps the generated TNF tree smaller and prevents unreachable instructions from being added.
