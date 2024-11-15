// graph.js

import { graphData, layerFilters } from './dataProcessing.js';
import { handleNaN, getTextWidth } from './utils.js';
import { generateOrgChart } from './orgChart.js';

export let isOrgChart = { value: false }; // Use object to allow mutation across modules

// D3.js Setup
export const svg = d3.select("#graph-svg");
export const width = window.innerWidth;
export const height = window.innerHeight;
export const svgGroup = svg.append("g");

// Define arrow markers for graph links
svg
  .append("defs")
  .append("marker")
  .attr("id", "arrow-end")
  .attr("viewBox", "0 -5 10 10")
  .attr("refX", 10)
  .attr("refY", 0)
  .attr("markerWidth", 6)
  .attr("markerHeight", 6)
  .attr("orient", "auto")
  .append("path")
  .attr("d", "M0,-5L10,0L0,5")
  .attr("fill", "#999");

// Zoom and Pan
export const zoom = d3
  .zoom()
  .scaleExtent([0.1, 5])
  .on("zoom", (event) => {
    svgGroup.attr("transform", event.transform);
  });
svg.call(zoom);

// Simulation Setup
export const simulation = d3
  .forceSimulation()
  .force(
    "link",
    d3
      .forceLink()
      .id((d) => d.id)
      .distance(200)
      .strength(1)
  )
  .force("charge", d3.forceManyBody().strength(-400))
  .force("center", d3.forceCenter((width - 250) / 2, height / 2))
  .force("collide", d3.forceCollide(80));

