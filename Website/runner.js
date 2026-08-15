"use strict";
import {log, strValue} from "../log.js"
import {parse} from "../parser.js";
import {executeNext} from "../Execute/execute.js";
import {initLineNumbers} from "./lineNumbers.js";
import {renderCounters} from "./renderCounters.js";
import {ExeStack} from "../Execute/exeStack.js";

const el = {
    btnReset: document.getElementById("btn-reset"),
    btnStep: document.getElementById("btn-step"),
    btnRun: document.getElementById("btn-run"),

    runSpeed: document.getElementById("run-speed"),
    runSpeedValue: document.getElementById("run-speed-value"),

    output: document.getElementById("output"),
    status: document.getElementById("status"),
    steps: document.getElementById("steps"),
    compiled: document.getElementById("compiled"),
}

const magNumber = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6.5, 8];

function getRunSpeed(value) {
    return magNumber[value % 10] * 10**Math.floor(value / 10);
}

function updateRunSpeed() {
    el.runSpeedValue.textContent = getRunSpeed(el.runSpeed.value);
}

updateRunSpeed();

el.runSpeed.addEventListener("input", updateRunSpeed);

initLineNumbers();

// Init
// ================================================================

const MAX_STEPS = 1000000000;

let parsedProgram = null;
let legend = null;
let halted = null;
let ctx;
let steps = 0;

const config = {maxSteps: MAX_STEPS, deciders: false};

// Stop control for async run loop (Reset cancels)
let runToken = 0;

// Pause control for async run loop (Pause does NOT cancel generator)
// Note: When the user closes the tab/window, the page is being torn down and
// JS execution may stop immediately after lifecycle events.
let paused = true;
let pauseWait = null;
let pauseResolver = null;

function pauseOnPageHide() {
    // Idempotent: safe to call multiple times.
    if (halted) return;

    paused = true;

    // If the run loop is currently blocked in getPausePromise(), resolve it
    // so it can re-check `paused` and stop stepping promptly.
    if (pauseResolver) {
        try {
            pauseResolver();
        } finally {
            pauseResolver = null;
        }
    }

    // Reflect UI state best-effort.
    if (el && el.btnRun) el.btnRun.textContent = "Run";
    setStatus("Paused");
}

setRunDisabled(true);

el.output.style.display = "none";

function clearOutput() {
    el.output.style.display = "block";
    document.getElementById("counters").style.display = "none";
    setStatus("Running");
    updateSteps();

    el.compiled.innerHTML =
        `<code style="font-size: 14px; color: #C0C0C0;">
        ${strValue(parsedProgram)}
        </code>`;
}

function reset() {
    // Stop any in-flight async run loop
    runToken++;
    compile();

    // Clear pause/running controls
    paused = true;
    pauseWait = null;
    pauseResolver = null;

    // Clear previous output
    clearOutput();

    // Allow running again after reset
    el.btnRun.textContent = "Run";
    setRunDisabled(false);
}

// Display
// ================================================================

function updateSteps() {
    el.steps.textContent = steps.toString();
}

function setStatus(text) {
    el.status.textContent = text;
}

function setRunDisabled(isDisabled) {
    el.btnStep.disabled = isDisabled;
    el.btnRun.disabled = isDisabled;
}

// Run programs
// ================================================================

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function compile() {
    let parsed;
    try {
        [parsed, legend] = parse(document.getElementById("code-editor").value);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        el.status.textContent = `Parse error: ${message}`;
    }

    parsedProgram = parsed;

    ctx = ExeStack.getCtx(parsedProgram);
    halted = false;
    steps = 0;

    // If we just compiled successfully, execution is allowed to start.
    setRunDisabled(false);
}

// Return false of the program halted
function nextStep() {
    let res;
    while (res !== true) {
        const frame = ExeStack.getFrame(ctx);
        const instr = ExeStack.getInstruction(frame);

        if (instr && instr.type === "while" && instr.body.length === 0)
            throw new Error("Cannot execute empty while-loop");

        res = executeNext(config, ctx);

        if (instr && instr.type !== "while") break;
    }

    if (res === true) {
        halted = true;
        setStatus("Halted");
        el.btnRun.textContent = "Run";
        setRunDisabled(true);
        return false;
    }

    steps++;
    updateSteps();

    renderCounters(ctx.vars, legend);
    return true;
}

