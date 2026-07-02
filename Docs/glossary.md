# Glossary

## Core Concepts

- **Busy Beaver**: For Turing machines, **BB(n)** is the maximum number of steps any n-state halting machine takes.
  > **Note**: In this repo, BB(n) is referenced only for comparison.

- **Busy Beaver for CounterScript**: For CounterScript programs, **BBCS(n)** is the largest score a program of length **n** can have when it halts.

- **Champion**: A program that achieves the best-known (or proven exact) value for a given length.

- **CounterScript**: A minimal computation model with counters and three instruction types.

- **Cryptid**: Informal term for a program whose halting status is believed to be mathematically hard to decide.

- **Holdout**: A program for which halting status is currently undecided.

## CounterScript

- **Declaration**: A counter `#` is declared when an instruction depending of `#` is executed.

- **Loop body**: The TNF fragment corresponding to what runs when the `while` condition is true.

- **Loop tail**: The TNF fragment corresponding to code after the loop completes.

- **Root loop**: The loop currently driving the simulation from the point where the enumerator entered TNF expansion.

- **Undefined loop body**: The enumerator has reached a loop iteration that requires a body fragment that has not yet been generated.

## Search/Transformation Terminology

- **Accelerated Simulation**: Rules used to **speed up** execution of halting (or not) programs.

- **Decider**: A rule that proves a program **does not halt** (as opposed to merely heuristic checks).

- **Equivalence**: Rules that treat two syntactically different programs as equivalent for the purpose of enumeration (e.g., canonicalizing instruction ordering, normal forms).

- **Nonhalting check**: A fast check that often identifies nonhalting behavior but may not be a complete proof system.

- **Reduction**: Rewrite rules that transform a program into a smaller form while preserving the behavior needed for search.

## Structural Patterns

- **Bouncer**: A pattern where values repeatedly bounce from 0 to increasing levels.

- **Cycler**: A pattern where counter values repeat across loop iterations (used to justify nonhalting).

- **Loop body**: The body executed while a specific counter is positive.

- **Translated cycler**: A variant where the same kind of repeating behavior occurs with "translation" (some counters repeatedly increase).
