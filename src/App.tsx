import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Box, 
  Cpu, 
  Database, 
  Layers, 
  Maximize, 
  Minimize, 
  Play, 
  Pause, 
  RefreshCw, 
  Settings, 
  Zap, 
  Thermometer, 
  Wind, 
  Link as LinkIcon,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { V1Engine } from './simulations/v1';
import { V2Engine } from './simulations/v2';
import { V3Engine } from './simulations/v3';
import { V4Engine } from './simulations/v4';
import { V5Engine } from './simulations/v5';
import { V6Engine } from './simulations/v6';
import { V7Engine } from './simulations/v7';
import { FLUID_MEDIUMS, PERIODIC_TABLE } from './constants/elements';

// --- Types ---
type OptimizerType = 'thermal' | 'electronic' | 'blockchain';
type SimVersion = 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7';

interface SimState {
  nodes: { x: number; y: number; z: number; vx: number; vy: number; vz: number }[];
  complexity: number;
  memorySize: number;
  iterations: number;
}

const SimulationView = ({ activeOptimizer, activeVersion }: { activeOptimizer: OptimizerType; activeVersion: SimVersion }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  
  const v1Ref = useRef<V1Engine | null>(null);
  const v2Ref = useRef<V2Engine | null>(null);
  const v3Ref = useRef<V3Engine | null>(null);
  const v4Ref = useRef<V4Engine | null>(null);
  const v5Ref = useRef<V5Engine | null>(null);
  const v6Ref = useRef<V6Engine | null>(null);
  const v7Ref = useRef<V7Engine | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x00ffcc, 1, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Initialize Engines
    v1Ref.current = new V1Engine(scene);
    v2Ref.current = new V2Engine(scene);
    v3Ref.current = new V3Engine(scene);
    v4Ref.current = new V4Engine(scene);
    v5Ref.current = new V5Engine(scene);
    v6Ref.current = new V6Engine(scene);
    v7Ref.current = new V7Engine(scene);

    // Initial visibility
    v1Ref.current.points.visible = activeVersion === 'v1';
    v1Ref.current.lines.visible = activeVersion === 'v1';
    v2Ref.current.cube.visible = activeVersion === 'v2';
    v3Ref.current.blobs.forEach(b => b.visible = activeVersion === 'v3');
    v4Ref.current.lattice.visible = activeVersion === 'v4';
    v5Ref.current.membrane.visible = activeVersion === 'v5';
    v5Ref.current.points.visible = activeVersion === 'v5';
    v6Ref.current.grid.visible = activeVersion === 'v6';
    v7Ref.current.lattice.visible = activeVersion === 'v7';
    v7Ref.current.flowParticles.visible = activeVersion === 'v7';
    v7Ref.current.heatMap.visible = activeVersion === 'v7';

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      if (activeVersion === 'v1' && v1Ref.current) v1Ref.current.update();
      if (activeVersion === 'v2' && v2Ref.current) v2Ref.current.update();
      if (activeVersion === 'v3' && v3Ref.current) v3Ref.current.update();
      if (activeVersion === 'v4' && v4Ref.current) v4Ref.current.update();
      if (activeVersion === 'v5' && v5Ref.current) v5Ref.current.update();
      if (activeVersion === 'v6' && v6Ref.current) v6Ref.current.update();
      if (activeVersion === 'v7' && v7Ref.current) v7Ref.current.update();

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Expose save/load to window for global access (simplest for this prototype)
    (window as any).saveSimState = async () => {
      let state: any = null;
      if (activeVersion === 'v1') state = v1Ref.current?.saveState();
      if (activeVersion === 'v2') state = v2Ref.current?.saveState();
      if (activeVersion === 'v3') state = v3Ref.current?.saveState();
      if (activeVersion === 'v5') state = v5Ref.current?.saveState();
      
      if (state) {
        await fetch(`/api/sim-state/${activeVersion}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state })
        });
        alert(`State for ${activeVersion} saved!`);
      }
    };

    (window as any).loadSimState = async () => {
      const res = await fetch(`/api/sim-state/${activeVersion}`);
      const state = await res.json();
      if (state && Array.isArray(state)) {
        if (activeVersion === 'v1') v1Ref.current?.loadState(state);
        if (activeVersion === 'v2') v2Ref.current?.loadState(state);
        if (activeVersion === 'v3') v3Ref.current?.loadState(state);
        if (activeVersion === 'v5') v5Ref.current?.loadState(state);
        alert(`State for ${activeVersion} loaded!`);
      } else {
        alert(`No saved state found for ${activeVersion}`);
      }
    };

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      if (containerRef.current && rendererRef.current?.domElement) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      v1Ref.current?.dispose();
      v2Ref.current?.dispose();
      v3Ref.current?.dispose();
      v4Ref.current?.dispose();
      v5Ref.current?.dispose();
      v6Ref.current?.dispose();
      v7Ref.current?.dispose();
    };
  }, []);

  // Update visibility when version changes
  useEffect(() => {
    if (v1Ref.current) {
      v1Ref.current.points.visible = activeVersion === 'v1';
      v1Ref.current.lines.visible = activeVersion === 'v1';
    }
    if (v2Ref.current) {
      v2Ref.current.cube.visible = activeVersion === 'v2';
    }
    if (v3Ref.current) {
      v3Ref.current.blobs.forEach(b => b.visible = activeVersion === 'v3');
    }
    if (v4Ref.current) {
      v4Ref.current.lattice.visible = activeVersion === 'v4';
    }
    if (v5Ref.current) {
      v5Ref.current.membrane.visible = activeVersion === 'v5';
      v5Ref.current.points.visible = activeVersion === 'v5';
    }
    if (v6Ref.current) {
      v6Ref.current.grid.visible = activeVersion === 'v6';
    }
    if (v7Ref.current) {
      v7Ref.current.lattice.visible = activeVersion === 'v7';
      v7Ref.current.flowParticles.visible = activeVersion === 'v7';
      v7Ref.current.heatMap.visible = activeVersion === 'v7';
    }
  }, [activeVersion]);

  // Handle v7 specific updates from window
  useEffect(() => {
    (window as any).setV7Medium = (m: any) => v7Ref.current?.setMedium(m);
    (window as any).setV7Element = (e: any) => v7Ref.current?.setElement(e);
  }, []);

  return <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden bg-black/40 border border-white/10" />;
};

const BlockchainSim = () => {
  const [bits, setBits] = useState<{ time: number; bit: number; freq: number }[]>([]);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [nodes, setNodes] = useState<{ id: string; name: string; ip: string; status: string; load: number; tasks: number }[]>([]);
  const [modulation, setModulation] = useState<'AM' | 'FM' | 'QAM'>('FM');
  const [wavelength, setWavelength] = useState('λ-opt');
  const [ledger, setLedger] = useState<{ timestamp: number; nodeId: string; action: 'ADD' | 'READ'; bit: number }[]>([]);
  const [offloading, setOffloading] = useState(false);

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const res = await fetch('/api/blockchain/nodes');
        const data = await res.json();
        setNodes(data);
      } catch (e) {
        console.error("Node fetch error", e);
      }
    };
    fetchNodes();
    const interval = setInterval(fetchNodes, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTransmitting) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/transmit?mod=${modulation}&wave=${wavelength}`);
          const data = await res.json();
          setBits(prev => [...prev, { time: Date.now(), bit: data.bit, freq: data.freq }].slice(-30));
          if (data.ledger) setLedger(data.ledger);
        } catch (e) {
          console.error("Transmitter error", e);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isTransmitting, modulation, wavelength]);

  const handleOffload = async () => {
    setOffloading(true);
    try {
      const res = await fetch('/api/blockchain/offload', { method: 'POST' });
      const data = await res.json();
      console.log("Offload result:", data);
    } catch (e) {
      console.error("Offload error", e);
    } finally {
      setTimeout(() => setOffloading(false), 1000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
          <LinkIcon size={14} className="text-cyan-400" />
          Multi-Node Temporal Sync
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={handleOffload}
            disabled={offloading}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
              offloading ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'bg-blue-500/20 text-blue-500 border border-blue-500/30 hover:bg-blue-500/40'
            }`}
          >
            {offloading ? 'Offloading...' : 'Offload Task'}
          </button>
          <button 
            onClick={() => setIsTransmitting(!isTransmitting)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
              isTransmitting ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/30'
            }`}
          >
            {isTransmitting ? 'Stop Tx' : 'Start Tx'}
          </button>
        </div>
      </div>

      {/* Node Status Grid */}
      <div className="grid grid-cols-1 gap-1">
        {nodes.map(node => (
          <div key={node.id} className="flex items-center justify-between p-1.5 bg-white/5 rounded border border-white/5 text-[9px]">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${node.status === 'active' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
              <span className="font-mono text-gray-400">{node.ip}</span>
              <span className="text-gray-500 truncate max-w-[80px]">{node.name}</span>
            </div>
            <div className="flex items-center gap-3">
              {node.tasks > 0 && (
                <span className="text-[8px] font-bold text-yellow-500 animate-pulse">[{node.tasks} TASKS]</span>
              )}
              <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${node.load * 100}%` }} />
              </div>
              <span className="font-mono text-cyan-400">{(node.load * 100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="h-32 bg-black/40 rounded-lg border border-white/5 overflow-hidden relative min-h-[128px]">
        <ResponsiveContainer width="100%" height="100%" minHeight={128}>
          <LineChart data={bits}>
            <Line 
              type="stepAfter" 
              dataKey="bit" 
              stroke="#06b6d4" 
              strokeWidth={2} 
              dot={false} 
              isAnimationActive={false}
            />
            <Line 
              type="monotone" 
              dataKey="freq" 
              stroke="#8b5cf6" 
              strokeWidth={1} 
              dot={false} 
              opacity={0.3}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.5em]">
            {modulation} Phase Projection
          </span>
        </div>
      </div>

      {/* Shared Ledger Visualization */}
      <div className="bg-black/20 p-2 rounded border border-white/5 space-y-1">
        <span className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">Shared Ledger (Live)</span>
        <div className="space-y-0.5">
          {ledger.map((entry, i) => (
            <div key={i} className="flex items-center justify-between text-[8px] font-mono">
              <span className="text-gray-500">{new Date(entry.timestamp).toLocaleTimeString()}</span>
              <span className="text-cyan-400">{entry.nodeId}</span>
              <span className={entry.action === 'ADD' ? 'text-green-500' : 'text-blue-500'}>{entry.action}</span>
              <span className="text-white">BIT:{entry.bit}</span>
            </div>
          ))}
          {ledger.length === 0 && <div className="text-center py-2 text-gray-600">Waiting for transmission...</div>}
        </div>
      </div>

      {/* Modulation Controls */}
      <div className="flex gap-2">
        {(['AM', 'FM', 'QAM'] as const).map(m => (
          <button
            key={m}
            onClick={() => setModulation(m)}
            className={`flex-1 py-1 rounded text-[8px] font-bold uppercase border transition-all ${
              modulation === m ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-white/5 border-white/5 text-gray-500'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-white/5 rounded border border-white/5">
          <span className="text-[8px] text-gray-500 uppercase font-bold">Optimal λ</span>
          <p className="text-xs font-mono text-cyan-400">1550.0 nm</p>
        </div>
        <div className="p-2 bg-white/5 rounded border border-white/5">
          <span className="text-[8px] text-gray-500 uppercase font-bold">Throughput</span>
          <p className="text-xs font-mono text-purple-400">{(nodes.filter(n => n.status === 'active').length * 1.0).toFixed(1)} bps</p>
        </div>
      </div>
    </div>
  );
};

const MathBlueprint = ({ type }: { type: OptimizerType }) => {
  const formulas = {
    thermal: {
      title: "Thermal Flow Optimization",
      math: "Q = -k ∇T + ρc_p u · ∇T",
      desc: "Optimizing convective and conductive heat transfer through novelty-mapped lattices. Brute-forcing the Navier-Stokes equations for micro-flows within membranes.",
      constants: "k = 0.026 W/mK (Air), ρ = 1.225 kg/m³, μ = 1.81e-5 Pa·s",
      blueprint: [
        "1. Map 3D Lattice (Gyroid Topology)",
        "2. Define Membrane Boundary (Icosahedron)",
        "3. Brute Force Flow Randomness (Novelty Search)",
        "4. Project 90° Phase Rotation for 3D Render"
      ]
    },
    electronic: {
      title: "Impedance Matching Lattice",
      math: "Z = √(R² + (ωL - 1/ωC)²)",
      desc: "Minimizing signal reflection in 3D printed circuit membranes. Mapping physical sims to material constants to find optimal dielectric properties.",
      constants: "ε_r = 4.4 (FR4), tan δ = 0.02, σ = 5.8e7 S/m (Cu)",
      blueprint: [
        "1. Define Frequency Spectrum (GHz)",
        "2. Map Fractal Lattice for Impedance",
        "3. Brute Force Node Placement",
        "4. 90° Phase Projection for 3D Layout"
      ]
    },
    blockchain: {
      title: "1-bit Frequency-in-Time Protocol",
      math: "H(X) = -Σ p(x) log₂ p(x) | f(t) = sin(ωt + φ)",
      desc: "Encoding data through temporal frequency shifts in throttled environments. Piggybacking off binary traffic using novelty-driven entropy injection.",
      constants: "Baud = 1 bit/cycle, Latency < 10ms, SNR > 12dB",
      blueprint: [
        "1. Initialize Tx/Rx Sync (Google Cloud)",
        "2. Throttled Environment Calibration",
        "3. Frequency-in-Time Encoding",
        "4. 1-bit Novelty Brute Force"
      ]
    }
  };

  const current = formulas[type];

  return (
    <div className="p-6 bg-white/5 rounded-xl border border-white/10 space-y-4">
      <div className="flex items-center gap-2 text-cyan-400">
        <Info size={18} />
        <h3 className="font-bold uppercase tracking-wider text-sm">{current.title}</h3>
      </div>
      <div className="bg-black/40 p-4 rounded-lg font-mono text-xl text-center border border-white/5 overflow-x-auto">
        {current.math}
      </div>
      <p className="text-gray-400 text-sm leading-relaxed">
        {current.desc}
      </p>
      
      <div className="space-y-2 pt-4 border-t border-white/10">
        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">System Blueprint</span>
        <div className="space-y-1">
          {current.blueprint.map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] text-cyan-300/80 font-mono">
              <span className="text-cyan-500/40">[{i+1}]</span>
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-white/10">
        <span className="text-xs text-gray-500 uppercase font-bold">Material Constants</span>
        <p className="text-sm font-mono text-cyan-300/80 mt-1">{current.constants}</p>
      </div>
    </div>
  );
};

export default function App() {
  const [activeOptimizer, setActiveOptimizer] = useState<OptimizerType>('thermal');
  const [activeVersion, setActiveVersion] = useState<SimVersion>('v1');
  const [isSimulating, setIsSimulating] = useState(true);
  const [complexity, setComplexity] = useState(0);
  const [data, setData] = useState<{ time: number; val: number }[]>([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (isSimulating) {
        // Novelty Check API integration
        try {
          const stateHash = Math.random().toString(36).substring(7);
          const res = await fetch('/api/novelty-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stateHash })
          });
          const data = await res.json();
          if (data.unique) {
            setComplexity(data.complexity / 10); // Scale for UI
          }
        } catch (e) {
          setComplexity(prev => Math.min(100, prev + Math.random() * 2));
        }

        setData(prev => {
          const newData = [...prev, { time: prev.length, val: Math.random() * 100 }];
          return newData.slice(-20);
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isSimulating]);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <Activity size={20} className="text-black" />
            </div>
            <h1 className="text-xl font-black tracking-tighter uppercase">BeyondBound</h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
            {(['thermal', 'electronic', 'blockchain'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setActiveOptimizer(type)}
                className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${
                  activeOptimizer === type 
                    ? 'bg-cyan-500 text-black shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {type}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Live Engine</span>
            </div>
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Settings size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Simulation & Controls */}
        <div className="lg:col-span-8 space-y-6">
          <div className="relative aspect-video lg:aspect-auto lg:h-[600px]">
            <SimulationView activeOptimizer={activeOptimizer} activeVersion={activeVersion} />
            
            {/* Overlay Controls */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {/* Version Selector */}
              <div className="bg-black/60 backdrop-blur-md p-1 rounded-lg border border-white/10 flex gap-1 mb-2 overflow-x-auto max-w-[300px] scrollbar-hide">
                {(['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setActiveVersion(v)}
                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                      activeVersion === v 
                        ? 'bg-cyan-500 text-black' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 space-y-3 min-w-[200px]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Brute Force Complexity</span>
                  <span className="text-xs font-mono text-cyan-400">{complexity.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${complexity}%` }}
                    className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsSimulating(!isSimulating)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      title={isSimulating ? 'Pause' : 'Play'}
                    >
                      {isSimulating ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button 
                      onClick={() => setComplexity(0)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      title="Reset Complexity"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => (window as any).saveSimState?.()}
                      className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-[8px] font-bold uppercase tracking-widest transition-colors"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => (window as any).loadSimState?.()}
                      className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-[8px] font-bold uppercase tracking-widest transition-colors"
                    >
                      Load
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="absolute bottom-4 right-4 flex gap-4">
              <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 flex items-center gap-3">
                <Database size={14} className="text-cyan-400" />
                <div className="flex flex-col">
                  <span className="text-[8px] text-gray-500 uppercase font-bold">Memory Nodes</span>
                  <span className="text-xs font-mono">1,024,892</span>
                </div>
              </div>
              <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 flex items-center gap-3">
                <Layers size={14} className="text-cyan-400" />
                <div className="flex flex-col">
                  <span className="text-[8px] text-gray-500 uppercase font-bold">Lattice Depth</span>
                  <span className="text-xs font-mono">128 Layers</span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Zap size={14} className="text-yellow-400" />
                  Entropy Brute Force
                </h3>
                <span className="text-[10px] font-mono text-cyan-400">LIVE_FEED</span>
              </div>
              <div className="h-40 min-h-[160px]">
                <ResponsiveContainer width="100%" height="100%" minHeight={160}>
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', fontSize: '10px' }}
                      itemStyle={{ color: '#06b6d4' }}
                    />
                    <Area type="monotone" dataKey="val" stroke="#06b6d4" fillOpacity={1} fill="url(#colorVal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              {activeOptimizer === 'blockchain' ? (
                <BlockchainSim />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      <Cpu size={14} className="text-purple-400" />
                      System Impedance
                    </h3>
                    <span className="text-[10px] font-mono text-cyan-400">OPTIMIZING...</span>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: 'Phase Shift', val: '90.0°' },
                      { label: 'Flow Velocity', val: '1.24 m/s' },
                      { label: 'Novelty Score', val: '0.982' }
                    ].map((stat, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-black/20 rounded border border-white/5">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">{stat.label}</span>
                        <span className="text-xs font-mono text-cyan-300">{stat.val}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Blueprints & Config */}
        <div className="lg:col-span-4 space-y-6">
          {activeVersion === 'v7' && (
            <div className="p-6 bg-white/5 rounded-xl border border-cyan-500/30 space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                <Activity size={14} />
                Atomic & Fluid Config
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[8px] text-gray-500 uppercase font-bold block mb-1">Crystal Lattice Element</label>
                  <select 
                    onChange={(e) => (window as any).setV7Element(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-[10px] font-mono text-cyan-300 outline-none focus:border-cyan-500/50"
                  >
                    {Object.entries(PERIODIC_TABLE).map(([sym, data]) => (
                      <option key={sym} value={sym}>{data.name} ({sym}) - Z:{data.atomicNumber}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[8px] text-gray-500 uppercase font-bold block mb-1">Simulation Medium</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(FLUID_MEDIUMS).map(([key, data]) => (
                      <button
                        key={key}
                        onClick={() => (window as any).setV7Medium(key)}
                        className="p-2 bg-white/5 border border-white/5 rounded text-[9px] hover:bg-white/10 transition-colors text-left"
                      >
                        <div className="font-bold text-gray-300">{data.name}</div>
                        <div className="text-[8px] text-gray-500 font-mono">ρ: {data.density}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between text-[8px] text-gray-500 uppercase font-bold mb-2">
                    <span>Simulation Layers</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[9px] text-cyan-300/80">
                      <div className="w-2 h-2 rounded-full bg-cyan-500/50 border border-cyan-500" />
                      Lattice Optimization (Crystal)
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-purple-300/80">
                      <div className="w-2 h-2 rounded-full bg-purple-500/50 border border-purple-500" />
                      Turbulence & Flow Cavities
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-red-300/80">
                      <div className="w-2 h-2 rounded-full bg-red-500/50 border border-red-500" />
                      Magnetocaloric Heat Spots
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <MathBlueprint type={activeOptimizer} />

          <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
              <Box size={14} className="text-blue-400" />
              Optimizer Targets
            </h3>
            <div className="space-y-3">
              {[
                { icon: <Thermometer size={16} />, label: 'HVAC Flow Mapping', active: activeOptimizer === 'thermal' },
                { icon: <Wind size={16} />, label: 'Insulation Lattice', active: activeOptimizer === 'thermal' },
                { icon: <Cpu size={16} />, label: 'Circuit Impedance', active: activeOptimizer === 'electronic' },
                { icon: <LinkIcon size={16} />, label: '1-bit Blockchain', active: activeOptimizer === 'blockchain' },
              ].map((item, i) => (
                <div 
                  key={i}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                    item.active 
                      ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' 
                      : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span className="text-xs font-bold">{item.label}</span>
                  </div>
                  <ChevronRight size={14} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 p-6 rounded-xl border border-cyan-500/30">
            <h4 className="text-sm font-black uppercase tracking-tighter mb-2">Generate Blueprint</h4>
            <p className="text-[10px] text-cyan-300/60 leading-relaxed mb-4">
              Export high-fidelity 3D lattice mapping with integrated material constants for production.
            </p>
            <button className="w-full py-3 bg-cyan-500 text-black font-black uppercase tracking-widest text-xs rounded-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform">
              Export CAD/JSON
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12 py-8 bg-black/30">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">
            &copy; 2026 BeyondBound Systems | Deep Learning Physics Engine
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-[10px] text-gray-500 hover:text-white transition-colors uppercase font-bold tracking-widest">Documentation</a>
            <a href="#" className="text-[10px] text-gray-500 hover:text-white transition-colors uppercase font-bold tracking-widest">API Status</a>
            <a href="#" className="text-[10px] text-gray-500 hover:text-white transition-colors uppercase font-bold tracking-widest">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
