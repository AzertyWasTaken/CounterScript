"use strict";
import {log, strArray, strObject} from "./log.js"
import {parse} from "./parser.js";
import {executeNext, getCtx, getFrame, getInstruction} from "./execute.js";

const el = {
    btnReset: document.getElementById("btn-reset"),
    btnStep: document.getElementById("btn-step"),
    btnRun: document.getElementById("btn-run"),

    runSpeed: document.getElementById("run-speed"),
    runSpeedValue: document.getElementById("run-speed-value"),

    editor: document.getElementById("code-editor"),
    lineGutter: document.getElementById("line-gutter"),

    output: document.getElementById("output"),
    status: document.getElementById("status"),
    steps: document.getElementById("steps"),
    compiled: document.getElementById("compiled"),

    counters: document.getElementById("counters"),
    countersName: document.getElementById("counters-name"),
    countersValue: document.getElementById("counters-value"),
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
let halted = null;
let ctx;
let steps = 0;

const config = {maxSteps: MAX_STEPS, deciders: false};

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
    el.btnStep.disabled = isDisabled;
    el.btnRun.disabled = isDisabled;
}

function updateVarsTable(vars, legend) {
    const entries = Object.entries(vars);
    if (entries.length === 0) {
        el.counters.style.display = "none";
        return;
    }

    el.counters.style.display = "table";
    el.countersName.textContent = "";
    el.countersValue.textContent = "";

    for (const [key, value] of entries) {
        const nameCell = document.createElement("th");
        nameCell.textContent = legend[key];
        el.countersName.appendChild(nameCell);

        const valueCell = document.createElement("td");
        valueCell.textContent = value;
        el.countersValue.appendChild(valueCell);
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

    ctx = getCtx(parsedProgram);
    halted = false;
    steps = 0;

    // If we just compiled successfully, execution is allowed to start.
    setRunDisabled(false);
}

// Return false of the program halted
function nextStep() {
    let res;
    while (res !== true) {
        const frame = getFrame(ctx);
        const instr = getInstruction(frame);

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

    updateVarsTable(ctx.vars, legend);
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

    // Iterate remaining generator steps manually so Reset can stop us
    while (true) {
        if (myToken !== runToken) return;

        // Pause: wait until resumed or reset cancels (runToken changes)
        if (paused) {
            el.btnRun.textContent = "Run";
            await getPausePromise();
            if (myToken !== runToken) return;
            el.btnRun.textContent = "Pause";
            setStatus("Running");
        }

        if (!nextStep()) return;

        const delay = 1000 / el.runSpeed.value;
        await sleep(delay);
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
