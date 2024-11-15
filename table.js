// table.js

import { originalData } from './dataProcessing.js';

// Function to display data in table
export function displayTable(data) {
  if (!data || !Array.isArray(data)) {
    console.error("No data available to display in the table.");
    return;
  }
  const table = document.getElementById("data-table");
  table.innerHTML = "";

  // Define columns to display
  const columns = [
    "serial_no", // Serial Number from CSV
    "layer",
    "txn_date",
    "source_ac",
    "source_txn_id",
    "bene_txn_id",
    "bene_ac",
    "bene_ifsc",
    "txn_amount",
    "action",
    "bank_name",
    "Reported",
  ];

  // Create table header
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  columns.forEach((col) => {
    const th = document.createElement("th");
    th.innerText = col;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create table body
  const tbody = document.createElement("tbody");

  // Filter out rows where all column values are '0'
  const filteredData = data.filter((row) => {
    // Check if all values in the row are '0'
    return !Object.values(row).every((value) => value === "0");
  });

  filteredData.forEach((row) => {
    const tr = document.createElement("tr");

    columns.forEach((col) => {
      const td = document.createElement("td");
      td.innerText = row[col] || "0";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}

// Event listener for "show-table" button
document.getElementById("show-table").addEventListener("click", function () {
  const tableContainer = document.getElementById("table-container");
  const svgElement = document.getElementById("graph-svg");
  if (tableContainer.style.display === "none" || !tableContainer.style.display) {
    tableContainer.style.display = "block";
    svgElement.style.display = "none";
    displayTable(originalData);
  } else {
    tableContainer.style.display = "none";
    svgElement.style.display = "block";
  }
});
