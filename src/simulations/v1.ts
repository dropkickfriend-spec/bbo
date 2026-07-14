import * as THREE from 'three';

export interface V1Node {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  path: THREE.Vector3[];
  color: THREE.Color;
  noveltyScore: number;
}

export class V1Engine {
  nodes: V1Node[] = [];
  maxNodes: number = 100;
  pathLength: number = 20;
  scene: THREE.Scene;
  points: THREE.Points;
  lines: THREE.LineSegments;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });
    
    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);
    
    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.2
    });
    this.lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    this.scene.add(this.lines);
    
    this.initNodes();
  }
  
  initNodes() {
    this.nodes = [];
    for (let i = 0; i < this.maxNodes; i++) {
      this.nodes.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        ),
        path: [],
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
        noveltyScore: 0
      });
    }
  }
  
  update() {
    const positions: number[] = [];
    const colors: number[] = [];
    const linePositions: number[] = [];
    const lineColors: number[] = [];
    
    this.nodes.forEach(node => {
      // 90° Phase Rotation logic
      const tempX = node.velocity.x;
      node.velocity.x = node.velocity.y;
      node.velocity.y = -tempX;
      
      // Add some randomness/novelty
      node.velocity.x += (Math.random() - 0.5) * 0.001;
      node.velocity.y += (Math.random() - 0.5) * 0.001;
      node.velocity.z += (Math.random() - 0.5) * 0.001;
      
      node.position.add(node.velocity);
      
      // Boundary check
      if (Math.abs(node.position.x) > 2) node.velocity.x *= -1;
      if (Math.abs(node.position.y) > 2) node.velocity.y *= -1;
      if (Math.abs(node.position.z) > 2) node.velocity.z *= -1;
      
      node.path.push(node.position.clone());
      if (node.path.length > this.pathLength) {
        node.path.shift();
      }
      
      positions.push(node.position.x, node.position.y, node.position.z);
      colors.push(node.color.r, node.color.g, node.color.b);
      
      for (let i = 0; i < node.path.length - 1; i++) {
        linePositions.push(
          node.path[i].x, node.path[i].y, node.path[i].z,
          node.path[i+1].x, node.path[i+1].y, node.path[i+1].z
        );
        const alpha = i / node.path.length;
        lineColors.push(
          node.color.r, node.color.g, node.color.b,
          node.color.r, node.color.g, node.color.b
        );
      }
    });
    
    this.points.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.points.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
    
    this.lines.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    this.lines.geometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
    this.lines.geometry.attributes.position.needsUpdate = true;
    this.lines.geometry.attributes.color.needsUpdate = true;
  }
  
  saveState() {
    return this.nodes.map(n => ({
      p: [n.position.x, n.position.y, n.position.z],
      v: [n.velocity.x, n.velocity.y, n.velocity.z],
      c: n.color.getHex()
    }));
  }
  
  loadState(state: any[]) {
    if (!state || !Array.isArray(state)) return;
    this.nodes = state.map(s => ({
      position: new THREE.Vector3(...s.p),
      velocity: new THREE.Vector3(...s.v),
      path: [],
      color: new THREE.Color(s.c),
      noveltyScore: 0
    }));
  }
  
  dispose() {
    this.scene.remove(this.points);
    this.scene.remove(this.lines);
    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
    this.lines.geometry.dispose();
    (this.lines.material as THREE.Material).dispose();
  }
}
