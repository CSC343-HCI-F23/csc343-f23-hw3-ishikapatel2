export default class GraphClass {
  constructor() {
    this.graph = {
      nodes: [],
      edges: [],
      nodeDegrees: {}
    };
  }
  // Problem 6a) Compute average node degree
  computeAverageNodeDegree() {
    let degVals = Object.values(this.graph.nodeDegrees);
    console.log(this.graph.nodeDegrees)
    return degVals.reduce((acc, cur) => acc + cur) / degVals.length;
  }

  // Problem 6b) Number of connected components
  computeConnectedComponents() {
    let indexMap = new Map();
    this.graph.nodes.forEach((v,i) => {
      v.neighbors = [];
      indexMap.set(v.id, i);
    });

    this.graph.edges.forEach(e => {
      let srcInd = indexMap.get(e.source);
      let tgtInd = indexMap.get(e.target);
      this.graph.nodes[srcInd].neighbors.push(tgtInd);
      this.graph.nodes[tgtInd].neighbors.push(srcInd);
    });

    let visted = new Set();
    let traverse = v => {
      visted.add(v);
      let Q = [v];

      while(Q.length > 0){
        let u = Q.pop();
        this.graph.nodes[u].neighbors.forEach(w => {
          if (! visted.has(w)){
            visted.add(w);
            Q.unshift(w);
          }
        });
      };
    };

    let cc = 0;
    this.graph.nodes.forEach((n,i) => {
      if(! visted.has(i)){
        cc += 1;
        traverse(i);
      }
    });

     return cc;
  }

  // Problem 6c) Compute graph density
  computeGraphDensity() {
    let V = this.graph.nodes.length;
    let E = this.graph.edges.length;

    if(V <= 1){
      console.log("Density undefined");
      return 0;
    }

    return 2 * E / (V * (V-1));
  }

  // Problem 2) Find Largest Connected Component
  findLargestConnectedComponent() {
    let visited = new Set();
    let largestComponentNodes = [];

    const bfs = (startNodeId) => {
      let queue = [startNodeId];
      let currentComponentNodes = new Set();
      
      // used ChatGPT to help me write this bfs algorithm
      while (queue.length > 0) {
        let nodeId = queue.shift();
        if (!visited.has(nodeId)) {
          visited.add(nodeId);
          currentComponentNodes.add(nodeId);

          let neighbors = this.graph.edges
            .filter(edge => edge.source === nodeId || edge.target === nodeId)
            .map(edge => edge.source === nodeId ? edge.target : edge.source);

          neighbors.forEach((neighborId) => {
            if (!visited.has(neighborId)) {
              queue.push(neighborId);
            }
          });
        }
      }
      return currentComponentNodes;
    };

    this.graph.nodes.forEach((node) => {
      if (!visited.has(node.id)) {
        let currentComponentNodes = bfs(node.id);

        if (currentComponentNodes.size > largestComponentNodes.length) {
          largestComponentNodes = Array.from(currentComponentNodes);
        }
      }
    });

    return {nodes: largestComponentNodes.map(id => ({ id }))};
  }

  // Problem 3) Compute Graph Diameter
  findGraphDiameter() {
    if (this.graph.nodes.length === 0) {
      return 0;
    }

    const largestComponent = this.findLargestConnectedComponent();
    const nodeIds = new Set(largestComponent.nodes.map(n => n.id));

    let diameter = 0;

    const bfs = (startNodeId) => {
      let visited = new Set();
      let queue = [{nodeId: startNodeId, distance: 0}];

      let maxDistance = 0; 
      while (queue.length > 0) {
        const {nodeId, distance} = queue.shift();
        
        if (!visited.has(nodeId) && nodeIds.has(nodeId)) {
          visited.add(nodeId);
          maxDistance = Math.max(maxDistance, distance);

          // used ChatGTP to help me use filter and map 
          let neighbors = this.graph.edges
            .filter(edge => edge.source === nodeId || edge.target === nodeId)
            .map(edge => edge.source === nodeId ? edge.target : edge.source);

          neighbors.forEach((neighborId) => {
            if (!visited.has(neighborId)) {
              queue.push({nodeId: neighborId, distance: distance + 1});
            }
          });
        }
      }
      return maxDistance;
    };

    // Calculats maximum diameter using BFS for each node
    this.graph.nodes.forEach((node) => {
      if (nodeIds.has(node.id)) {
        let maxDistanceFromNode = bfs(node.id);
        diameter = Math.max(diameter, maxDistanceFromNode);
      }
    });

    return diameter;
  }
  
}
