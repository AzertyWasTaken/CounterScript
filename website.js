"use strict";
import {log, strArray, strObject} from "./log.js"
import {parse} from "./parser.js";
import {runWithRate} from "./execute.js";

const el = {
    btn_reset: document.getElementById("btn-reset"),
    btn_step: document.getElementById("btn-step"),
    btn_run: document.getElementById("btn-run"),

    runSpeed: document.getElementById("run-speed"),
    runSpeedValue: document.getElementById("run-speed-value"),

    editor: document.getElementById("code-editor"),
    lineGutter: document.getElementById("line-gutter"),

    output: document.getElementById("output"),
    status: document.getElementById("status"),
    steps: document.getElementById("steps"),
    compiled: document.getElementById("compiled"),

    counters: document.getElementById("counters"),
    counters_name: document.getElementById("counters-name"),
    counters_value: document.getElementById("counters-value"),
}

el.runSpeed.addEventListener("input", () => {
    el.runSpeedValue.textContent = `${el.runSpeed.value}/s`;
});

// Line numbers
// ================================================================

function getLineCount(text) {
    // Ensure at least one line number is shown
    const lines = text.split("\n").length;
    return Math.max(1, lines);
}

function renderLineGutter() {
    if (!el.lineGutter || !el.editor) return;

    const lineCount = getLineCount(el.editor.value);

    // Render one element per line number so layout doesn't depend on newline rendering.
    el.lineGutter.textContent = "";
    for (let i = 0; i < lineCount; i++) {
        const lineNumberEl = document.createElement("div");
        lineNumberEl.className = "line-number";
        lineNumberEl.textContent = (i + 1).toString();
        el.lineGutter.appendChild(lineNumberEl);
    }
}

function syncGutterScroll() {
    if (!el.lineGutter || !el.editor) return;
    el.lineGutter.scrollTop = el.editor.scrollTop;
}

function syncGutterHeight() {
    if (!el.lineGutter || !el.editor) return;

    // textarea clientHeight excludes borders; gutter is border-box in CSS,
    // but height sync with clientHeight keeps scroll areas aligned.
    const h = el.editor.clientHeight;

    el.lineGutter.style.height = `${h}px`;
    el.lineGutter.style.minHeight = `${h}px`;
}

function initLineNumbers() {
    // If the gutter isn't present, do nothing.
    if (!el.lineGutter || !el.editor) return;

    // Initial render + geometry sync
    renderLineGutter();
    syncGutterHeight();
    syncGutterScroll();

    // Update on typing/paste
    el.editor.addEventListener("input", () => {
        renderLineGutter();
        syncGutterHeight();
        syncGutterScroll();
    });

    // Keep aligned while scrolling
    el.editor.addEventListener("scroll", () => {
        syncGutterScroll();
    });

    // Keep aligned while resizing (e.g. dragging textarea bottom-right corner)
    if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver(() => {
            syncGutterHeight();
            syncGutterScroll();
        });
        ro.observe(el.editor);
    } else {
        // Fallback: window resize + next frame
        window.addEventListener("resize", () => {
            requestAnimationFrame(() => {
                syncGutterHeight();
                syncGutterScroll();
            });
        });
    }
}

initLineNumbers();

// Init
// ================================================================

const MAX_STEPS = 1000000000;

let parsedProgram = null;
let legend = null;
let runGen = null;
let halted = null;
let steps = 0;

// Stop control for async run loop (Reset cancels)
let runToken = 0;

// Pause control for async run loop (Pause does NOT cancel generator)
let paused = true;
let pauseWait = null;
let pauseResolver = null;

setRunDisabled(true);

el.output.style.display = "none";

function clearOutput() {
    el.output.style.display = "block";
    el.counters.style.display = "none";
    setStatus("Running");
    updateSteps();

    el.compiled.innerHTML =
        `<code style="font-size: 14px; color: #C0C0C0;">${strArray(parsedProgram)}</code>`;
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
    el.btn_step.disabled = isDisabled;
    el.btn_run.disabled = isDisabled;
}

function updateVarsTable(vars, legend) {
    const entries = Object.entries(vars);
    if (entries.length === 0) {
        el.counters.style.display = "none";
        return;
    }

    el.counters.style.display = "table";
    el.counters_name.textContent = "";
    el.counters_value.textContent = "";

    for (const [key, value] of entries) {
        const nameCell = document.createElement("th");
        nameCell.textContent = legend[key];
        el.counters_name.appendChild(nameCell);

        const valueCell = document.createElement("td");
        valueCell.textContent = value;
        el.counters_value.appendChild(valueCell);
    }
}

// Run programs
// ================================================================

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function compile() {
    let parsed;
    try {
        [parsed, legend] = parse(el.editor.value);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        el.status.textContent = `Parse error: ${message}`;
    }

    parsedProgram = parsed;
    runGen = runWithRate(parsedProgram, {maxSteps: MAX_STEPS, deciders: false});
    halted = false;
    steps = 0;

    // If we just compiled successfully, execution is allowed to start.
    setRunDisabled(false);
}

// Return false of the program halted
function nextStep() {
    const res = runGen.next();

    if (res.done) {
        halted = true;
        setStatus("Halted");
        el.btn_run.textContent = "Run";
        setRunDisabled(true);
        return false;
    }

    steps++;
    updateSteps();

    const ctx = res.value;
    updateVarsTable(ctx.vars, legend);
    return true;
}

function stepOnce() {
    if (!runGen) return;
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
    if (!runGen) return;
    if (halted) return;

    // Starting/resuming run cancels only previous "run loop" instance
    runToken++;
    const myToken = runToken;
    paused = false;
    setStatus("Running");

    el.btn_run.textContent = "Pause";

    // Iterate remaining generator steps manually so Reset can stop us
    while (true) {
        if (myToken !== runToken) return;

        // Pause: wait until resumed or reset cancels (runToken changes)
        if (paused) {
            el.btn_run.textContent = "Run";
            await getPausePromise();
            if (myToken !== runToken) return;
            el.btn_run.textContent = "Pause";
            setStatus("Running");
        }

        if (!nextStep()) return;

        const delay = 1000 / el.runSpeed.value;
        await sleep(delay);
    }
}

el.btn_reset.addEventListener("click", () => {
    reset();
    // Optional: immediately show initial state after reset by creating generator on first step/run.
});

el.btn_step.addEventListener("click", () => {
    // Step should not auto-run; it should advance a single yielded step
    // (one basic instruction, per executeWithRate() behavior).
    stepOnce();
});

el.btn_run.addEventListener("click", () => {
    // Toggle Run/Pause
    if (halted) {
        // If halted, clicking Run starts a new execution from current code
        pauseWait = null;
        pauseResolver = null;
        runFromCurrent();
    }
    else if (!runGen) {
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
