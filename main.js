// main.js

import { handleFileSelect } from './dataProcessing.js';
import { initializeLayerFilters } from './sidebar.js';
import { processData } from './dataProcessing.js';
import { updateGraph } from './graph.js';
import './sidebar.js'; // To initialize event listeners
import './table.js';   // To initialize event listeners

// Handle File Upload
document
  .getElementById("csv-file")
  .addEventListener("change", (event) => {
    handleFileSelect(event, initializeLayerFilters, processData, updateGraph);
  }, false);
