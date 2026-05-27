"use strict";
import {log, strArray, strObject} from "./log.js"
import {parse} from "./parser.js";
import {runWithRate} from "./execute.js";

const MAX_STEPS = 1000000000;

const el = {
    reset: document.getElementById("btn-reset"),
    step: document.getElementById("btn-step"),
    run: document.getElementById("btn-run"),

    runSpeed: document.getElementById("run-speed"),
    runSpeedValue: document.getElementById("run-speed-value"),

    editor: document.getElementById("code-editor"),
    lineGutter: document.getElementById("line-gutter"),

    status: document.getElementById("status"),
    compiled: document.getElementById("compiled"),
    output: document.getElementById("output"),
    output_name: document.getElementById("output-name"),
    output_value: document.getElementById("output-value"),
    output_caption: document.getElementById("output-caption"),
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

// Run programs
// ================================================================

function clearOutput() {
    el.output_name.textContent = "";
    el.output_value.textContent = "";
    el.output_caption.textContent = "";
}

function setStatus(text) {
    el.status.textContent = text;
}

let parsedProgram = null;
let legend = null;
let runGen = null;
let halted = true;

// Stop control for async run loop (Reset cancels)
let runToken = 0;

// Pause control for async run loop (Pause does NOT cancel generator)
let paused = false;
let pauseWait = null;
let pauseResolver = null;

function updateVarsTable(vars, legend) {
    el.output_name.textContent = "";
    el.output_value.textContent = "";
    el.output_caption.textContent = "Counters";

    for (const [key, value] of Object.entries(vars)) {
        const nameCell = document.createElement("th");
        nameCell.textContent = legend[key];
        el.output_name.appendChild(nameCell);

        const valueCell = document.createElement("td");
        valueCell.textContent = value;
        el.output_value.appendChild(valueCell);
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureCompiled() {
    if (runGen) return true;

    let parsed;
    try {
        [parsed, legend] = parse(el.editor.value);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        el.status.textContent = `Parse error: ${message}`;
        return false;
    }

    parsedProgram = parsed;
    el.compiled.innerHTML =
        `<code style="font-size: 14px; color: #C0C0C0;">${strArray(parsedProgram)}</code>`;

    runGen = runWithRate(parsedProgram, { maxSteps: MAX_STEPS, deciders: false });
    halted = false;
    return true;
}

function reset() {
    // Stop any in-flight async run loop
    runToken++;

    // Clear runtime state
    parsedProgram = null;
    legend = null;
    runGen = null;
    halted = true;

    // Clear pause/running controls
    paused = false;
    pauseWait = null;
    pauseResolver = null;

    // Clear previous output
    clearOutput();
    el.compiled.innerHTML = "";
    setStatus("");
}

function stepOnce() {
    // If generator is not created yet, compile on demand
    if (!ensureCompiled()) return;

    if (halted) return;

    const res = runGen.next();
    if (res.done) {
        halted = true;
        setStatus("Halted");
        return;
    }

    const ctx = res.value;
    updateVarsTable(ctx.vars, legend);
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
    if (!ensureCompiled()) return;

    // If already halted, ensure we start from fresh generator
    if (halted) {
        runGen = null;
        if (!ensureCompiled()) return;
    }

    // Starting/resuming run cancels only previous "run loop" instance
    const myToken = ++runToken;
    paused = false;
    setStatus("Running");

    el.run.textContent = "Pause";

    // Iterate remaining generator steps manually so Reset can stop us
    while (true) {
        if (myToken !== runToken) return;

        // Pause: wait until resumed or reset cancels (runToken changes)
        if (paused) {
            el.run.textContent = "Run";
            await getPausePromise();
            if (myToken !== runToken) return;
            el.run.textContent = "Pause";
            setStatus("Running");
        }

        const res = runGen.next();
        if (res.done) {
            halted = true;
            setStatus("Halted");
            el.run.textContent = "Run";
            return;
        }

        const ctx = res.value;
        updateVarsTable(ctx.vars, legend);

        const delay = 1000 / el.runSpeed.value;
        await sleep(delay);
    }
}

el.reset.addEventListener("click", () => {
    reset();
    // Optional: immediately show initial state after reset by creating generator on first step/run.
});

el.step.addEventListener("click", () => {
    // Step should not auto-run; it should advance a single yielded step
    // (one basic instruction, per executeWithRate() behavior).
    stepOnce();
});

el.run.addEventListener("click", () => {
    // Toggle Run/Pause
    if (halted) {
        // If halted, clicking Run starts a new execution from current code
        pauseWait = null;
        pauseResolver = null;
        runFromCurrent();
        return;
    }

    if (!runGen) {
        runFromCurrent();
        return;
    }

    if (!paused) {
        paused = true;
        // Resolve any existing pause wait (so loop can observe paused state promptly)
        if (pauseResolver) pauseResolver();
    } else {
        paused = false;
        pauseWait = null;
        pauseResolver = null;
        // Resume by starting a new loop instance (generator state is preserved)
        runFromCurrent();
    }
});
