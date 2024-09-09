const courseData = {
    nodes: [
        { 
            id: "A", course_name: "CS Course", x: 200, y: 100, spec: ["Specialization 1"], 
            keywords: "Programming, Algorithms, Data Structures, Computational Thinking, Software Development"
        },
        { 
            id: "B", course_name: "Bio Course", x: 300, y: 100, spec: ["Specialization 2"], 
            keywords: "Cell, Genetics, Evolution, Ecology, Microbiology, Animals"
        },
        { 
            id: "C", course_name: "Math Course", x: 300, y: 10 , spec: ["Specialization 1", "Specialization 2", "Specialization 3"],
            keywords: "Algebraic Expressions, Calculus Fundamentals, Geometry Concepts, Statistical Methods, Number Theory, Proof Techniques, Mathematical Modeling, Reasoning and Logic"
        },
        { 
            id: "D", course_name: "Social Science Course", x: 400, y: 100, spec: ["Specialization 2", "Specialization 3"],
            keywords: "Sociology, Anthropology, Political Science, Cultural Studies, Social Theory"
        },
        { 
            id: "E", course_name: "Climate Course", x: 200, y: 200, spec: ["Specialization 2"], 
            keywords: "Climate, Sea Levels, Sustainable Fishing, Climate Modelling, Policy"
        },
        { 
            id: "F", course_name: "Sotware Development Course", x: 400, y: 200, spec: ["Specialization 2"], 
            keywords: "User Experience (UX), Interface Design, Usability Testing, Cognitive Ergonomics, Interaction Design"
        },
        { 
            id: "G", course_name: "CS Data Structure Course", x: 500, y: 200, spec: ["Specialization 3"], 
            keywords: "Graph Theory, Dynamic Programming, Complexity Analysis, Optimization, Data Structures"
        },
        { 
            id: "H", course_name: "Psych Course", x: 200, y: 300, spec: ["Specialization 1"], 
            keywords: "Psychotherapy, Mental Health, Diagnostic Testing, Clinical Assessment, Treatment Planning"
        },
        { 
            id: "I", course_name: "Sociology Course", x: 400, y: 300, spec: ["Specialization 2"], 
            keywords: "Social Structure, Cultural Norms, Socialization, Group Behavior, Social Inequality"
        },
        { 
            id: "J", course_name: "Genetics Course", x: 100, y: 200, spec: ["Specialization 1"], 
            keywords: "Enzymes, Metabolism, Molecular Biology, Proteins, Genetics"
        },
        { 
            id: "L", course_name: "Cybersecurity Course", x: 500, y: 350, spec: ["Specialization 2"], 
            keywords: "Encryption, Cybersecurity, Network Protocols, Firewalls, Intrusion Detection"
        },
        { 
            id: "K", course_name: "Medicine Course", x: 50, y: 125, spec: ["Specialization 1"], 
            keywords: "Healthcare Systems, Public Health, Health Economics, Policy Analysis, Health Law"
        }
    ],
    links: [
        { source: "C", target: "A" },
        { source: "C", target: "B" },
        { source: "C", target: "D" },
        { source: "A", target: "J" },
        { source: "J", target: "H" },
        { source: "B", target: "E" },
        { source: "B", target: "F" },
        { source: "F", target: "I" },
        { source: "D", target: "G" },
        { source: "A", target: "K" },
        { source: "I", target: "L" },
        { source: "D", target: "F" },
        { source: "K", target: "J" }
    ]
};

const specializationData = [
    {id: "1", spec_name: "Specialization 1"},
    {id: "2", spec_name: "Specialization 2"},
    {id: "3", spec_name: "Specialization 3"},
];

const isEmpty = str => !str.trim().length;

// Create Network Base ----------------------------------------
var svg_dimensions   = document.getElementById("course-map-container").getBoundingClientRect(); 

let margin = { 
    top: svg_dimensions.height/10, 
    right: svg_dimensions.width/10, 
    bottom: svg_dimensions.height/10, 
    left: svg_dimensions.width/10
};
let width = svg_dimensions.width - margin.left - margin.right;
let height = svg_dimensions.height - margin.top - margin.bottom;

