"use strict";
import {log} from "./log.js"
import {parse} from "./parser.js";
import {run} from "./execute.js";

const MAX_STEPS = 1000000;

const el = {
    // reset: document.getElementById("btn-reset"),
    run: document.getElementById("btn-run"),
    // step: document.getElementById("btn-step"),

    editor: document.getElementById("code-editor"),
    status: document.getElementById("status"),
    output: document.getElementById("output"),
    vars_name: document.getElementById("vars-name"),
    vars_value: document.getElementById("vars-value"),
}

let vars, program;

function updateVarsTable(vars, legend) {
    el.vars_name.textContent = "";
    el.vars_value.textContent = "";

    for (const [key, value] of Object.entries(vars)) {
        const nameCell = document.createElement("th");
        nameCell.textContent = legend[key];
        el.vars_name.appendChild(nameCell);

        const valueCell = document.createElement("td");
        valueCell.textContent = value;
        el.vars_value.appendChild(valueCell);
    }
}

// function reset() {
//     vars = {};
//     program = parse(el.editor);
// }

// el.reset.addEventListener("click", reset);

el.run.addEventListener("click", () => {
    const [parsed, legend] = parse(el.editor.value);
    console.log(legend)
    const [halted, vars, steps] = run(parsed, MAX_STEPS);

    el.status.innerHTML = halted ? "Halted" : "Timed out";
    updateVarsTable(vars, legend);
});

// el.step.addEventListener("click", () => {});