// Update Graph
export function updateGraph() {
  // Clear existing graph
  svgGroup.selectAll("*").remove();

  if (isOrgChart.value) {
    generateOrgChart();
    return;
  }

  // Filter nodes based on collapsed state
  const displayedNodes = graphData.nodes.filter(
    (node) => !node.collapsed && layerFilters.has(node.layer)
  );

  // Create a node map for easy access
  const nodeMap = new Map();
  displayedNodes.forEach((node) => nodeMap.set(node.id, node));

  // Filter links
  const displayedLinks = graphData.links.filter(
    (link) => nodeMap.has(link.source.id) && nodeMap.has(link.target.id)
  );

  // Create link groups
  const linkGroup = svgGroup.append("g").attr("class", "links");

  const linkEnter = linkGroup
    .selectAll(".link-group")
    .data(displayedLinks)
    .enter()
    .append("g")
    .attr("class", "link-group");

  // Create links
  linkEnter
    .append("path")
    .attr("class", "link-line")
    .attr("stroke-width", 2)
    .attr("stroke", (d) => (d.source.y > d.target.y ? "red" : "#999"))
    .attr("fill", "none")
    .on("click", linkClicked);

  // Add amount boxes to links
  const amountGroup = linkEnter
    .append("g")
    .attr("class", "amount-group")
    .on("click", linkClicked);

  amountGroup
    .append("rect")
    .attr("class", "link-label-box")
    .attr("width", (d) => getTextWidth(d.amount.toString(), "10px Arial") + 10)
    .attr("height", 16)
    .attr("rx", 3)
    .attr("ry", 3);

  amountGroup
    .append("text")
    .attr("class", "link-label-text")
    .attr(
      "dx",
      (d) => (getTextWidth(d.amount.toString(), "10px Arial") + 10) / 2
    )
    .attr("dy", 12)
    .text((d) => d.amount);

  // Add arrow markers after amount boxes
  linkEnter
    .append("path")
    .attr("class", "arrow-line")
    .attr("d", "M0,0 L0,0") // Placeholder, will update in ticked()
    .attr("stroke", (d) => (d.source.y > d.target.y ? "red" : "#999"))
    .attr("stroke-width", 2)
    .attr("fill", "none")
    .attr("marker-end", "url(#arrow-end)")
    .on("click", linkClicked);

  // Create nodes
  const node = svgGroup
    .append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(displayedNodes)
    .enter()
    .append("g")
    .call(
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );

  // Draw circles
  node
    .append("circle")
    .attr("r", 20)
    .attr("fill", (d) => (d.isCommon ? "red" : colorByLayer(d.layer)))
    .on("click", nodeClicked);

  // Add layer number inside nodes
  node
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", 4)
    .text((d) => d.layer)
    .on("click", (event, d) => {
      // Copy the layer value to clipboard
      navigator.clipboard
        .writeText(d.layer.toString())
        .then(() => {
          alert("Layer value copied to clipboard");
        })
        .catch((err) => {
          console.error("Could not copy layer value: ", err);
        });
    });

  // Add account number outside nodes
  node
    .append("text")
    .attr("dx", 25)
    .attr("dy", 4)
    .text((d) => d.account);

  simulation.nodes(displayedNodes).on("tick", ticked);

  simulation.force("link").links(displayedLinks);

  simulation.alpha(1).restart();

  function ticked() {
    // Position nodes
    node.attr(
      "transform",
      (d) => `translate(${handleNaN(d.x)},${handleNaN(d.y)})`
    );

    // Position links
    linkEnter.select("path.link-line").attr("d", function (d) {
      const sourceX = handleNaN(d.source.x);
      const sourceY = handleNaN(d.source.y);
      const targetX = handleNaN(d.target.x);
      const targetY = handleNaN(d.target.y);

      const dx = targetX - sourceX;
      const dy = targetY - sourceY;
      const dr = Math.sqrt(dx * dx + dy * dy) || 1e-6;

      // Offset for multiple links between same nodes
      const offset = (d.linkIndex - (d.linkTotal - 1) / 2) * 50;

      // Calculate control point for curved path
      const curveX = (sourceX + targetX) / 2 + (offset * dy) / dr;
      const curveY = (sourceY + targetY) / 2 - (offset * dx) / dr;

      return `M${sourceX},${sourceY} Q${curveX},${curveY} ${targetX},${targetY}`;
    });

    // Position amount boxes along the links
    amountGroup.attr("transform", function (d) {
      const pathEl = d3.select(this.parentNode).select("path").node();
      if (!pathEl) return;

      const pathLength = pathEl.getTotalLength();
      const midPoint = pathEl.getPointAtLength(pathLength / 2);

      // Adjust for multiple links
      const dx = handleNaN(d.target.x) - handleNaN(d.source.x);
      const dy = handleNaN(d.target.y) - handleNaN(d.source.y);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      return (
        "translate(" +
        midPoint.x +
        "," +
        midPoint.y +
        ") " +
        "rotate(" +
        angle +
        ") " +
        "translate(" +
        -((getTextWidth(d.amount.toString(), "10px Arial") + 10) / 2) +
        "," +
        -8 +
        ")"
      );
    });

    // Position arrow markers after amount boxes
    linkEnter.select("path.arrow-line").attr("d", function (d) {
      const pathEl = d3.select(this.parentNode).select("path.link-line").node();
      if (!pathEl) return;

      const pathLength = pathEl.getTotalLength();

      // Get point at the end of the line (after amount box)
      const amountBoxLength =
        getTextWidth(d.amount.toString(), "10px Arial") + 10;
      const boxLength = amountBoxLength + 10; // Include some padding

      const afterBoxPoint = pathEl.getPointAtLength(
        pathLength / 2 + boxLength / 2
      );
      const targetPoint = pathEl.getPointAtLength(pathLength);

      return `M${afterBoxPoint.x},${afterBoxPoint.y} L${targetPoint.x},${targetPoint.y}`;
    });

    // Update link colors based on direction
    linkEnter
      .selectAll("path")
      .attr("stroke", (d) => (d.source.y > d.target.y ? "red" : "#999"));
  }

  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    if (!d.fixed) {
      d.fx = null;
      d.fy = null;
    }
  }
}

// Color Nodes by Layer
function colorByLayer(layer) {
  const colors = d3.schemeCategory10;
  return colors[layer % 10];
}

// Node Click Event
export function nodeClicked(event, d) {
  d.collapsed = !d.collapsed;
  updateGraph();
}

// Link Click Event
export function linkClicked(event, d) {
  // Create a new modal
  const modalContainer = document.getElementById("modal-container");
  const modal = document.createElement("div");
  modal.classList.add("modal");

  modal.innerHTML = `
      <div class="modal-content">
        <span class="modal-close">&times;</span>
        <div class="modal-body">
          <h3>Transaction Details</h3>
          <p><strong>Source Account:</strong> ${d.source.id}</p>
          <p><strong>Beneficiary Account:</strong> ${d.target.id}</p>
          <p><strong>Amount:</strong> ${d.amount}</p>
          <p><strong>Date:</strong> ${d.txn_date}</p>
          <p><strong>Source Txn ID:</strong> ${d.source_txn_id}</p>
          <p><strong>Beneficiary Txn ID:</strong> ${d.bene_txn_id}</p>
        </div>
      </div>
    `;

  // Close button functionality
  modal.querySelector(".modal-close").addEventListener("click", function () {
    modalContainer.removeChild(modal);
  });

  modalContainer.appendChild(modal);
}
