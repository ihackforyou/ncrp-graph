// dataProcessing.js

// Global Variables
export let graphData = {
    nodes: [],
    links: [],
  };
  export let originalData = null;
  export let layerFilters = new Set();
  
  // Function to handle file upload
  export function handleFileSelect(event, initializeLayerFilters, processData, updateGraph) {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: false,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function (results) {
          originalData = processCSVData(results.data);
          initializeLayerFilters(originalData);
          processData(originalData);
          updateGraph();
        },
        error: function (err) {
          console.error("Error parsing CSV:", err);
        },
      });
    }
  }
  
  // Function to process CSV data
  export function processCSVData(data) {
    // Column indices mapping
    const columnMapping = {
      serial_no: 0, // Adjust according to your CSV file
      layer: 3,
      txn_date: 14,
      source_ac: 4,
      source_txn_id: 2,
      bene_txn_id: 15,
      bene_ac: 7,
      bene_ifsc: 8,
      txn_amount: 16,
      action: 5,
      bank_name: 6,
    };
  
    const processedData = [];
  
    // Start from the second row to skip header
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
  
      // Create an object based on column indices
      const rowData = {
        serial_no: row[columnMapping.serial_no] || "0",
        layer: row[columnMapping.layer] || "0",
        txn_date: row[columnMapping.txn_date] || "0",
        source_ac: row[columnMapping.source_ac] || "0",
        source_txn_id: row[columnMapping.source_txn_id] || "0",
        bene_txn_id: row[columnMapping.bene_txn_id] || "0",
        bene_ac: row[columnMapping.bene_ac] || "0",
        bene_ifsc: row[columnMapping.bene_ifsc] || "0",
        txn_amount: row[columnMapping.txn_amount] || "0",
        action: row[columnMapping.action] || "0",
        bank_name: row[columnMapping.bank_name] || "0",
      };
  
      // Clean duplicates and handle null values
      for (let key in rowData) {
        if (rowData[key] === null || rowData[key] === undefined) {
          rowData[key] = "0";
        } else if (typeof rowData[key] !== "string") {
          rowData[key] = rowData[key].toString();
        }
  
        const uniqueValues = [...new Set(rowData[key].split(" "))];
        rowData[key] = uniqueValues.join(" ").trim() || "0";
      }
  
      // Extract Reported from bene_ac
      const beneAcValue = rowData.bene_ac ? rowData.bene_ac.toString() : "";
      const beneAcMatch = beneAcValue.match(/\[(.*?)\]/);
      if (beneAcMatch) {
        const reportedNumber = beneAcMatch[1].replace(/\D/g, "");
        rowData.Reported = reportedNumber || "0";
        rowData.bene_ac = beneAcValue.split(" ")[0];
      } else {
        rowData.Reported = "0";
      }
  
      // Check if all values in rowData are '0' (after cleaning)
      const isAllZero = Object.values(rowData).every((value) => value === "0");
  
      if (isAllZero) {
        console.warn(
          `Skipping row with Serial No ${rowData.serial_no} because all values are '0'.`
        );
        continue; // Skip this row
      }
  
      processedData.push(rowData);
    }
  
    return processedData;
  }
  
  // Function to process data and build graphData
  export function processData(data) {
    graphData.nodes = [];
    graphData.links = [];
    const nodeMap = new Map();
  
    data.forEach((d) => {
      // Check for missing critical fields
      if (!d.layer || !d.source_ac || !d.bene_ac) {
        console.warn("Skipping row due to missing data:", d);
        return;
      }
  
      // Ensure layer is a number
      const layerNum = parseInt(d.layer);
      if (isNaN(layerNum)) {
        console.warn("Invalid layer value, skipping row:", d);
        return;
      }
  
      // Apply layer filters
      if (layerFilters.size > 0 && !layerFilters.has(layerNum)) {
        return;
      }
  
      // Convert account numbers to strings
      const sourceAccount = d.source_ac.toString();
      const beneAccount = d.bene_ac.toString();
  
      // Source Node
      if (!nodeMap.has(sourceAccount)) {
        const node = {
          id: sourceAccount,
          layer: layerNum,
          account: sourceAccount,
          transactions: [d.source_txn_id],
          collapsed: false,
        };
        nodeMap.set(sourceAccount, node);
        graphData.nodes.push(node);
      } else {
        nodeMap.get(sourceAccount).transactions.push(d.source_txn_id);
      }
  
      // Beneficiary Node
      if (!nodeMap.has(beneAccount)) {
        const node = {
          id: beneAccount,
          layer: layerNum + 1,
          account: beneAccount,
          transactions: [d.bene_txn_id],
          collapsed: false,
        };
        nodeMap.set(beneAccount, node);
        graphData.nodes.push(node);
      } else {
        nodeMap.get(beneAccount).transactions.push(d.bene_txn_id);
      }
  
      // Link
      graphData.links.push({
        source: nodeMap.get(sourceAccount),
        target: nodeMap.get(beneAccount),
        amount: d.txn_amount,
        txn_date: d.txn_date,
        source_txn_id: d.source_txn_id,
        bene_txn_id: d.bene_txn_id,
      });
    });
  
    // Identify Common Nodes
    const accountCounts = {};
    graphData.nodes.forEach((node) => {
      accountCounts[node.account] = (accountCounts[node.account] || 0) + 1;
    });
    graphData.nodes.forEach((node) => {
      if (accountCounts[node.account] > 1) {
        node.isCommon = true;
      } else {
        node.isCommon = false;
      }
    });
  
    // Group multiple links between the same nodes
    const linkGroupMap = {};
    graphData.links.forEach((link) => {
      const key = link.source.id + "-" + link.target.id;
      if (!linkGroupMap[key]) {
        linkGroupMap[key] = [];
      }
      linkGroupMap[key].push(link);
    });
  
    // Assign link indexes
    for (const key in linkGroupMap) {
      const group = linkGroupMap[key];
      group.forEach((link, index) => {
        link.linkIndex = index;
        link.linkTotal = group.length;
      });
    }
  }
  