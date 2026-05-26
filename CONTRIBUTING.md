# Contributing

Thanks for taking the time to contribute to this project.

## What to contribute

- **Write deciders** to prove nonhalting behavior of individual machines
- **Build accelerated simulators** to simulate halting machines faster
- **Performance optimizations** (while preserving correctness)
- **Bug fixes** and **consistency** fixes across the codebase
- **Documentation** improvements
- **Enumerate larger values** and publish the results
- **Write formal proofs** for pruning rules and deciders

## Before you start

1. Pick the area you want to work on (a file, a feature, or a result).
2. Read the relevant existing code/documentation first.
3. If you are unsure whether your change fits the project or could affect correctness, open an **Issue** first.

## Reporting issues

Open an issue with:

- What you expected to happen
- What actually happened
- The relevant notation name / file(s)
- Minimal reproduction steps (or the smallest failing example)
- (If applicable) a short log/output snippet

## Proposing changes (pull requests)

Open a pull request with:

- A clear title describing what changed
- A description of what changed and why
- Evidence of correctness and/or performance impact (see *Testing expectations*)

### Pull request checklist (required)

- [ ] Performance is not catastrophically worse (and ideally improves)
- [ ] If you touch search/decider logic: correctness is justified and/or verified by tests/logs
- [ ] If you add a new decider: check if it does not creates false positives
- [ ] Quick manual verification is done (e.g. run the provided runner / sanity checks)

## Testing expectations

- Ensure behavior matches the intended domain.
- If you add or change behavior, update/verify the associated test log/workflow.
- If the repo provides an existing runner, validate using the project’s current workflow.

## License

By contributing, you agree that your contributions will be licensed under the project license (see repository `LICENSE.txt` file).
