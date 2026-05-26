"use strict";
import {log, strArray, strObject} from "./log.js"
import {parse} from "./parser.js";
import {runWithRate} from "./execute.js";

const MAX_STEPS = 1000000000;

const el = {
    // reset: document.getElementById("btn-reset"),
    run: document.getElementById("btn-run"),
    // step: document.getElementById("btn-step"),

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
    el.runSpeedValue.textContent = el.runSpeed.value;
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

let vars, program;

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

// function reset() {
//     vars = {};
//     program = parse(el.editor);
// }

// el.reset.addEventListener("click", reset);

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function compileAndRun() {
    // Clear previous output
    el.output_name.textContent = "";
    el.output_value.textContent = "";
    el.output_caption.textContent = "";

    let parsed, legend;
    try {
        [parsed, legend] = parse(el.editor.value);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        el.status.textContent = `Parse error: ${message}`;
        return;
    }

    el.compiled.innerHTML = `<code style="font-size: 14px; color: #C0C0C0;">${strArray(parsed)}</code>`;
    const runGen = runWithRate(parsed, {maxSteps: MAX_STEPS, deciders: false});

    el.status.textContent = "Running";
    for (const ctx of runGen) {
        updateVarsTable(ctx.vars, legend);
        await sleep(1000 / el.runSpeed.value);
    }
    el.status.textContent = "Halted";
}

el.run.addEventListener("click", compileAndRun);

// el.step.addEventListener("click", () => {});