function stepOnce() {
    if (!ctx) return;
    if (halted) return;

    if (!nextStep()) return;
    setStatus("Running");
}

function getPausePromise() {
    if (!pauseWait) {
        pauseWait = new Promise((resolve) => {
            pauseResolver = resolve;
        });
    }
    return pauseWait;
}

async function runFromCurrent() {
    if (!ctx) return;
    if (halted) return;

    // Starting/resuming run cancels only previous "run loop" instance
    runToken++;
    const myToken = runToken;
    paused = false;
    setStatus("Running");

    el.btnRun.textContent = "Pause";

    // Time-budget pacing:
    // Run as many nextStep() iterations as we can within the per-step budget,
    // then yield once to the event loop. This avoids timer clamping overhead
    // from sleeping after every single step (especially for large runSpeed).
    const now = () => (
        typeof performance !== "undefined" && performance.now
        ? performance.now() : Date.now()
    );

    // Token-bucket state MUST persist across yields, otherwise we lose accumulated tokens.
    let tokens = 0;
    let last = now();

    // Also prevent starving the UI for very large runSpeed values.
    const burstCap = 10000;

    while (true) {
        if (myToken !== runToken) return;

        // Pause: wait until resumed or reset cancels (runToken changes)
        if (paused) {
            el.btnRun.textContent = "Run";
            await getPausePromise();
            if (myToken !== runToken) return;
            el.btnRun.textContent = "Pause";
            setStatus("Running");

            // Reset timing baseline after pause to avoid huge dt jumps.
            last = now();
            tokens = 0;
        }

        const runSpeed = getRunSpeed(el.runSpeed.value); // steps/sec

        const current = now();
        const dt = Math.max(0, current - last); // ms
        last = current;

        // Accumulate fractional tokens.
        tokens += (runSpeed * dt) / 1000;

        // Run as many whole steps as tokens allow, with a safety burst cap.
        let stepsThisBurst = 0;
        while (tokens >= 1) {
            if (myToken !== runToken) return;
            if (paused) break;

            if (!nextStep()) return;

            tokens -= 1;
            stepsThisBurst++;

            if (stepsThisBurst >= burstCap) break;
        }

        // Yield once to avoid blocking the main thread completely.
        if (typeof requestAnimationFrame !== "undefined") {
            await new Promise((resolve) => requestAnimationFrame(() => resolve()));
        } else {
            await sleep(0);
        }
    }
}

el.btnReset.addEventListener("click", () => {
    reset();
    // Optional: immediately show initial state after reset by creating generator on first step/run.
});

el.btnStep.addEventListener("click", () => {
    // Step should not auto-run; it should advance a single yielded step
    // (one basic instruction, per executeWithRate() behavior).
    stepOnce();
});

el.btnRun.addEventListener("click", () => {
    // Toggle Run/Pause
    if (halted) {
        // If halted, clicking Run starts a new execution from current code
        pauseWait = null;
        pauseResolver = null;
        runFromCurrent();
    }
    else if (!ctx) {
        runFromCurrent();
    }
    else if (paused) {
        paused = false;
        pauseWait = null;
        pauseResolver = null;
        // Resume by starting a new loop instance (generator state is preserved)
        runFromCurrent();
    } else {
        paused = true;
        // Resolve any existing pause wait (so loop can observe paused state promptly)
        if (pauseResolver) pauseResolver();
    }
});

// Pause execution best-effort when the tab/window is being closed or hidden.
window.addEventListener("pagehide", pauseOnPageHide, {capture: true});
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") pauseOnPageHide();
}, {capture: true});

// Fallback (some browsers rely on this during navigation/unload).
window.addEventListener("beforeunload", pauseOnPageHide, {capture: true});
