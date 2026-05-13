"use strict";
import {log} from "./log.js"
import {parse} from "./parser.js";
import {run} from "./execute.js";

const MAX_STEPS = 10000;

const el = {
    // reset: document.getElementById("btn-reset"),
    run: document.getElementById("btn-run"),
    // step: document.getElementById("btn-step"),

    editor: document.getElementById("code-editor"),
    status: document.getElementById("status"),
    output: document.getElementById("output"),
    output_name: document.getElementById("output-name"),
    output_value: document.getElementById("output-value"),
    output_caption: document.getElementById("output-caption"),
}

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

el.run.addEventListener("click", () => {
    const [parsed, legend] = parse(el.editor.value);
    const [halted, ctx] = run(parsed, {maxSteps: MAX_STEPS, deciders: false});

    el.status.innerHTML = halted ? "Halted" : "Timed out";
    updateVarsTable(ctx.vars, legend);
});

// el.step.addEventListener("click", () => {});