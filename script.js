// Sample data
const graph = {
    nodes: [
        { id: "A" },
        { id: "B" },
        { id: "C" },
        { id: "D" }
    ],
    links: [
        { source: "A", target: "B" },
        { source: "A", target: "C" },
        { source: "B", target: "C" },
        { source: "C", target: "D" }
    ]
};

const svg = d3.select("svg");

// Add links (lines) to the SVG
const link = svg.append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
  .selectAll("line")
  .data(graph.links)
  .join("line")
    .attr("stroke-width", 2);

// Add nodes (circles) to the SVG
const node = svg.append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
  .selectAll("circle")
  .data(graph.nodes)
  .join("circle")
    .attr("r", 10)
    .attr("fill", "blue")
    .call(drag(simulation));

// Add labels to the nodes
const label = svg.append("g")
  .selectAll("text")
  .data(graph.nodes)
  .join("text")
    .attr("x", 12)
    .attr("y", ".31em")
    .text(d => d.id);

// Drag functionality for the nodes
function drag(simulation) {
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
        d.fx = null;
        d.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}
