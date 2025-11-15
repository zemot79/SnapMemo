import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

interface GlobeAnimationProps {
  targetLat: number;
  targetLon: number;
  locationName: string;
  onComplete: () => void;
}

function Earth({ targetLat, targetLon, onComplete }: { targetLat: number; targetLon: number; onComplete: () => void }) {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const markerRef = useRef<THREE.Group>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
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

  const targetPosition = latLonToVector3(targetLat, targetLon, 2.05);

  // Create textures procedurally for a more realistic look
  useEffect(() => {
    if (!earthRef.current) return;

    // Create Earth texture with continents and oceans
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Ocean base
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a1929');
    gradient.addColorStop(0.5, '#1e3a5f');
    gradient.addColorStop(1, '#0a1929');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add some noise for continents
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random();
      if (noise > 0.6) {
        // Land
        data[i] = 34 + noise * 100;     // R
        data[i + 1] = 139 + noise * 50; // G
        data[i + 2] = 34 + noise * 50;  // B
      }
    }
    
    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    if (earthRef.current.material instanceof THREE.MeshStandardMaterial) {
      earthRef.current.material.map = texture;
      earthRef.current.material.needsUpdate = true;
    }
  }, []);

  useFrame(({ camera }) => {
    if (!earthRef.current || !markerRef.current || !cloudsRef.current || !atmosphereRef.current) return;

    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / animationDuration, 1);
    
    // Ease out cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3);

    // Rotate Earth to show target location
    const targetRotationY = -(targetLon * Math.PI) / 180;
    const targetRotationX = (targetLat * Math.PI) / 180;
    
    earthRef.current.rotation.y = targetRotationY * easeProgress;
    earthRef.current.rotation.x = targetRotationX * easeProgress * 0.3;

    // Clouds rotate slightly faster
    cloudsRef.current.rotation.copy(earthRef.current.rotation);
    cloudsRef.current.rotation.y += elapsed * 0.00005;

    // Atmosphere follows Earth
    atmosphereRef.current.rotation.copy(earthRef.current.rotation);

    // Zoom in camera with cinematic movement
    const startZ = 10;
    const endZ = 4;
    const newZ = startZ + (endZ - startZ) * easeProgress;
    camera.position.z = newZ;

    // Slight camera tilt for cinematic effect
    camera.position.y = 0.5 * (1 - easeProgress);

    // Update marker position
    markerRef.current.position.copy(targetPosition);
    markerRef.current.rotation.copy(earthRef.current.rotation);

    // Pulse marker with glow effect
    const pulseScale = 1 + Math.sin(elapsed / 200) * 0.3;
    markerRef.current.scale.set(pulseScale, pulseScale, pulseScale);

    if (progress >= 1) {
      onComplete();
    }
  });

  return (
    <>
      {/* Earth with realistic materials */}
      <mesh ref={earthRef} position={[0, 0, 0]}>
        <sphereGeometry args={[2, 128, 128]} />
        <meshStandardMaterial
          color="#1e3a5f"
          roughness={0.8}
          metalness={0.2}
          emissive="#0a1929"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Bump map overlay for terrain relief */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.01, 128, 128]} />
        <meshStandardMaterial
          color="#2d5a3d"
          roughness={0.9}
          metalness={0.1}
          transparent={true}
          opacity={0.4}
          wireframe={false}
        />
      </mesh>

      {/* Specular layer for ocean reflections */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.02, 64, 64]} />
        <meshStandardMaterial
          color="#3b82f6"
          roughness={0.2}
          metalness={0.8}
          transparent={true}
          opacity={0.3}
          emissive="#1e40af"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Cloud layer */}
      <mesh ref={cloudsRef} position={[0, 0, 0]}>
        <sphereGeometry args={[2.08, 64, 64]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent={true}
          opacity={0.15}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh ref={atmosphereRef} position={[0, 0, 0]}>
        <sphereGeometry args={[2.15, 64, 64]} />
        <meshBasicMaterial
          color="#60a5fa"
          transparent={true}
          opacity={0.15}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer atmosphere rim light */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.2, 64, 64]} />
        <meshBasicMaterial
          color="#93c5fd"
          transparent={true}
          opacity={0.08}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Location marker with glow */}
      <group ref={markerRef}>
        {/* Main marker */}
        <mesh>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={1}
            metalness={0.5}
            roughness={0.2}
          />
        </mesh>
        
        {/* Marker glow */}
        <mesh>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshBasicMaterial
            color="#fca5a5"
            transparent={true}
            opacity={0.4}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Lighting setup for realistic appearance */}
      <ambientLight intensity={0.3} />
      
      {/* Main sunlight */}
      <directionalLight 
        position={[5, 3, 5]} 
        intensity={2}
        color="#ffffff"
      />
      
      {/* Fill light */}
      <directionalLight 
        position={[-3, 1, -3]} 
        intensity={0.5}
        color="#60a5fa"
      />
      
      {/* Rim light */}
      <directionalLight 
        position={[0, 0, -5]} 
        intensity={0.3}
        color="#93c5fd"
      />

      {/* Stars background */}
      <Stars 
        radius={100} 
        depth={60} 
        count={7000} 
        factor={5} 
        saturation={0} 
        fade 
        speed={0.5} 
      />
    </>
  );
}

export const EnhancedGlobeAnimation = ({ targetLat, targetLon, locationName, onComplete }: GlobeAnimationProps) => {
  return (
    <div className="relative w-full h-full bg-black">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        gl={{ 
          antialias: true, 
          alpha: false,
          preserveDrawingBuffer: true,
          powerPreference: "high-performance"
        }}
        onCreated={({ gl }) => {
          gl.setClearColor('#000000', 1);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
        }}
      >
        <Earth targetLat={targetLat} targetLon={targetLon} onComplete={onComplete} />
      </Canvas>
      
      {/* Location name overlay with cinematic style */}
      <div className="absolute bottom-12 left-0 right-0 text-center pointer-events-none">
        <div className="inline-block bg-gradient-to-r from-transparent via-black/80 to-transparent backdrop-blur-md px-12 py-4">
          <p className="text-white text-2xl font-bold tracking-wider drop-shadow-2xl">
            {locationName}
          </p>
        </div>
      </div>

      {/* Vignette overlay for cinematic feel */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.8) 100%)'
        }}
      />
    </div>
  );
};

export default EnhancedGlobeAnimation;
