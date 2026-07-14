import * as THREE from 'three';

export class V3Engine {
  scene: THREE.Scene;
  blobs: THREE.Mesh[] = [];
  blobData: { position: THREE.Vector3; velocity: THREE.Vector3; radius: number; color: THREE.Color }[] = [];
  
  // Physics parameters
  bounce: number = 0.8;
  drag: number = 0.98;
  gravity: number = -0.005;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initBlobs();
  }
  
  initBlobs() {
    this.blobData = [];
    for (let i = 0; i < 50; i++) {
      const radius = 0.1 + Math.random() * 0.2;
      const geometry = new THREE.SphereGeometry(radius, 16, 16);
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
        transparent: true,
        opacity: 0.7,
        shininess: 100
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4
      );
      mesh.position.copy(position);
      this.scene.add(mesh);
      this.blobs.push(mesh);
      
      this.blobData.push({
        position,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1
        ),
        radius,
        color: (material.color as THREE.Color).clone()
      });
    }
  }
  
  update() {
    this.blobData.forEach((blob, i) => {
      // Apply gravity
      blob.velocity.y += this.gravity;
      
      // Apply drag
      blob.velocity.multiplyScalar(this.drag);
      
      // Move
      blob.position.add(blob.velocity);
      
      // Boundary check with bounce
      if (Math.abs(blob.position.x) > 2) {
        blob.position.x = Math.sign(blob.position.x) * 2;
        blob.velocity.x *= -this.bounce;
      }
      if (Math.abs(blob.position.y) > 2) {
        blob.position.y = Math.sign(blob.position.y) * 2;
        blob.velocity.y *= -this.bounce;
      }
      if (Math.abs(blob.position.z) > 2) {
        blob.position.z = Math.sign(blob.position.z) * 2;
        blob.velocity.z *= -this.bounce;
      }
      
      // Collision between blobs
      for (let j = i + 1; j < this.blobData.length; j++) {
        const other = this.blobData[j];
        const dist = blob.position.distanceTo(other.position);
        const minDist = blob.radius + other.radius;
        
        if (dist < minDist) {
          // Simple elastic collision
          const normal = blob.position.clone().sub(other.position).normalize();
          const relativeVelocity = blob.velocity.clone().sub(other.velocity);
          const velocityAlongNormal = relativeVelocity.dot(normal);
          
          if (velocityAlongNormal < 0) {
            const impulse = (2 * velocityAlongNormal) / (1 + 1); // Equal mass
            blob.velocity.sub(normal.clone().multiplyScalar(impulse));
            other.velocity.add(normal.clone().multiplyScalar(impulse));
          }
          
          // Separate blobs to prevent sticking
          const overlap = minDist - dist;
          const separation = normal.multiplyScalar(overlap / 2);
          blob.position.add(separation);
          other.position.sub(separation);
        }
      }
      
      // Update mesh
      this.blobs[i].position.copy(blob.position);
      
      // Dynamic color shift
      const hue = (Date.now() * 0.0001 + i * 0.01) % 1;
      (this.blobs[i].material as THREE.MeshPhongMaterial).color.setHSL(hue, 0.7, 0.5);
    });
  }
  
  saveState() {
    return this.blobData.map(b => ({
      p: [b.position.x, b.position.y, b.position.z],
      v: [b.velocity.x, b.velocity.y, b.velocity.z],
      r: b.radius,
      c: b.color.getHex()
    }));
  }
  
  loadState(state: any[]) {
    if (!state || !Array.isArray(state)) return;
    this.blobData = state.map(s => ({
      position: new THREE.Vector3(...s.p),
      velocity: new THREE.Vector3(...s.v),
      radius: s.r,
      color: new THREE.Color(s.c)
    }));
  }
  
  dispose() {
    this.blobs.forEach(b => {
      this.scene.remove(b);
      b.geometry.dispose();
      (b.material as THREE.Material).dispose();
    });
  }
}
