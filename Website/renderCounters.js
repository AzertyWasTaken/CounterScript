"use strict";
const counters = document.getElementById("counters");
const countersName = document.getElementById("counters-name");
const countersValue = document.getElementById("counters-value");

export function renderCounters(vars, legend) {
    const entries = Object.entries(vars);
    if (entries.length === 0) {
        counters.style.display = "none";
        return;
    }

    counters.style.display = "table";
    countersName.textContent = "";
    countersValue.textContent = "";

    for (const [key, value] of entries) {
        const nameCell = document.createElement("th");
        nameCell.textContent = legend[key];
        countersName.appendChild(nameCell);

        const valueCell = document.createElement("td");
        valueCell.textContent = value;
        countersValue.appendChild(valueCell);
    }
}