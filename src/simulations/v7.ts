import * as THREE from 'three';
import { FLUID_MEDIUMS, PERIODIC_TABLE } from '../constants/elements';

export class V7Engine {
  scene: THREE.Scene;
  lattice: THREE.LineSegments;
  flowParticles: THREE.Points;
  heatMap: THREE.Points;
  
  latticeSize: number = 10;
  particleCount: number = 2000;
  
  particles: { position: THREE.Vector3; velocity: THREE.Vector3; temperature: number; turbulence: number }[] = [];
  latticeNodes: { position: THREE.Vector3; type: 'atom' | 'bond'; element: string }[] = [];
  
  activeMedium: keyof typeof FLUID_MEDIUMS = 'AIR';
  activeElement: keyof typeof PERIODIC_TABLE = 'Fe';
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    // Lattice
    const latticeGeom = new THREE.BufferGeometry();
    const latticeMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.4 });
    this.lattice = new THREE.LineSegments(latticeGeom, latticeMat);
    this.scene.add(this.lattice);
    
    // Flow Particles
    const flowGeom = new THREE.BufferGeometry();
    const flowMat = new THREE.PointsMaterial({ size: 0.05, vertexColors: true, transparent: true, opacity: 0.8 });
    this.flowParticles = new THREE.Points(flowGeom, flowMat);
    this.scene.add(this.flowParticles);
    
    // Heat Map
    const heatGeom = new THREE.BufferGeometry();
    const heatMat = new THREE.PointsMaterial({ size: 0.15, vertexColors: true, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending });
    this.heatMap = new THREE.Points(heatGeom, heatMat);
    this.scene.add(this.heatMap);
    
    this.initLattice();
    this.initParticles();
  }
  
  initLattice() {
    const positions: number[] = [];
    const colors: number[] = [];
    const step = 4 / (this.latticeSize - 1);
    
    const element = PERIODIC_TABLE[this.activeElement];
    const color = new THREE.Color().setHSL(element.atomicNumber / 118, 0.8, 0.5);
    
    for (let x = 0; x < this.latticeSize; x++) {
      for (let y = 0; y < this.latticeSize; y++) {
        for (let z = 0; z < this.latticeSize; z++) {
          const px = x * step - 2;
          const py = y * step - 2;
          const pz = z * step - 2;
          
          // Create a "weave" pattern (Gyroid-like approximation)
          const g = Math.sin(px * 2) * Math.cos(py * 2) + Math.sin(py * 2) * Math.cos(pz * 2) + Math.sin(pz * 2) * Math.cos(px * 2);
          
          if (Math.abs(g) < 0.2) {
            // Add connections to neighbors
            if (x < this.latticeSize - 1) {
              positions.push(px, py, pz, px + step, py, pz);
              colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
            }
            if (y < this.latticeSize - 1) {
              positions.push(px, py, pz, px, py + step, pz);
              colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
            }
            if (z < this.latticeSize - 1) {
              positions.push(px, py, pz, px, py, pz + step);
              colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
            }
          }
        }
      }
    }
    
    this.lattice.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.lattice.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  }
  
  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        position: new THREE.Vector3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4),
        velocity: new THREE.Vector3(Math.random() * 0.02, (Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01),
        temperature: Math.random(),
        turbulence: 0
      });
    }
  }
  
  update() {
    const medium = FLUID_MEDIUMS[this.activeMedium];
    const element = PERIODIC_TABLE[this.activeElement];
    
    const flowPositions: number[] = [];
    const flowColors: number[] = [];
    const heatPositions: number[] = [];
    const heatColors: number[] = [];
    
    const color = new THREE.Color();
    
    this.particles.forEach(p => {
      // Flow logic
      // Turbulence increases near lattice structures
      const g = Math.sin(p.position.x * 2) * Math.cos(p.position.y * 2) + Math.sin(p.position.y * 2) * Math.cos(p.position.z * 2) + Math.sin(p.position.z * 2) * Math.cos(p.position.x * 2);
      
      const nearSurface = Math.abs(g) < 0.5;
      if (nearSurface) {
        p.turbulence = Math.min(1, p.turbulence + 0.1);
        // Magnetocaloric effect: velocity change affects temperature
        // Cooling if moving fast through magnetic lattice (simplified)
        p.temperature += (p.velocity.length() - 0.01) * 0.1 * (element.atomicNumber / 64);
      } else {
        p.turbulence = Math.max(0, p.turbulence - 0.05);
      }
      
      // Viscosity effect
      const drag = 1 - (medium.viscosity * 100);
      p.velocity.multiplyScalar(drag);
      
      // Flow direction (left to right)
      p.velocity.x += 0.0005 * (1 / medium.density);
      
      // Random jitter for turbulence
      p.velocity.x += (Math.random() - 0.5) * 0.002 * p.turbulence;
      p.velocity.y += (Math.random() - 0.5) * 0.002 * p.turbulence;
      p.velocity.z += (Math.random() - 0.5) * 0.002 * p.turbulence;
      
      p.position.add(p.velocity);
      
      // Boundary check
      if (p.position.x > 2) p.position.x = -2;
      if (p.position.y > 2 || p.position.y < -2) p.position.y *= -0.9;
      if (p.position.z > 2 || p.position.z < -2) p.position.z *= -0.9;
      
      // Flow Visualization
      flowPositions.push(p.position.x, p.position.y, p.position.z);
      // Color by turbulence: cyan to purple
      color.setHSL(0.5 + p.turbulence * 0.3, 0.8, 0.5);
      flowColors.push(color.r, color.g, color.b);
      
      // Heat Visualization (only if hot/cold enough)
      if (p.temperature > 0.7 || p.temperature < 0.3) {
        heatPositions.push(p.position.x, p.position.y, p.position.z);
        // Red for hot, Blue for cold
        color.setHSL(0.6 * (1 - p.temperature), 1.0, 0.5);
        heatColors.push(color.r, color.g, color.b);
      }
    });
    
    this.flowParticles.geometry.setAttribute('position', new THREE.Float32BufferAttribute(flowPositions, 3));
    this.flowParticles.geometry.setAttribute('color', new THREE.Float32BufferAttribute(flowColors, 3));
    this.flowParticles.geometry.attributes.position.needsUpdate = true;
    this.flowParticles.geometry.attributes.color.needsUpdate = true;
    
    this.heatMap.geometry.setAttribute('position', new THREE.Float32BufferAttribute(heatPositions, 3));
    this.heatMap.geometry.setAttribute('color', new THREE.Float32BufferAttribute(heatColors, 3));
    this.heatMap.geometry.attributes.position.needsUpdate = true;
    this.heatMap.geometry.attributes.color.needsUpdate = true;
    
    this.lattice.rotation.y += 0.002;
    this.flowParticles.rotation.y += 0.002;
    this.heatMap.rotation.y += 0.002;
  }
  
  setMedium(medium: keyof typeof FLUID_MEDIUMS) {
    this.activeMedium = medium;
    this.initParticles();
  }
  
  setElement(element: keyof typeof PERIODIC_TABLE) {
    this.activeElement = element;
    this.initLattice();
  }
  
  dispose() {
    this.scene.remove(this.lattice);
    this.scene.remove(this.flowParticles);
    this.scene.remove(this.heatMap);
    this.lattice.geometry.dispose();
    this.flowParticles.geometry.dispose();
    this.heatMap.geometry.dispose();
    (this.lattice.material as THREE.Material).dispose();
    (this.flowParticles.material as THREE.Material).dispose();
    (this.heatMap.material as THREE.Material).dispose();
  }
}
