import * as THREE from 'three';

export class V5Engine {
  scene: THREE.Scene;
  membrane: THREE.Mesh;
  walkers: { position: THREE.Vector3; velocity: THREE.Vector3; color: THREE.Color; life: number }[] = [];
  points: THREE.Points;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    const membraneGeo = new THREE.IcosahedronGeometry(2, 4);
    const membraneMat = new THREE.MeshPhongMaterial({
      color: 0x0066ff,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
      emissive: 0x0033ff,
      emissiveIntensity: 0.5
    });
    this.membrane = new THREE.Mesh(membraneGeo, membraneMat);
    this.scene.add(this.membrane);
    
    const pointGeo = new THREE.BufferGeometry();
    const pointMat = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    this.points = new THREE.Points(pointGeo, pointMat);
    this.scene.add(this.points);
    
    this.initWalkers();
  }
  
  initWalkers() {
    this.walkers = [];
    for (let i = 0; i < 200; i++) {
      this.addWalker();
    }
  }
  
  addWalker() {
    const pos = new THREE.Vector3(
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4
    );
    
    // Project onto membrane surface
    pos.normalize().multiplyScalar(2);
    
    this.walkers.push({
      position: pos,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      ),
      color: new THREE.Color().setHSL(0.6, 0.8, 0.5),
      life: 1.0
    });
  }
  
  update() {
    const positions: number[] = [];
    const colors: number[] = [];
    
    this.walkers.forEach((walker, i) => {
      // 90° Phase Rotation for surface flow
      const tempX = walker.velocity.x;
      walker.velocity.x = walker.velocity.y;
      walker.velocity.y = -tempX;
      
      // Move
      walker.position.add(walker.velocity);
      
      // Constrain to membrane surface (Icosahedron radius 2)
      walker.position.normalize().multiplyScalar(2);
      
      // Tension/Repulsion logic
      this.walkers.forEach((other, j) => {
        if (i === j) return;
        const dist = walker.position.distanceTo(other.position);
        if (dist < 0.2) {
          // Repulsion
          const force = walker.position.clone().sub(other.position).normalize().multiplyScalar(0.001);
          walker.velocity.add(force);
        } else if (dist < 0.5) {
          // Tension
          const force = other.position.clone().sub(walker.position).normalize().multiplyScalar(0.0005);
          walker.velocity.add(force);
        }
      });
      
      // Decay life
      walker.life -= 0.001;
      if (walker.life <= 0) {
        // Respawn or eject
        walker.life = 1.0;
        walker.position.set(
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4
        ).normalize().multiplyScalar(2);
      }
      
      positions.push(walker.position.x, walker.position.y, walker.position.z);
      colors.push(walker.color.r * walker.life, walker.color.g * walker.life, walker.color.b * walker.life);
    });
    
    this.points.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.points.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
    
    this.membrane.rotation.y += 0.002;
    this.membrane.rotation.z += 0.001;
  }
  
  saveState() {
    return this.walkers.map(w => ({
      p: [w.position.x, w.position.y, w.position.z],
      v: [w.velocity.x, w.velocity.y, w.velocity.z],
      c: w.color.getHex(),
      l: w.life
    }));
  }
  
  loadState(state: any[]) {
    if (!state || !Array.isArray(state)) return;
    this.walkers = state.map(s => ({
      position: new THREE.Vector3(...s.p),
      velocity: new THREE.Vector3(...s.v),
      color: new THREE.Color(s.c),
      life: s.l
    }));
  }
  
  dispose() {
    this.scene.remove(this.membrane);
    this.scene.remove(this.points);
    this.membrane.geometry.dispose();
    (this.membrane.material as THREE.Material).dispose();
    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}
