class GraphView{
    #nodeRadius = 5;
    #margin = {"top": 10, "bottom": 10, "left": 10, "right": 10};

    constructor(svgId,nodes,edges) {

        //Need a deep copy so we don't modify the backend data.
        this.nodes = JSON.parse(JSON.stringify(nodes));
        this.edges = JSON.parse(JSON.stringify(edges));

        this.svg = d3.select(svgId);

        let width = this.svg.node().getBoundingClientRect().width;
        let height = this.svg.node().getBoundingClientRect().height;
        this.layer1 = this.svg.append("g");
        this.layer2 = this.layer1.append("g");

        this.sim = d3.forceSimulation(this.nodes)
            .force("link", d3.forceLink(this.edges).id(n => n.id))
            .force("repulse", d3.forceManyBody().strength(-100).distanceMax(50*this.#nodeRadius))
            .force("y", d3.forceY(height / 2).strength(1e-1))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .stop();

        this.calcDegree();
        this.sim.nodes(this.nodes)            

        this.zoomLevel = d3.zoomIdentity;
        this.currentSource = null;
        this.currentTarget = null;
        this.tmpLine = null;

        this.width = width;
        this.height = height;

        this.textVisible = false;

    }

    calcDegree(){
        this.nodes.forEach(n => n.degree = 0);
        this.edges.forEach(e => {
            e.source.degree ++;
            e.target.degree ++;
        });
    }

    showText(){
        this.layer1.selectAll(".names")
            .data(this.nodes, d => d.id)
            .join(
                enter => enter.append("text")
                    .attr("class", "names")
                    .attr("x", d => d.x)
                    .attr("y", d => d.y)
                    .attr("text-anchor", "middle")
                    .attr("font-size", 10)
                    .text(d => d.name),
                update => update.attr("x", d => d.x).attr("y", d => d.y),
            );
        this.textVisible = true;
    }

    removeText(){
        this.layer1.selectAll(".names").remove();
        this.textVisible = false;
    }

    checkText(){
        if(this.textVisible)
            this.showText();
    }

    startSim(){
        let ticked = () => {

            let xbound = x => Math.max(this.#nodeRadius, Math.min(this.width-this.#nodeRadius, x));
            let ybound = y => Math.max(this.#nodeRadius, Math.min(this.height-this.#nodeRadius, y))

            this.layer1.selectAll(".links")
                .attr("x1", e => e.source.x)
                .attr("y1", e => e.source.y)
                .attr("x2", e => e.target.x)
                .attr("y2", e => e.target.y);

            this.layer1.selectAll(".nodes")
                .attr("cx", n => n.x = xbound(n.x))
                .attr("cy", n => n.y = ybound(n.y));   
            
            this.checkText();
               
        }

        this.sim.on('tick', ticked);
        this.sim.restart();        
    }    

    draw(){
        
        this.layer1.selectAll(".links")
            .data(this.edges, e => e.source.id + e.target.id)
            .join(
                enter => 
                    enter.append("line")
                    .attr("class", "links")
                    .attr("x1", e => e.source.x)
                    .attr("y1", e => e.source.y)
                    .attr("x2", e => e.target.x)
                    .attr("y2", e => e.target.y)
                    .attr("stroke", "black")
                    .attr("opacity", 0.5)
                    .attr("transform", this.zoomLevel), 
                update => update, 
                exit => exit
            );

        this.layer1.selectAll(".nodes")
            .data(this.nodes, d => d.id)
            .join(
                enter => 
                    enter.append("circle")
                    .attr("class", "nodes")
                    .attr("cx", n => n.x)
                    .attr("cy", n => n.y)
                    .attr("r", this.#nodeRadius)
                    .attr("fill", "lightblue")
                    .attr("stroke", "black")
                    .attr("transform", this.zoomLevel),
                update => update, 
                exit => exit
            ).raise();

        this.sim.nodes(this.nodes);

        this.sim.alpha(0.5);
        this.sim.restart();

    }

    drawCircularLayout() {
        const n = this.nodes.length;
        const radius = Math.min(this.width, this.height) / 2 - 20; // Calculate radius based on available space

        // Calculate the angle between nodes
        const angleIncrement = (2 * Math.PI) / n;

        // Calculate the center of the SVG container
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        // Loop through the nodes and position them in a circular layout
        for (let i = 0; i < n; i++) {
            const angle = i * angleIncrement;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            this.nodes[i].x = x;
            this.nodes[i].y = y;
    }

    // Redraw the graph with the new circular layout
    this.draw();
      
    }

    rescale(){
        let tthis = this;
        let handleZoom = function(e){
            tthis.zoomLevel = e.transform;
            tthis.svg.selectAll(".links")
                .attr("transform", e.transform);
            tthis.svg.selectAll(".nodes")
                .attr("transform", e.transform);
        };

        let zoom = d3.zoom().scaleExtent([0.005, 10]).on('zoom', handleZoom);

        this.svg.call(zoom);             
    }

    rescale2() {
        var bounds = this.svg.node().getBBox();
        var parent = this.svg.node().parentElement;
        var fullWidth = parent.clientWidth,
          fullHeight = parent.clientHeight;
        var width = bounds.width,
          height = bounds.height;
        var midX = bounds.x + width / 2,
          midY = bounds.y + height / 2;
        if (width == 0 || height == 0) return; // nothing to fit
        var scale = (.9) / Math.max(width / fullWidth, height / fullHeight);
        var translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];
    
        var transform = d3.zoomIdentity
          .translate(translate[0], translate[1])
          .scale(scale);
    
        this.layer1.attr("transform", transform);
      }    

    addClickListener(){
        this.svg.on("click", e => {
            if(this.currentSource)
                return;

            let [x,y] = d3.pointer(e);
            this.nodes.push({
                'id': this.nodes.length.toString(),
                'x': x,
                'y': y
            });
            this.draw();
            this.addDragListener();
        });

        this.layer1.selectAll(".nodes")
            .on("click", () => {});
    }

    addDragListener(){
        var tthis = this;
        this.layer1.selectAll(".nodes")
            .on("mousedown", (e,d) => {
                this.svg.on(".zoom", null);
                this.svg.on("click", null); 

                d.fx = d.x;
                d.fy = d.y;

                let [x,y] = d3.pointer(e);

                this.currentSource = d;
                this.tmpLine = this.layer2.append("line")
                    // .attr("class", "links")
                    .attr("x1", this.currentSource.x)
                    .attr("y1", this.currentSource.y)
                    .attr("x2", x)
                    .attr("y2", y)
                    .attr("stroke", "black")
                    .attr("transform", this.zoomLevel);
            })
            .on("mouseover", function(e,d){
                if (tthis.currentSource){
                    tthis.currentTarget = d;
                    d3.select(this).attr("fill", "red")
                        .attr("r", 10);
                }
                else{
                    d3.select(this).classed("node-highlight", true);
                    d3.selectAll(".links").filter(e => e.source.id === d.id || e.target.id === d.id)
                        .classed("link-highlight", true);
                }
                //document.getElementById("movie-name").innerHTML = d.name;

            })
            .on("mouseout", function(){
                d3.select(this).attr("fill", "lightblue").attr("r", 5).classed("node-highlight", false);
                d3.selectAll(".links").classed("link-highlight", false);
                tthis.currentTarget = null;
                //document.getElementById("movie-name").innerHTML = null;
            });

        this.svg.on("mousemove", e => {
            if(this.currentSource){
                let [x,y] = d3.pointer(e);
                this.tmpLine
                    .attr("x2", x)
                    .attr("y2", y)
                    .attr("transform", this.zoomLevel)
            }
        });

        this.svg.on("mouseup", () => {
            if(this.tmpLine)
                this.tmpLine.remove();

            if(this.currentTarget){

                if(this.currentSource === this.currentTarget){
                    alert("Self loops not allowed");
                    return;
                }
                
                let newEdge = {"source": this.currentSource, "target": this.currentTarget};
                this.edges.forEach(e => {
                    if (newEdge.source.id === e.source.id && newEdge.target.id === e.target.id){
                        alert("edge already exists");
                        return;
                    }else if(newEdge.target.id === e.source.id && newEdge.source.id === e.target.id){
                        alert("edge already exists");
                        return;
                    }
                });

                this.currentSource.fx = null;
                this.currentSource.fy = null;

                this.edges.push(newEdge);
                d3.selectAll(".nodes").attr("fill", "lightblue").attr("r", 5);
                this.draw();
                setTimeout(() => this.addClickListener(), 200);
            }
            
            // this.rescale();
            this.currentSource = null;
            this.currentTarget = null;     
        })
    }

    highlightNode(nodeId) {
        this.layer1.selectAll(".nodes")
            .classed("highlighted-node", d => d.id === nodeId);
    }
    
    unhighlightNodes() {
        this.layer1.selectAll(".nodes")
            .classed("highlighted-node", false);
    }

    searchAndHighlightNode(nodeId) {
        const foundNode = this.nodes.find(node => node.id === nodeId);
    
        if (foundNode) {
            // Highlight the found node
            this.highlightNode(nodeId);
            this.centerViewOnNode(foundNode);
            console.log(`Node ${nodeId} found and highlighted.`);
        } else {
            // Node not found, provide feedback to the user
            console.log(`Node ${nodeId} not found.`);
        }
    }

    centerViewOnNode(node) {
        const { x, y } = node;
        const svgWidth = this.svg.node().getBoundingClientRect().width;
        const svgHeight = this.svg.node().getBoundingClientRect().height;

        // Calculate the translation needed to center the node
        const translateX = svgWidth / 2 - x;
        const translateY = svgHeight / 2 - y;

        // Apply the translation to center the node
        this.layer1.attr("transform", `translate(${translateX}, ${translateY})`);
    }



    
}