// orgChart.js

import { graphData, layerFilters } from "./dataProcessing.js";
import { svgGroup, width, height, svg, zoom } from "./graph.js";



export function generateOrgChart() {
  // Clear existing graph
  svgGroup.selectAll("*").remove();

  // Create a new directed graph
  const g = new dagreD3.graphlib.Graph().setGraph({});

  // Add nodes to the graph
  graphData.nodes.forEach((node) => {
    if (layerFilters.has(node.layer)) {
      g.setNode(node.id, {
        label: node.account,
        layer: node.layer,
        class: node.isCommon ? "common-node" : "normal-node",
      });
    }
  });

  // Add edges to the graph
  graphData.links.forEach((link) => {
    if (g.hasNode(link.source.id) && g.hasNode(link.target.id)) {
      g.setEdge(link.source.id, link.target.id, {
        label: link.amount,
        lineInterpolate: "basis",
      });
    }
  });

  // Set layout options
  g.graph().rankdir = "TB"; // Top to Bottom
  g.graph().nodesep = 50; // Node separation
  g.graph().ranksep = 100; // Layer separation

  // Create the renderer
  const render = new dagreD3.render();

  // Apply zoom behavior
  svg.call(zoom.transform, d3.zoomIdentity); // Reset zoom
  svg.call(zoom).on("dblclick.zoom", null); // Disable double-click zoom

  // Render the graph into svgGroup
  render(d3.select("svg g"), g);

  // Adjust SVG size based on the graph size
  const graphWidth = g.graph().width + 40;
  const graphHeight = g.graph().height + 40;
  svg.attr("width", graphWidth);
  svg.attr("height", graphHeight);

  // Center the graph
  const xCenterOffset = (svg.attr("width") - g.graph().width) / 2;
  svgGroup.attr("transform", "translate(" + xCenterOffset + ", 20)");

  // Add click events to nodes and edges
  svgGroup.selectAll("g.node").on("click", function (event, nodeId) {
    const nodeData = g.node(nodeId);
    nodeClicked(event, nodeData);
  });

  svgGroup.selectAll("g.edgeLabel").on("click", function (event, edgeId) {
    const edgeData = g.edge(edgeId.v, edgeId.w);
    linkClicked(event, {
      source: { id: edgeId.v },
      target: { id: edgeId.w },
      amount: edgeData.label,
    });
  });
}

// Node Click Event
function nodeClicked(event, nodeData) {
  // Implement your node click functionality here
  alert("Node clicked: " + nodeData.label);
}

// Link Click Event
function linkClicked(event, edgeData) {
  // Implement your link click functionality here
  alert(
    "Edge clicked from " + edgeData.source.id + " to " + edgeData.target.id
  );
}
