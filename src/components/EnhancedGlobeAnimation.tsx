import { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

interface GlobeAnimationProps {
  targetLat: number;
  targetLon: number;
  locationName: string;
  onComplete: () => void;
}

function EarthObject({
  targetLat,
  targetLon,
  onComplete,
}: {
  targetLat: number;
  targetLon: number;
  onComplete: () => void;
}) {
  const earth = useRef<THREE.Mesh>(null);
  const clouds = useRef<THREE.Mesh>(null);
  const marker = useRef<THREE.Mesh>(null);

  const startTime = useRef(Date.now());
  const duration = 3000;

  const latLonToXYZ = (lat: number, lon: number, r: number) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    return new THREE.Vector3(
      -(r * Math.sin(phi) * Math.cos(theta)),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  };

  const targetPos = latLonToXYZ(targetLat, targetLon, 2.1);

  useEffect(() => {
    if (!earth.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#0a1a2b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const tex = new THREE.CanvasTexture(canvas);
    (earth.current.material as any).map = tex;
  }, []);

  useFrame(({ camera }) => {
    if (!earth.current) return;

    const elapsed = Date.now() - startTime.current;
    const t = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);

    earth.current.rotation.y = -(targetLon * Math.PI) / 180 * ease;
    earth.current.rotation.x = (targetLat / 90) * 0.4 * ease;

    if (clouds.current) clouds.current.rotation.y += 0.0002;

    camera.position.lerp(new THREE.Vector3(0, 0, 5), 0.05);
    camera.lookAt(0, 0, 0);

    if (marker.current) marker.current.position.copy(targetPos);

    if (t >= 1) onComplete();
  });

  return (
    <>
      <mesh ref={earth}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial color={"#1e3a5f"} />
      </mesh>

      <mesh ref={clouds}>
        <sphereGeometry args={[2.05, 64, 64]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.1} />
      </mesh>

      <mesh ref={marker}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#ff3333" emissive="#ff0000" emissiveIntensity={1} />
      </mesh>

      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <Stars radius={80} depth={20} count={3000} />
    </>
  );
}

export default function EnhancedGlobeAnimation({
  targetLat,
  targetLon,
  locationName,
  onComplete,
}: GlobeAnimationProps) {
  return (
    <div className="absolute inset-0 bg-black z-50">
      <Canvas
        camera={{ position: [0, 0, 9], fov: 50 }}
        gl={{
          antialias: true,
          alpha: false,
          depth: true,
          powerPreference: "high-performance",
        }}
      >
        <EarthObject
          targetLat={targetLat}
          targetLon={targetLon}
          onComplete={onComplete}
        />
      </Canvas>

      <div className="absolute bottom-10 w-full text-center text-white text-3xl font-bold drop-shadow-2xl">
        {locationName}
      </div>
    </div>
  );
}