// Filter by specialization and/or description
var selectedSpec = document.getElementById("spec_dropdown");
var inputDesc = document.getElementById("relDesc");
let filteredCourseData = courseData;

const keywords = inputDesc.value.toLocaleLowerCase().split(", ");

// Create an SVG container
let svg = d3.select("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Add options to specialization dropdown ---------------------
class Specialization {
    static all = [];
    static specContainer = document.getElementById('spec_dropdown');

    constructor({id, spec_name}){
        this.id = id;
        this.spec_name = spec_name;
        Specialization.all.push(this);
    }

    setOption = () => {
        const option = document.createElement('option');
        option.value = this.spec_name;
        option.innerText = this.spec_name;
        return option;
    }

    addToDropdownFilter() {
        Specialization.specContainer.appendChild(this.setOption());
    }
}

specializationData.forEach(d => {
   const spec = new Specialization(d);
   spec.addToDropdownFilter(); 
});

function createNetwork(data) {
    console.log("In createNetwork function");
    // Start with empty container
    svg.selectAll("*").remove();

    // Create links (edges)
    let link = svg.append("g")
    .attr("stroke", "#748ba8")
    .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(data.links)
    .enter().append("line")
    .attr("x1", d => {
        const sourceNode = data.nodes.find(n => n.id === d.source);
        return sourceNode ? sourceNode.x : 0;
    })
    .attr("y1", d => {
        const sourceNode = data.nodes.find(n => n.id === d.source);
        return sourceNode ? sourceNode.y : 0;
    })
    .attr("x2", d => {
        const targetNode = data.nodes.find(n => n.id === d.target);
        return targetNode ? targetNode.x : 0;
    })
    .attr("y2", d => {
        const targetNode = data.nodes.find(n => n.id === d.target);
        return targetNode ? targetNode.y : 0;
    });

    // Create nodes and labels
    let nodes = svg.selectAll("g.node")
    .data(data.nodes)
    .enter().append("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.x}, ${d.y})`)
    .on("click", function(event, d) {
        show_course_info(d, this);
        event.stopPropagation(); // Prevent click from bubbling up to the document
    })
    .on("mouseover", function(event, d) {
        highlight_nodes(d, this);
    })
    .on("mouseout", function() {
        reset_highlighting();
    });

    // Add click event listener to the document
    d3.select(document).on("click", function(event) {
        // Hide course info if the click is outside of the nodes
        if (!d3.select(event.target).classed('node')) {
            hide_course_info();
        }
    });

    // Append circles to the nodes
    nodes.append("circle")
    .attr("r", 15)
    .attr("fill", "#FFFFFF")
    .attr("stroke", "#000000");

    // Append labels to the nodes
    nodes.append("text")
    .attr("text-anchor", "middle")
    .text(d => d.id)
    .attr("font-size", "12px")
    .attr("fill", "#000000")
    .attr("y", 4); 

    function show_course_info(d, clickedNode) {
        var info = document.getElementById("course-info");
        var para = info.querySelectorAll('p');
        para.forEach(function(p) {
            p.remove();
        });

        var list_item = document.createElement('p');
        list_item.className = "course_name";
        list_item.setAttribute("id", d.id);
        list_item.textContent = d.course_name;
        info.appendChild(list_item);

        var list_item = document.createElement('p');
        list_item.className = "spec_name";
        list_item.textContent = d.spec.join(", ");
        info.appendChild(list_item);

        var keywords = document.createElement('p');
        keywords.className = "info_content";
        keywords.textContent = d.keywords;
        info.appendChild(keywords);
    }
    
    // Hide course info when click is outside the nodes
    function hide_course_info() {
        var info = document.getElementById("course-info");
        var para = info.querySelectorAll('p');
        para.forEach(function(p) {
            p.remove();
        })};

    // Highlight nodes and links
    function highlight_nodes(d, clickedNode) {
        // Reset all nodes and links
        reset_highlighting();

        // Highlight the clicked node
        d3.select(clickedNode).select("circle")
            .attr("fill", "#0d1b2a")
            .attr("stroke", "black");

        // Highlight connected nodes
        let connectedNodes = new Set();
        data.links.forEach(l => {
            if (l.source === d.id) {
                connectedNodes.add(l.target);
            }
        });

        svg.selectAll("g.node")
            .select("circle")
            .filter(n => connectedNodes.has(n.id) || n.id === d.id)
            .attr("fill", "#b2c7db")
            .attr("stroke", "black");

        svg.selectAll("g.node")
            .select("text")
            .filter(n => connectedNodes.has(n.id) || n.id === d.id)
            .attr("fill", "black");

        svg.selectAll("line")
            .filter(l => l.source === d.id)
            .attr("stroke", "#0d1b2a")
            .attr("stroke-opacity", 1.0);

    }

    function reset_highlighting() {
        // Reset all nodes and links to default style
        svg.selectAll("circle")
            .attr("fill", "#FFFFFF")
            .attr("stroke", "#000000");
        svg.selectAll("text")
            .attr("fill", "#000000");
        svg.selectAll("line")
            .attr("stroke", "#748ba8")
            .attr("stroke-opacity", 0.6);
    }
};

function onChange() {
    console.log("In onChange function");

    specFilteredCourseData = {...courseData}
    if (selectedSpec.value != "All Specializations") {
        specFilteredCourseData.nodes = specFilteredCourseData.nodes.filter((d) => {
            return d.spec.includes(selectedSpec.value);
        });
        const filteredNodeIds = new Set(specFilteredCourseData.nodes.map(d => d.id));
        specFilteredCourseData.links = courseData.links.filter((link) => {
            return filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target);
        });
    } else {
        specFilteredCourseData = {
            nodes: [...courseData.nodes],
            links: [...courseData.links]
        };
    }

    if (!(isEmpty(document.getElementById("relDesc").value))){
        filterByDescription();
    } else {
        createNetwork(specFilteredCourseData);
    }

    // Clear course info box if nodes not in the network
    var info = document.getElementById("course-info");
    var para = info.querySelectorAll('p');
    if (para.length > 0){
        const nodesNetwork = Array.from(new Set(specFilteredCourseData.nodes.map(d => d.id)));
        if (!(nodesNetwork.includes(para[0].id))){
            para.forEach(function(p) {
                p.remove();
            });        
        }
    }
}

selectedSpec.addEventListener("change", onChange);
onChange();

function filterByDescription() {
    console.log("In filterByDescription function");
    filteredCourseData = {...specFilteredCourseData}
    const userKeywords = inputDesc.value.toLocaleLowerCase().split(", ");
    if (isEmpty(document.getElementById("relDesc").value)){
        onChange();
    } else {
        filteredCourseData.nodes = filteredCourseData.nodes.filter((d) => {
            const courseKeywords = d.keywords.toLocaleLowerCase().split(/[\s,]+/);
            return userKeywords.every(word => courseKeywords.includes(word));
        });
        const filteredNodeIds = new Set(filteredCourseData.nodes.map(d => d.id));
        filteredCourseData.links = filteredCourseData.links.filter((link) => {
            return filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target);
        });
    }

    createNetwork(filteredCourseData);

    // Clear course info box if nodes not in the network
    var info = document.getElementById("course-info");
    var para = info.querySelectorAll('p');
    if (para.length > 0){
        const nodesNetwork = Array.from(new Set(filteredCourseData.nodes.map(d => d.id)));
        if (!(nodesNetwork.includes(para[0].id))){
            para.forEach(function(p) {
                p.remove();
            });        
        }
    }
};

function resetPage() {
    console.log("Resetting coursemap");

    // Reset filter selects
    document.getElementById("spec_dropdown").selectedIndex = 0;
    // Clear selected keywords
    document.getElementById("relDesc").value = "";
    // Clear course info box
    var info = document.getElementById("course-info");
    var para = info.querySelectorAll('p');
    para.forEach(function(p) {
        p.remove();
    });

    // Recreate network
    createNetwork(courseData);
};