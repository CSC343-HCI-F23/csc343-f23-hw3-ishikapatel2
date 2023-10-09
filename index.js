// import the GraphClass definiton from GraphClass.js
import GraphClass from './GraphClass.js'; 

var interactiveGraph;
var currentLayout = "force";

/*
    Given some JSON data representing a graph, render it with D3
*/
// dummy commit
function renderGraph(graphData) {
    
    //New object defined in graphview.js
    let graphView = new GraphView("#svgGraph",graphData.nodes,graphData.edges);
    graphView.draw();
    graphView.startSim();
    // graphView.rescale();
    graphView.addClickListener();
    graphView.addDragListener();
    interactiveGraph = graphView;

    const layoutToggle = document.getElementById("toggleLayout");

    layoutToggle.addEventListener("change", function() {
        const selectedLayout = layoutToggle.value;
        
        // Clear the existing graph layout
        d3.select("#svgGraph").selectAll("*").remove();
    
        // Draw the new layout based on the selected value
        if (selectedLayout === "force") {
            //d3.select("#svgGraph").selectAll("*").remove();
            let graphView = new GraphView("#svgGraph",graphData.nodes,graphData.edges);
            graphView.draw();
            graphView.startSim();
            graphView.addClickListener();
            graphView.addDragListener();
            interactiveGraph = graphView;
        } else if (selectedLayout === "circular") {
            //d3.select("#svgGraph").selectAll("*").remove();
            interactiveGraph.drawCircularLayout(); // This calls the method in your graphview.js
            interactiveGraph.addClickListener();
            interactiveGraph.addDragListener();
         } 
         //else if (selectedLayout === "largest") {
        
        // }
    });





        // let nameButton = document.getElementById("showText");
        
        // nameButton.addEventListener("click", () => {
        //     if(graphView.textVisible === false)
        //         graphView.showText();
        //     else 
        //         graphView.removeText();
        // });
}

/*
    Function to fetch the JSON data from output_graph.json & call the renderGraph() method
    to visualize this data
*/
function loadAndRenderGraph(fileName,G) {
    fetch(fileName)
        .then(response => response.json())
        .then(jsonData => {
            G.graph.nodes = jsonData.nodes;
            G.graph.edges = jsonData.edges;
            
            renderGraph(G.graph);
        });

    
}

/*
    A method to compute simple statistics (Programming part Subproblem 6)
    on updated graph data
*/
function displayGraphStatistics(graphObj) {
    //console.log(interactiveGraph);

    let statButton = document.getElementById("computeStats");

    statButton.addEventListener("click", () => {

        if(interactiveGraph){

            let indMap = new Map();
            graphObj.graph.nodes = interactiveGraph.nodes;
            graphObj.graph.edges = interactiveGraph.edges.map(e => {
                return {"source": e.source.id, "target": e.target.id}
            });

            graphObj.graph.nodes.forEach((n, i) => {
                n.degree = 0;
                indMap.set(n.id, i);
            });

            graphObj.graph.edges.forEach(e => {
                graphObj.graph.nodes[indMap.get(e.source)].degree ++;
                graphObj.graph.nodes[indMap.get(e.target)].degree ++;
            });

            let degs = {};
            graphObj.graph.nodes.forEach(n => {
                degs[n.id] = n.degree;
            });
            graphObj.graph.nodeDegrees = degs;

            let avgDeg = graphObj.computeAverageNodeDegree();
            let connectedComponent = graphObj.computeConnectedComponents();
            let density = graphObj.computeGraphDensity();
            let largestConnectedComponent = graphObj.findLargestConnectedComponent();
            let len = largestConnectedComponent.nodes.length
            let graphDiameter = graphObj.findGraphDiameter();

            document.getElementById("avgDegree").innerHTML = avgDeg;
            document.getElementById("numComponents").innerHTML = connectedComponent;
            document.getElementById("graphDensity").innerHTML = density;
            document.getElementById("connectedComponent").textContent = len;
            document.getElementById("graphDiameter").textContent = graphDiameter;
        }

    });

}

const findNodeButton = document.getElementById("find-node-button");
findNodeButton.addEventListener("click", () => {
    const nodeIdInput = document.getElementById("node-id-input").value;
    const nodeToFind = graphObj.graph.nodes.find(node => node.id === nodeIdInput);

    if (nodeToFind) {
        // Center the view on the found node
        interactiveGraph.centerViewOnNode(nodeToFind);

        // Highlight the found node
        interactiveGraph.highlightNode(nodeToFind);
    } else {
        // Handle case when node is not found
        console.log("Node not found");
    }
});


// instantiate an object of GraphClass
let graphObj = new GraphClass();

// your saved graph file from Homework 1
let fileName="output_graph.json";


// render the graph in the browser
loadAndRenderGraph(fileName,graphObj);

// compute and display simple statistics on the graph
displayGraphStatistics(graphObj);


