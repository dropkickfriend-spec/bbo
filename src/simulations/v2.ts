import * as THREE from 'three';

export class V2Engine {
  scene: THREE.Scene;
  cube: THREE.Group;
  faces: THREE.Mesh[] = [];
  balls: THREE.Points;
  ballData: { position: THREE.Vector3; velocity: THREE.Vector3; faceIndex: number; color: THREE.Color }[] = [];
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.cube = new THREE.Group();
    this.scene.add(this.cube);
    
    const faceGeometry = new THREE.PlaneGeometry(2, 2);
    const faceMaterials = [
      new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.1, side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.1, side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.1, side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.1, side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.1, side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.1, side: THREE.DoubleSide }),
    ];
    
    const facePositions = [
      [1, 0, 0, Math.PI / 2, 0, Math.PI / 2],
      [-1, 0, 0, Math.PI / 2, 0, -Math.PI / 2],
      [0, 1, 0, Math.PI / 2, 0, 0],
      [0, -1, 0, -Math.PI / 2, 0, 0],
      [0, 0, 1, 0, 0, 0],
      [0, 0, -1, 0, Math.PI, 0],
    ];
    
    facePositions.forEach((pos, i) => {
      const face = new THREE.Mesh(faceGeometry, faceMaterials[i]);
      face.position.set(pos[0], pos[1], pos[2]);
      face.rotation.set(pos[3], pos[4], pos[5]);
      this.cube.add(face);
      this.faces.push(face);
    });
    
    const ballGeometry = new THREE.BufferGeometry();
    const ballMaterial = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    
    this.balls = new THREE.Points(ballGeometry, ballMaterial);
    this.cube.add(this.balls);
    
    this.initBalls();
  }
  
  initBalls() {
    this.ballData = [];
    for (let i = 0; i < 300; i++) {
      const faceIndex = Math.floor(Math.random() * 6);
      const facePos = this.faces[faceIndex].position.clone();
      const faceRot = this.faces[faceIndex].rotation.clone();
      
      const localPos = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        0.05
      );
      
      const worldPos = localPos.clone().applyEuler(faceRot).add(facePos);
      
      this.ballData.push({
        position: worldPos,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          0
        ),
        faceIndex,
        color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6)
      });
    }
  }
  
  update() {
    const positions: number[] = [];
    const colors: number[] = [];
    
    this.ballData.forEach(ball => {
      // 90° Phase Rotation for orbit
      const tempX = ball.velocity.x;
      ball.velocity.x = ball.velocity.y;
      ball.velocity.y = -tempX;
      
      // Move within face local coordinates
      const face = this.faces[ball.faceIndex];
      const faceRot = face.rotation.clone();
      const facePos = face.position.clone();
      
      // Convert world position back to local for boundary check
      const localPos = ball.position.clone().sub(facePos).applyEuler(new THREE.Euler(-faceRot.x, -faceRot.y, -faceRot.z));
      
      localPos.x += ball.velocity.x;
      localPos.y += ball.velocity.y;
      
      if (Math.abs(localPos.x) > 1) ball.velocity.x *= -1;
      if (Math.abs(localPos.y) > 1) ball.velocity.y *= -1;
      
      // Convert local back to world
      ball.position.copy(localPos.applyEuler(faceRot).add(facePos));
      
      positions.push(ball.position.x, ball.position.y, ball.position.z);
      colors.push(ball.color.r, ball.color.g, ball.color.b);
    });
    
    this.balls.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.balls.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    this.balls.geometry.attributes.position.needsUpdate = true;
    this.balls.geometry.attributes.color.needsUpdate = true;
    
    this.cube.rotation.y += 0.005;
    this.cube.rotation.x += 0.003;
  }
  
  saveState() {
    return this.ballData.map(b => ({
      p: [b.position.x, b.position.y, b.position.z],
      v: [b.velocity.x, b.velocity.y, b.velocity.z],
      f: b.faceIndex,
      c: b.color.getHex()
    }));
  }
  
  loadState(state: any[]) {
    if (!state || !Array.isArray(state)) return;
    this.ballData = state.map(s => ({
      position: new THREE.Vector3(...s.p),
      velocity: new THREE.Vector3(...s.v),
      faceIndex: s.f,
      color: new THREE.Color(s.c)
    }));
  }
  
  dispose() {
    this.scene.remove(this.cube);
    this.faces.forEach(f => {
      f.geometry.dispose();
      (f.material as THREE.Material).dispose();
    });
    this.balls.geometry.dispose();
    (this.balls.material as THREE.Material).dispose();
  }
}
