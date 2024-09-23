let resetPage;
d3.json("data/course_data.json").then(function(courseData) {
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
    var selectedCourseCode = document.getElementById("course_code_dropdown");
    var inputDesc = document.getElementById("relDesc");
    let filteredCourseData = courseData;

    // Create an SVG container
    let svg = d3.select("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add course codes to course code dropdown
    const course_codes = [...new Set(courseData["nodes"].map(item => item.course_subject))];
    course_codes.forEach(d => {
        codeContainer = document.getElementById('course_code_dropdown');
        const option = document.createElement('option');
        option.value = d;
        option.innerText = d;
        codeContainer.appendChild(option); 
    });

    function createNetwork(courseData) {
        console.log("In createNetwork function");
        // Start with empty container
        svg.selectAll("*").remove();

        // Create links (edges)
        let link = svg.append("g")
        .attr("stroke", "#748ba8")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(courseData.links)
        .enter().append("line")
        .attr("x1", d => {
            const sourceNode = courseData.nodes.find(n => n.course_id === d.source);
            return sourceNode ? sourceNode.x : 0;
        })
        .attr("y1", d => {
            const sourceNode = courseData.nodes.find(n => n.course_id === d.source);
            return sourceNode ? sourceNode.y : 0;
        })
        .attr("x2", d => {
            const targetNode = courseData.nodes.find(n => n.course_id === d.target);
            return targetNode ? targetNode.x : 0;
        })
        .attr("y2", d => {
            const targetNode = courseData.nodes.find(n => n.course_id === d.target);
            return targetNode ? targetNode.y : 0;
        });

        // Create nodes and labels
        let nodes = svg.selectAll("g.node")
        .data(courseData.nodes)
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
        .attr("r", 10)
        .attr("fill", "#FFFFFF")
        .attr("stroke", "#FFFFFF");

        // Append labels to the nodes
        nodes.append("text")
        .attr("text-anchor", "middle")
        .text(d => d.course_id)
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
            list_item.setAttribute("id", d.course_id);
            list_item.textContent = d.course_id;
            info.appendChild(list_item);

            var list_item = document.createElement('p');
            list_item.className = "section_title";
            list_item.textContent = d.section_title;
            info.appendChild(list_item);

            // var x_y = document.createElement('p');
            // x_y.className = "x_y";
            // x_y.textContent = (d.x).toString() + " " + (d.y).toString();
            // info.appendChild(x_y);

            var course_desc = document.createElement('p');
            course_desc.className = "description";
            course_desc.textContent = d.description;
            info.appendChild(course_desc);
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
                .attr("fill", "#0d1b2a");

            // Highlight connected nodes
            let connectedNodes = new Set();
            courseData.links.forEach(l => {
                if (l.source === d.course_id) {
                    connectedNodes.add(l.target);
                }
            });

            svg.selectAll("g.node")
                .select("circle")
                .filter(n => connectedNodes.has(n.course_id) || n.course_id === d.course_id)
                .attr("fill", "#b2c7db");

            svg.selectAll("g.node")
                .select("text")
                .filter(n => connectedNodes.has(n.course_id) || n.course_id === d.course_id)
                .attr("fill", "black");

            svg.selectAll("line")
                .filter(l => l.source === d.course_id)
                .attr("stroke", "#0d1b2a")
                .attr("stroke-opacity", 1.0);

        }

        function reset_highlighting() {
            // Reset all nodes and links to default style
            svg.selectAll("circle")
                .attr("fill", "#FFFFFF")
                .attr("stroke", "#FFFFFF");
            svg.selectAll("text")
                .attr("fill", "#000000");
            svg.selectAll("line")
                .attr("stroke", "#748ba8")
                .attr("stroke-opacity", 0.6);
        }
    };

    function onChange() {
        console.log("In onChange function");

        codeFilteredCourseData = {...courseData}
        if (selectedCourseCode.value != "All Course Codes") {
            codeFilteredCourseData.nodes = codeFilteredCourseData.nodes.filter((d) => {
                return d.course_subject == selectedCourseCode.value;
            });
            const filteredNodeIds = new Set(codeFilteredCourseData.nodes.map(d => d.course_id));
            codeFilteredCourseData.links = courseData.links.filter((link) => {
                return filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target);
            });
        } else {
            codeFilteredCourseData = {
                nodes: [...courseData.nodes],
                links: [...courseData.links]
            };
        }

        if (!(isEmpty(document.getElementById("relDesc").value))){
            filterByDescription();
        } else {
            createNetwork(codeFilteredCourseData);
        }

        // Clear course info box if nodes not in the network
        var info = document.getElementById("course-info");
        var para = info.querySelectorAll('p');
        if (para.length > 0){
            const nodesNetwork = Array.from(new Set(codeFilteredCourseData.nodes.map(d => d.id)));
            if (!(nodesNetwork.includes(para[0].id))){
                para.forEach(function(p) {
                    p.remove();
                });        
            }
        }
    }

    selectedCourseCode.addEventListener("change", onChange);
    onChange();

    document.getElementById("desc_filter_button").addEventListener("click", function(){
        filteredCourseData = {...codeFilteredCourseData}
        const userKeywords = inputDesc.value.toLocaleLowerCase().split(", ");
        if (isEmpty(document.getElementById("relDesc").value)){
            onChange();
        } else {
            filteredCourseData.nodes = filteredCourseData.nodes.filter((d) => {
                if (d.description != null){
                    const courseKeywords = d.description.toLocaleLowerCase().split(/[\s,]+/) + d.section_title.toLocaleLowerCase().split(/[\s,]+/);
                    return userKeywords.every(word => courseKeywords.includes(word));
                }
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
            const nodesNetwork = Array.from(new Set(filteredCourseData.nodes.map(d => d.course_id)));
            if (!(nodesNetwork.includes(para[0].course_id))){
                para.forEach(function(p) {
                    p.remove();
                });        
            }
        }
    });

    document.getElementById("reset_button").addEventListener("click", function(){
        // Reset filter selects
        document.getElementById("course_code_dropdown").selectedIndex = 0;
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
    });
})

function toggleDropdown() {
    document.getElementById("myDropdown").classList.toggle("show");
}

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            const openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}