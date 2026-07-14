import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // --- Simulation State Memory ---
  const simStates: Record<string, any> = {};
  const simMemory: Set<string> = new Set();
  let complexityCounter = 0;

  app.use(express.json({ limit: '50mb' }));

  // API: Save Simulation State
  app.post("/api/sim-state/:version", (req, res) => {
    const { version } = req.params;
    const { state } = req.body;
    simStates[version] = state;
    res.json({ status: "saved", version });
  });

  // API: Load Simulation State
  app.get("/api/sim-state/:version", (req, res) => {
    const { version } = req.params;
    res.json(simStates[version] || []);
  });

  // API: Novelty Check
  // Brute forces randomness by checking if a state has been seen before
  app.post("/api/novelty-check", (req, res) => {
    const { stateHash } = req.body;
    if (simMemory.has(stateHash)) {
      res.json({ unique: false, message: "State already explored. Iterating..." });
    } else {
      simMemory.add(stateHash);
      complexityCounter++;
      res.json({ 
        unique: true, 
        complexity: complexityCounter,
        memorySize: simMemory.size 
      });
    }
  });

  // --- Blockchain Node Memory ---
  const nodes = [
    { id: "bb-2-2", name: "beyondboundserver2-2", ip: "103.6.171.150", status: "active", load: 0.45, tasks: 0 },
    { id: "bb-1-1", name: "beyondboundserver1-1", ip: "45.151.154.196", status: "active", load: 0.12, tasks: 0 },
    { id: "sc-1", name: "simcolt3server1", ip: "79.108.224.27", status: "throttled", load: 0.89, tasks: 12 },
    { id: "sc-2", name: "sicolt3server2", ip: "45.151.153.185", status: "active", load: 0.34, tasks: 0 },
    { id: "gce-web", name: "quickstart-gce-webhosting", ip: "35.198.237.4", status: "active", load: 0.05, tasks: 0 }
  ];

  const sharedLedger: { timestamp: number; nodeId: string; action: 'ADD' | 'READ'; bit: number }[] = [];

  // API: Get Network Nodes
  app.get("/api/blockchain/nodes", (req, res) => {
    // Simulate dynamic load and task processing
    const dynamicNodes = nodes.map(n => {
      const newLoad = Math.max(0, Math.min(1, n.load + (Math.random() - 0.5) * 0.05));
      if (n.tasks > 0 && Math.random() > 0.7) n.tasks--; // Process tasks
      return { ...n, load: newLoad };
    });
    res.json(dynamicNodes);
  });

  // API: Offload Task
  app.post("/api/blockchain/offload", (req, res) => {
    const activeNodes = nodes.filter(n => n.status === 'active');
    if (activeNodes.length === 0) return res.status(503).json({ error: "No active nodes available" });
    
    // Simple load balancing: find node with least load
    const targetNode = activeNodes.reduce((prev, curr) => prev.load < curr.load ? prev : curr);
    targetNode.tasks++;
    targetNode.load = Math.min(1, targetNode.load + 0.05);
    
    res.json({ status: "Task offloaded", target: targetNode.name, nodeId: targetNode.id });
  });

  // API: 1-bit Blockchain Transmitter
  app.get("/api/transmit", (req, res) => {
    const bit = Math.random() > 0.5 ? 1 : 0;
    const frequency = 100 + Math.random() * 900;
    const modulation = req.query.mod || 'FM';
    const wavelength = req.query.wave || 'λ-opt';
    
    // Pick a random active node to "process" this transmission
    const activeNodes = nodes.filter(n => n.status === 'active');
    const processingNode = activeNodes[Math.floor(Math.random() * activeNodes.length)];
    
    const action = Math.random() > 0.3 ? 'ADD' : 'READ';
    sharedLedger.push({
      timestamp: Date.now(),
      nodeId: processingNode.id,
      action,
      bit
    });
    if (sharedLedger.length > 50) sharedLedger.shift();

    res.json({ 
      bit, 
      frequency, 
      modulation,
      wavelength,
      timestamp: Date.now(),
      status: `Node ${processingNode.name} ${action === 'ADD' ? 'writing' : 'reading'} bit...`,
      activeNodes: activeNodes.length,
      ledger: sharedLedger.slice(-5)
    });
  });

  // API: Optimizer Blueprints
  app.get("/api/blueprints/:type", (req, res) => {
    const { type } = req.params;
    const blueprints = {
      thermal: {
        material: "Aerogel-Infused Lattice",
        k: 0.015,
        meshDensity: "High",
        geometry: "Gyroid Membrane"
      },
      electronic: {
        material: "Silver-Polymer Composite",
        impedance: "50Ω Matching",
        topology: "Fractal Lattice"
      },
      blockchain: {
        protocol: "1-bit Temporal Sync",
        throughput: "1 bps",
        security: "Novelty-Entropy Brute Force"
      }
    };
    res.json(blueprints[type as keyof typeof blueprints] || { error: "Unknown type" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BeyondBound Server running on http://localhost:${PORT}`);
    console.log(`Novelty Engine Initialized. Memory: ${simMemory.size} nodes.`);
  });
}

startServer();
