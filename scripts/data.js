export const courseData = {
    nodes: [
        { 
            id: "A", x: 300, y: 100, spec: ["Specialization 1"], 
            keywords: "Programming, Algorithms, Data Structures, Computational Thinking, Software Development"
        },
        { 
            id: "B", x: 400, y: 100, spec: ["Specialization 2"], 
            keywords: "Cognition, Behavior, Mental Processes, Developmental Psychology, Social Psychology"
        },
        { 
            id: "C", x: 400, y: 10 , spec: ["Specialization 1", "Specialization 2", "Specialization 3"],
            keywords: "Anatomy, Physiology, Pharmacology, Clinical Practice, Medical Ethics"
        },
        { 
            id: "D", x: 500, y: 100, spec: ["Specialization 2", "Specialization 3"],
            keywords: "Sociology, Anthropology, Political Science, Cultural Studies, Social Theory"
        },
        { 
            id: "E", x: 300, y: 200, spec: ["Specialization 2"], 
            keywords: "Machine Learning, Big Data, Statistical Analysis, Data Mining, Predictive Modeling"
        },
        { 
            id: "F", x: 500, y: 200, spec: ["Specialization 2"], 
            keywords: "User Experience (UX), Interface Design, Usability Testing, Cognitive Ergonomics, Interaction Design"
        },
        { 
            id: "G", x: 600, y: 200, spec: ["Specialization 3"], 
            keywords: "Graph Theory, Dynamic Programming, Complexity Analysis, Optimization, Data Structures"
        },
        { 
            id: "H", x: 300, y: 300, spec: ["Specialization 1"], 
            keywords: "Psychotherapy, Mental Health, Diagnostic Testing, Clinical Assessment, Treatment Planning"
        },
        { 
            id: "I", x: 500, y: 300, spec: ["Specialization 2"], 
            keywords: "Social Structure, Cultural Norms, Socialization, Group Behavior, Social Inequality"
        },
        { 
            id: "J", x: 200, y: 200, spec: ["Specialization 1"], 
            keywords: "Enzymes, Metabolism, Molecular Biology, Proteins, Genetics"
        },
        { 
            id: "L", x: 600, y: 350, spec: ["Specialization 2"], 
            keywords: "Encryption, Cybersecurity, Network Protocols, Firewalls, Intrusion Detection"
        },
        { 
            id: "K", x: 150, y: 125, spec: ["Specialization 1"], 
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

export const specializationData = [
    {id: "1", spec_name: "Specialization 1"},
    {id: "2", spec_name: "Specialization 2"},
    {id: "3", spec_name: "Specialization 3"},
];