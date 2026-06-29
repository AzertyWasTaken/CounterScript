"use strict";
const lineGutter = document.getElementById("line-gutter");
const editor = document.getElementById("code-editor");

function getLineCount(text) {
    // Ensure at least one line number is shown
    const lines = text.split("\n").length;
    return Math.max(1, lines);
}

function renderLineGutter() {
    const lineCount = getLineCount(editor.value);

    // Render one element per line number so layout doesn't depend on newline rendering.
    lineGutter.textContent = "";
    for (let i = 0; i < lineCount; i++) {
        const lineNumberEl = document.createElement("div");
        lineNumberEl.className = "line-number";
        lineNumberEl.textContent = (i + 1).toString();
        lineGutter.appendChild(lineNumberEl);
    }
}

function syncGutterScroll() {
    lineGutter.scrollTop = editor.scrollTop;
}

function syncGutterHeight() {
    // textarea clientHeight excludes borders; gutter is border-box in CSS,
    // but height sync with clientHeight keeps scroll areas aligned.
    const h = editor.clientHeight;

    lineGutter.style.height = `${h}px`;
    lineGutter.style.minHeight = `${h}px`;
}

export function initLineNumbers() {
    // Initial render + geometry sync
    renderLineGutter();
    syncGutterHeight();
    syncGutterScroll();

    // Update on typing/paste
    editor.addEventListener("input", () => {
        renderLineGutter();
        syncGutterHeight();
        syncGutterScroll();
    });

    // Keep aligned while scrolling
    editor.addEventListener("scroll", () => {
        syncGutterScroll();
    });

    // Keep aligned while resizing (e.g. dragging textarea bottom-right corner)
    if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver(() => {
            syncGutterHeight();
            syncGutterScroll();
        });
        ro.observe(editor);
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
