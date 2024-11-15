// sidebar.js

import { graphData, layerFilters, originalData } from './dataProcessing.js';
import { updateGraph, isOrgChart, svg, zoom, simulation, svgGroup } from './graph.js';
import { processData } from './dataProcessing.js';
import { exportGraphAsHTML } from './utils.js';

// Initialize Layer Filters
export function initializeLayerFilters(data) {
  const layers = new Set(
    data.map((d) => parseInt(d.layer)).filter((layer) => !isNaN(layer))
  );
  const layerFiltersDiv = document.getElementById("layer-filters");
  layerFiltersDiv.innerHTML = "";
  layerFilters.clear();
  layers.forEach((layer) => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" class="layer-checkbox" data-layer="${layer}" checked /> Layer ${layer}`;
    layerFiltersDiv.appendChild(label);
    layerFilters.add(layer);
  });
  // Event Listeners
  const checkboxes = document.querySelectorAll(".layer-checkbox");
  checkboxes.forEach((cb) => {
    cb.addEventListener("change", function () {
      const layer = parseInt(this.getAttribute("data-layer"));
      if (this.checked) {
        layerFilters.add(layer);
      } else {
        layerFilters.delete(layer);
      }
      processData(originalData);
      updateGraph();
    });
  });
}

// Toggle Side Panel
const sidePanel = document.getElementById("side-panel");
const togglePanelButton = document.getElementById("toggle-panel");
const graphArea = document.getElementById("graph-area");
togglePanelButton.addEventListener("click", function () {
  sidePanel.classList.toggle("hidden");
  if (sidePanel.classList.contains("hidden")) {
    togglePanelButton.style.left = "10px";
    graphArea.classList.add("full-width");
    togglePanelButton.innerHTML = "☰";
  } else {
    togglePanelButton.style.left = "260px";
    graphArea.classList.remove("full-width");
    togglePanelButton.innerHTML = "✕";
  }
});

// Reset Graph
document.getElementById("reset-graph").addEventListener("click", function () {
  isOrgChart.value = false;
  graphData.nodes.forEach((node) => (node.collapsed = false));
  updateGraph();
  svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
  simulation.alpha(1).restart();
});

// Expand All Nodes
document.getElementById("expand-all").addEventListener("click", function () {
  graphData.nodes.forEach((node) => (node.collapsed = false));
  updateGraph();
});

// Collapse All Nodes
document.getElementById("collapse-all").addEventListener("click", function () {
  graphData.nodes.forEach((node) => (node.collapsed = true));
  updateGraph();
});

// Search Functionality
document.getElementById("search-input").addEventListener("input", function () {
  const query = this.value.toLowerCase();
  svgGroup.selectAll(".nodes g").attr("opacity", (d) => {
    return d.account.toLowerCase().includes(query) ||
      d.transactions.some((txn) => txn.toString().includes(query))
      ? 1
      : 0.1;
  });
});

// Organization Chart Button
document.getElementById("org-chart").addEventListener("click", function () {
  isOrgChart.value = true;
  updateGraph();
});

// Export Graph Functionality
document.getElementById("export-graph").addEventListener("click", function () {
  exportGraphAsHTML();
});

// Collapsible Layer Filters
const layersToggle = document.getElementById("layers-toggle");
const layersContent = document.getElementById("layer-filters");
layersToggle.addEventListener("click", function () {
  layersContent.classList.toggle("hidden");
  if (layersContent.classList.contains("hidden")) {
    layersToggle.innerHTML = "Filter by Layers &#9658;";
  } else {
    layersToggle.innerHTML = "Filter by Layers &#9660;";
  }
});
