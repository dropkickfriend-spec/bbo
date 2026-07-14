import * as THREE from 'three';

export class V4Engine {
  scene: THREE.Scene;
  lattice: THREE.Points;
  nodes: { position: THREE.Vector3; color: THREE.Color }[] = [];
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.5
    });
    
    this.lattice = new THREE.Points(geometry, material);
    this.scene.add(this.lattice);
    
    this.initLattice();
  }
  
  initLattice() {
    this.nodes = [];
    const size = 10;
    const step = 0.4;
    for (let x = -size/2; x < size/2; x++) {
      for (let y = -size/2; y < size/2; y++) {
        for (let z = -size/2; z < size/2; z++) {
          // Only keep nodes near the surface of a sphere or specific shape
          const pos = new THREE.Vector3(x * step, y * step, z * step);
          if (pos.length() > 1.8 && pos.length() < 2.2) {
            this.nodes.push({
              position: pos,
              color: new THREE.Color(0x444444)
            });
          }
        }
      }
    }
    
    const positions: number[] = [];
    const colors: number[] = [];
    this.nodes.forEach(n => {
      positions.push(n.position.x, n.position.y, n.position.z);
      colors.push(n.color.r, n.color.g, n.color.b);
    });
    
    this.lattice.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.lattice.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  }
  
  update() {
    // V4 is mostly static but could have some "pulse"
    this.lattice.rotation.y += 0.001;
  }
  
  dispose() {
    this.scene.remove(this.lattice);
    this.lattice.geometry.dispose();
    (this.lattice.material as THREE.Material).dispose();
  }
}
