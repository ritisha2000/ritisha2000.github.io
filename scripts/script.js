// Calculate margins and create the SVG container before the .then() function since it's not dependent on the data.
let svg_dimensions = document.getElementById("course-map-container").getBoundingClientRect();
let margin = { top: svg_dimensions.height / 10, right: svg_dimensions.width / 10, bottom: svg_dimensions.height / 10, left: svg_dimensions.width / 10 };
let width = svg_dimensions.width - margin.left - margin.right;
let height = svg_dimensions.height - margin.top - margin.bottom;

let svg = d3.select("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

d3.json("data/course_data.json").then(function(courseData) {
    // Extract unique course codes and populate dropdown content
    const course_codes = [...new Set(courseData["nodes"].map(item => item.course_subject))].sort();
    const dropdownContent = document.getElementById('dropdown-content');
    
    // Dynamically create checkbox options
    course_codes.forEach((d, index) => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = d;

        // Limit to 3 selections
        checkbox.addEventListener('change', function() {
            const checkedBoxes = document.querySelectorAll('#dropdown-content input[type="checkbox"]:checked');
            
            // Hide course info when checkbox state changes
            hide_course_info(); // Hide course info here

            if (checkedBoxes.length > 3) {
                checkbox.checked = false;
                alert('You can only select up to 3 courses.');
            } else {
                updateButtonText(); // Call the function to update the button text
            }
        });

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(d));
        dropdownContent.appendChild(label);
    });

    // Get selected course codes
    function getSelectedCourseCodes() {
        const checkedBoxes = document.querySelectorAll('#dropdown-content input[type="checkbox"]:checked');
        return Array.from(checkedBoxes).map(cb => cb.value); // Return an array of selected course codes
    }

    // Dropdown and button logic inside the .then() function
    document.getElementById('dropdown-btn').addEventListener('click', function(event) {
        event.stopPropagation();
        dropdownContent.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!dropdownContent.contains(event.target) && !document.getElementById('dropdown-btn').contains(event.target)) {
            dropdownContent.classList.remove('show');
        }
    });

    // Update button text based on selected courses
    function updateButtonText() {
        const selectedCourses = getSelectedCourseCodes(); // Use the getSelectedCourseCodes function
        const btn = document.getElementById('dropdown-btn');

        if (selectedCourses.length > 0) {
            btn.innerText = selectedCourses.join(', ');
        } else {
            btn.innerText = 'Select up to 3 Courses';
        }
    }

    // Create header based on selected course codes and keyword filters
    function createMapHeader(course_codes, keyword_value) {
        const header_div = document.getElementById("main-content-header");

        // Remove previous header
        const header_content = header_div.querySelectorAll('h3');
        header_content.forEach(function(h) {
            h.remove();
        });

        const map_header = document.createElement('h3');
        map_header.className = "map-header";
        map_header.setAttribute("id", "map-header");

        const course_code_text = course_codes.length === 0 || course_codes.includes("All Course Codes")
            ? "All Course Codes"
            : `Filtered for course codes: ${course_codes.join(", ")}`;

        if (course_codes.length === 0 || course_codes.includes("All Course Codes")) {
            if (keyword_value === "") {
                map_header.textContent = `All course codes`;
            } else {
                map_header.textContent = `Filtered for keywords: ${keyword_value}`;
            }
        } else if (keyword_value === "") {
            map_header.textContent = course_code_text;
        } else {
            map_header.textContent = `${course_code_text} and keywords: ${keyword_value}`;
        }

        header_div.appendChild(map_header);
    }

    createMapHeader("All Course Codes", "");

    function createNetwork(courseData) {
        const { nodes, links } = courseData; // Destructure courseData
        console.log("In createNetwork function");
        svg.selectAll("*").remove(); // Clear previous content
    
        // Create links (edges)
        svg.append("g")
            .attr("stroke", "#748ba8")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("x1", d => nodes.find(n => n.course_id === d.source)?.x || 0)
            .attr("y1", d => nodes.find(n => n.course_id === d.source)?.y || 0)
            .attr("x2", d => nodes.find(n => n.course_id === d.target)?.x || 0)
            .attr("y2", d => nodes.find(n => n.course_id === d.target)?.y || 0);
    
        // Create nodes and labels
        let nodeGroup = svg.selectAll("g.node")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.x}, ${d.y})`)
            .on("click", function(event, d) {
                show_course_info(d, this);
                event.stopPropagation(); // Prevent click from bubbling up to the document
            })
            .on("mouseover", event => highlight_nodes(event.currentTarget.__data__, event.currentTarget))
            .on("mouseout", reset_highlighting);
    
        nodeGroup.append("circle")
            .attr("r", 10)
            .attr("fill", "#FFFFFF")
            .attr("stroke", "#FFFFFF");
    
        nodeGroup.append("text")
            .attr("text-anchor", "middle")
            .text(d => d.course_id)
            .attr("font-size", "10px")
            .attr("fill", "#000000")
            .attr("y", 4);
    
        // Show course info function
        function show_course_info(d, clickedNode) {
            const info = document.getElementById("course-info");
            info.innerHTML = ""; // Clear previous info
            const courseInfo = [
                createCourseInfoElement("course_name", d.course_id),
                createCourseInfoElement("section_title", d.section_title),
                createCourseInfoElement("description", d.description)
            ];
            courseInfo.forEach(item => info.appendChild(item));
        }
    
        // Helper function to create course info elements
        function createCourseInfoElement(className, text) {
            const para = document.createElement('p');
            para.className = className;
            para.textContent = text;
            return para;
        }
    
        // Hide course info when clicking outside nodes
        d3.select(document).on("click", function(event) {
            const target = d3.select(event.target);
            
            // Check if the click was outside the nodes and not in the sidebar or header
            if (!target.classed('node') && 
                !target.node().closest('.sidebar') &&  // Check if the click is not in the sidebar
                !target.node().closest('header') &&    // Check if the click is not in the header
                target.node().closest('main.content')) { // Ensure click is in the main content area
                hide_course_info();
            }
        });
    
        // Highlight nodes and links
        function highlight_nodes(d, clickedNode) {
            reset_highlighting(); // Reset all styles before highlighting
            d3.select(clickedNode).select("circle").attr("fill", "#0d1b2a"); // Highlight the clicked node
    
            const connectedSources = new Set(links
                .filter(l => l.target === d.course_id) // Change to filter by target
                .map(l => l.source)); // Get the corresponding sources
            
            svg.selectAll("g.node")
                .select("circle")
                .filter(n => connectedSources.has(n.course_id) || n.course_id === d.course_id) // Highlight sources
                .attr("fill", "#b2c7db"); // Highlight the source nodes
    
            svg.selectAll("g.node")
                .select("text")
                .filter(n => connectedSources.has(n.course_id) || n.course_id === d.course_id)
                .attr("fill", "black");
    
            svg.selectAll("line")
                .filter(l => l.target === d.course_id) // Change to filter by target
                .attr("stroke", "#0d1b2a")
                .attr("stroke-opacity", 1.0);
        }
    
        // Reset highlighting styles
        function reset_highlighting() {
            // Reset all nodes and links to default styles
            svg.selectAll("circle")
                .attr("fill", "#FFFFFF")
                .attr("stroke", "#FFFFFF"); // Ensure the stroke color is also reset
    
            svg.selectAll("text")
                .attr("fill", "#000000");
    
            svg.selectAll("line")
                .attr("stroke", "#748ba8")
                .attr("stroke-opacity", 0.6);
        }
    
        // Ensure reset_highlighting is called on mouse out
        svg.selectAll("g.node")
            .on("mouseout", function() {
                reset_highlighting();
            });
    
        createMapHeader(getSelectedCourseCodes(), document.getElementById("relDesc").value);
    }
    
    // Hide course info function
    function hide_course_info() {
        const info = document.getElementById("course-info");
        info.innerHTML = ""; // Clear previous info
    }

    function isEmpty(value) {
        return !value || value.trim().length === 0;
    }    
    
    var inputDesc = document.getElementById("relDesc");
    let codeFilteredCourseData; // Declare globally

    function onChange() {
        console.log("In onChange function");
        const selectedCourseCodes = getSelectedCourseCodes(); // Get selected course codes
        codeFilteredCourseData = { ...courseData }; // Make a copy of courseData
    
        if (selectedCourseCodes.length > 0) {
            // Filter nodes based on selected course codes
            codeFilteredCourseData.nodes = codeFilteredCourseData.nodes.filter(node =>
                selectedCourseCodes.includes(node.course_subject)
            );
    
            // Create a set of filtered node IDs
            const filteredNodeIds = new Set(codeFilteredCourseData.nodes.map(node => node.course_id));
    
            // Filter links based on filtered nodes
            codeFilteredCourseData.links = courseData.links.filter(link =>
                filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target)
            );
        } else {
            // If no courses are selected, reset to all nodes and links
            codeFilteredCourseData = { ...courseData };
        }
    
        createNetwork(codeFilteredCourseData); // Recreate the network graph
    
        // Clear course info if current course is no longer in the network
        const info = document.getElementById("course-info");
        const displayedCourseId = info.querySelector('p')?.id; // Get the ID of the first paragraph if it exists
    
        if (displayedCourseId && !codeFilteredCourseData.nodes.some(node => node.course_id === displayedCourseId)) {
            info.innerHTML = ""; // Clear course info if not present in the network
        }
    }
    
    // Listen for changes in the custom dropdown checkboxes and call onChange
    document.getElementById('dropdown-content').addEventListener('change', onChange);
    
    // Call onChange initially to set up the network
    onChange();
    
    // Description filter button click event
    document.getElementById("desc_filter_button").addEventListener("click", function() {
        hide_course_info(); // Hide course info when filter is applied

        // Existing code...
        filteredCourseData = { ...codeFilteredCourseData };

        // Get keywords entered by the user and split them into an array
        const userKeywords = inputDesc.value.toLocaleLowerCase().split(", ");

        // If no keywords are entered, call onChange to reset the filtering
        if (isEmpty(inputDesc.value)) {
            onChange();
        } else {
            // Filter nodes by the keywords entered by the user
            filteredCourseData.nodes = filteredCourseData.nodes.filter((d) => {
                if (d.description != null) {
                    const courseKeywords = d.description.toLocaleLowerCase().split(/[\s,]+/)
                        .concat(d.section_title.toLocaleLowerCase().split(/[\s,]+/));
                    return userKeywords.some(word => courseKeywords.includes(word));
                }
                return false; // Ensure a return value even if description is null
            });

            // Create a set of the filtered node IDs
            const filteredNodeIds = new Set(filteredCourseData.nodes.map(d => d.course_id));

            // Filter links to only include those connecting filtered nodes
            filteredCourseData.links = filteredCourseData.links.filter(link => 
                filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target)
            );

            // Recreate the network with the filtered data
            createNetwork(filteredCourseData);

            // Clear the course info box if the displayed course is no longer in the network
            const info = document.getElementById("course-info");
            const para = info.querySelectorAll('p');
            if (para.length > 0) {
                const nodesNetwork = Array.from(new Set(filteredCourseData.nodes.map(d => d.course_id)));
                if (!(nodesNetwork.includes(para[0].id))) {
                    info.innerHTML = ""; // Clear course info if not present in the network
                }
            }
        }
    });        

    document.getElementById("reset_button").addEventListener("click", function() {
        // Reset all checkboxes in the custom dropdown
        const checkboxes = document.querySelectorAll('#dropdown-content input[type="checkbox"]');
        checkboxes.forEach(checkbox => checkbox.checked = false); // Uncheck each checkbox
    
        // Clear selected keywords
        document.getElementById("relDesc").value = "";
    
        // Clear course info box
        const info = document.getElementById("course-info");
        const paragraphs = info.querySelectorAll('p');
        paragraphs.forEach(p => p.remove()); // Remove each paragraph from course info
    
        // Recreate network with all course data
        createNetwork(courseData); // Reset to show all courses
    
        // Update the header to reflect the reset state
        createMapHeader(["All Course Codes"], ""); // Indicate all courses selected
    
        // Clear the display text for selected course codes
        const selectedTextDisplay = document.getElementById("dropdown-btn"); // Ensure this ID is correct
        selectedTextDisplay.textContent = "Select up to 3 Courses"; // Reset to default text
    });
});