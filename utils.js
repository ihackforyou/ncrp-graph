// utils.js

// Error Handling for NaN Values
export function handleNaN(value) {
    return isNaN(value) || value === undefined ? 0 : value;
  }
  
  // Utility function to get text width
  export function getTextWidth(text, font) {
    const canvas =
      getTextWidth.canvas ||
      (getTextWidth.canvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
  }
  
  // Function to export graph as HTML
  export function exportGraphAsHTML() {
    // Get the outer HTML of the body
    const htmlContent = document.documentElement.outerHTML;
  
    // Create a Blob from the HTML content
    const blob = new Blob([htmlContent], { type: "text/html" });
  
    // Create a link to download the Blob
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "graph.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  