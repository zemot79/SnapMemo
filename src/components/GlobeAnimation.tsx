import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface GlobeAnimationProps {
  targetLat: number;
  targetLon: number;
  locationName: string;
  onComplete: () => void;
}

function Globe({ targetLat, targetLon, onComplete }: { targetLat: number; targetLon: number; onComplete: () => void }) {
  const globeRef = useRef<THREE.Mesh>(null);
  const markerRef = useRef<THREE.Mesh>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const startTime = useRef(Date.now());
  const animationDuration = 3000; // 3 seconds

  // Convert lat/lon to 3D coordinates on sphere
  const latLonToVector3 = (lat: number, lon: number, radius: number) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
  };

  const targetPosition = latLonToVector3(targetLat, targetLon, 2);

  useFrame(({ camera }) => {
    if (!globeRef.current || !markerRef.current) return;

    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / animationDuration, 1);
    
    // Ease out cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3);

    // Rotate globe to show target location
    const targetRotationY = -(targetLon * Math.PI) / 180;
    const targetRotationX = (targetLat * Math.PI) / 180;
    
    globeRef.current.rotation.y = targetRotationY * easeProgress;
    globeRef.current.rotation.x = targetRotationX * easeProgress * 0.3;

    // Zoom in camera
    const startZ = 8;
    const endZ = 3.5;
    const newZ = startZ + (endZ - startZ) * easeProgress;
    camera.position.z = newZ;

    // Update marker position
    markerRef.current.position.copy(targetPosition);
    markerRef.current.rotation.copy(globeRef.current.rotation);

    // Pulse marker
    const pulseScale = 1 + Math.sin(elapsed / 200) * 0.2;
    markerRef.current.scale.set(pulseScale, pulseScale, pulseScale);

    if (progress >= 1) {
      onComplete();
    }
  });

  return (
    <>
      {/* Globe */}
      <mesh ref={globeRef} position={[0, 0, 0]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          color="#3b82f6"
          roughness={0.7}
          metalness={0.3}
          wireframe={false}
        />
      </mesh>

      {/* Globe wireframe overlay */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.01, 32, 32]} />
        <meshBasicMaterial
          color="#60a5fa"
          wireframe={true}
          transparent={true}
          opacity={0.4}
        />
      </mesh>

      {/* Location marker */}
      <mesh ref={markerRef}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Ambient light */}
      <ambientLight intensity={0.5} />
      
      {/* Main light */}
      <directionalLight position={[5, 3, 5]} intensity={2} />
      <directionalLight position={[-5, -3, -5]} intensity={0.8} />

      {/* Stars */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
    </>
  );
}

export const GlobeAnimation = ({ targetLat, targetLon, locationName, onComplete }: GlobeAnimationProps) => {
  return (
    <div className="relative w-full h-full bg-black" style={{ zIndex: 10 }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ 
          antialias: true, 
          alpha: false,
          preserveDrawingBuffer: true
        }}
        onCreated={({ gl }) => {
          gl.setClearColor('#000000', 1);
        }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <Globe targetLat={targetLat} targetLon={targetLon} onComplete={onComplete} />
      </Canvas>
      
      {/* Location name overlay */}
      <div className="absolute bottom-8 left-0 right-0 text-center z-10">
        <div className="inline-block bg-black/80 backdrop-blur-sm px-8 py-4 rounded-full border border-white/20">
          <p className="text-white text-2xl font-bold drop-shadow-lg">{locationName}</p>
        </div>
      </div>
    </div>
  );
};
