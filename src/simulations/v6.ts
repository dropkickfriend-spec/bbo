import * as THREE from 'three';

export class V6Engine {
  scene: THREE.Scene;
  grid: THREE.Points;
  gridSize: number = 16;
  nodes: { position: THREE.Vector3; temperature: number; color: THREE.Color }[] = [];
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6
    });
    
    this.grid = new THREE.Points(geometry, material);
    this.scene.add(this.grid);
    
    this.initGrid();
  }
  
  initGrid() {
    this.nodes = [];
    const step = 4 / (this.gridSize - 1);
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        for (let z = 0; z < this.gridSize; z++) {
          const pos = new THREE.Vector3(
            x * step - 2,
            y * step - 2,
            z * step - 2
          );
          
          this.nodes.push({
            position: pos,
            temperature: Math.random(),
            color: new THREE.Color()
          });
        }
      }
    }
    this.updateGeometry();
  }
  
  updateGeometry() {
    const positions: number[] = [];
    const colors: number[] = [];
    this.nodes.forEach(n => {
      positions.push(n.position.x, n.position.y, n.position.z);
      // Heat map color: blue (cold) to red (hot)
      n.color.setHSL(0.6 * (1 - n.temperature), 0.8, 0.5);
      colors.push(n.color.r, n.color.g, n.color.b);
    });
    
    this.grid.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.grid.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    this.grid.geometry.attributes.position.needsUpdate = true;
    this.grid.geometry.attributes.color.needsUpdate = true;
  }
  
  update() {
    // Simple diffusion
    const newTemps = this.nodes.map(n => n.temperature);
    
    // In a real grid we'd check neighbors, here we just do some random flux for demo
    this.nodes.forEach((n, i) => {
      n.temperature += (Math.random() - 0.5) * 0.01;
      n.temperature = Math.max(0, Math.min(1, n.temperature));
    });
    
    this.updateGeometry();
    this.grid.rotation.y += 0.001;
  }
  
  dispose() {
    this.scene.remove(this.grid);
    this.grid.geometry.dispose();
    (this.grid.material as THREE.Material).dispose();
  }
}
