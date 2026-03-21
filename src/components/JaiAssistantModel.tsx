// JaiAssistantModel.tsx
import { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  OrbitControls,
  Environment,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "../contexts/ThemeContext";

// ─── Tipos de animación disponibles ──────────────────────────────────────────
export type AssistantMood =
  | "idle"
  | "thinking"
  | "talking"
  | "greeting"
  | "excited";

interface ModelProps {
  mood: AssistantMood;
}

// ─── El modelo 3D con animaciones procedurales ────────────────────────────────
function AssistantMesh({ mood }: ModelProps) {
  const { scene, animations } = useGLTF("/mesh/glb/jai-assistant-model-v2.glb");
  const modelRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const timeRef = useRef(0);

  // Si el GLB trae animaciones propias, las reproducimos
  useEffect(() => {
    if (animations && animations.length > 0 && modelRef.current) {
      mixerRef.current = new THREE.AnimationMixer(modelRef.current);
      animations.forEach((clip) => {
        const action = mixerRef.current!.clipAction(clip);
        action.play();
      });
    }
    return () => {
      mixerRef.current?.stopAllAction();
    };
  }, [animations]);

  // Clona la escena para que no haya conflictos si el componente se monta varias veces
  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => m.clone());
        } else {
          mesh.material = (mesh.material as THREE.Material).clone();
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [scene]);

  useFrame((_, delta) => {
    const mixer = mixerRef.current;
    if (mixer) mixer.update(delta);

    timeRef.current += delta;
    const t = timeRef.current;
    const model = modelRef.current;
    if (!model) return;

    // ── Animaciones procedurales por mood ──────────────────────────────────
    switch (mood) {
      case "idle": {
        // Respiración suave + balanceo lento
        model.position.y = Math.sin(t * 0.8) * 0.02;
        model.rotation.y = Math.sin(t * 0.3) * 0.05;
        model.rotation.z = Math.sin(t * 0.5) * 0.008;
        break;
      }
      case "thinking": {
        // Inclinación lateral + movimiento de "duda"
        model.rotation.z = Math.sin(t * 1.2) * 0.06 + 0.04;
        model.rotation.y = Math.sin(t * 0.6) * 0.12;
        model.position.y = Math.sin(t * 1.5) * 0.015;
        break;
      }
      case "talking": {
        // Micro-movimientos rápidos como al hablar
        model.rotation.y = Math.sin(t * 3.0) * 0.03 + Math.sin(t * 1.7) * 0.02;
        model.rotation.x = Math.sin(t * 2.5) * 0.015;
        model.position.y = Math.sin(t * 2.0) * 0.018;
        model.position.x = Math.sin(t * 2.8) * 0.008;
        break;
      }
      case "greeting": {
        // Saludo: inclinación hacia adelante + rebote
        const greetPhase = (t % 2.5) / 2.5;
        const bow =
          greetPhase < 0.3
            ? greetPhase / 0.3
            : greetPhase < 0.7
              ? 1
              : (1 - greetPhase) / 0.3;
        model.rotation.x = -bow * 0.18;
        model.position.y = Math.sin(t * 4) * 0.025;
        model.rotation.y = Math.sin(t * 0.5) * 0.04;
        break;
      }
      case "excited": {
        // Rebotes y giros rápidos
        model.position.y = Math.abs(Math.sin(t * 5)) * 0.04;
        model.rotation.y += delta * 0.8;
        model.rotation.z = Math.sin(t * 6) * 0.05;
        break;
      }
    }
  });

  return (
    <primitive
      ref={modelRef}
      object={scene}
      scale={0.5}
      position={[0, -0.5, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

// ─── Luces dinámicas según mood ───────────────────────────────────────────────
function DynamicLights({
  mood,
  isDark,
}: {
  mood: AssistantMood;
  isDark: boolean;
}) {
  const lightRef = useRef<THREE.PointLight>(null);
  const light2Ref = useRef<THREE.PointLight>(null);
  const timeRef = useRef(0);

  const moodColors: Record<AssistantMood, { main: string; accent: string }> = {
    idle: {
      main: isDark ? "#4488ff" : "#66aaff",
      accent: isDark ? "#8844ff" : "#aa66ff",
    },
    thinking: {
      main: isDark ? "#ffaa00" : "#ffcc44",
      accent: isDark ? "#ff6600" : "#ff8833",
    },
    talking: {
      main: isDark ? "#00ddff" : "#44eeff",
      accent: isDark ? "#0088ff" : "#22aaff",
    },
    greeting: {
      main: isDark ? "#00ff88" : "#44ffaa",
      accent: isDark ? "#00cc66" : "#22dd88",
    },
    excited: {
      main: isDark ? "#ff44aa" : "#ff66cc",
      accent: isDark ? "#ffaa00" : "#ffcc44",
    },
  };

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;
    if (lightRef.current) {
      lightRef.current.intensity = 1.2 + Math.sin(t * 2) * 0.3;
      lightRef.current.position.x = Math.sin(t * 0.7) * 1.5;
      lightRef.current.position.y = 1.5 + Math.cos(t * 0.5) * 0.3;
    }
    if (light2Ref.current) {
      light2Ref.current.intensity = 0.8 + Math.cos(t * 1.5) * 0.2;
      light2Ref.current.position.x = -Math.sin(t * 0.9) * 1.2;
    }
  });

  return (
    <>
      <ambientLight intensity={isDark ? 0.3 : 0.6} />
      <pointLight
        ref={lightRef}
        color={moodColors[mood].main}
        intensity={1.2}
        position={[1.5, 1.5, 2]}
        distance={6}
      />
      <pointLight
        ref={light2Ref}
        color={moodColors[mood].accent}
        intensity={0.8}
        position={[-1.2, 0.5, 1.5]}
        distance={5}
      />
      <directionalLight
        color={isDark ? "#aaccff" : "#ffffff"}
        intensity={isDark ? 0.5 : 0.8}
        position={[0, 3, 2]}
        castShadow
      />
    </>
  );
}

// ─── Partículas flotantes alrededor del modelo ────────────────────────────────
function FloatingParticles({
  mood,
  isDark,
}: {
  mood: AssistantMood;
  isDark: boolean;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 20;
  const dummy = useRef(new THREE.Object3D());
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2,
      radius: 0.8 + Math.random() * 0.6,
      yBase: (Math.random() - 0.5) * 1.5,
      speed: 0.3 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
      size: 0.02 + Math.random() * 0.03,
    })),
  );

  const moodSpeeds: Record<AssistantMood, number> = {
    idle: 1,
    thinking: 0.5,
    talking: 2,
    greeting: 1.5,
    excited: 3,
  };

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const speedMult = moodSpeeds[mood];
    particles.current.forEach((p, i) => {
      p.angle += 0.005 * p.speed * speedMult;
      const x = Math.cos(p.angle) * p.radius;
      const z = Math.sin(p.angle) * p.radius * 0.5;
      const y = p.yBase + Math.sin(t * p.speed + p.phase) * 0.2;
      dummy.current.position.set(x, y, z);
      const s = p.size * (0.8 + Math.sin(t * 2 + p.phase) * 0.3);
      dummy.current.scale.setScalar(s);
      dummy.current.updateMatrix();
      meshRef.current?.setMatrixAt(i, dummy.current.matrix);
    });
    if (meshRef.current) meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const particleColor = isDark ? "#00ccff" : "#0088cc";

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial
        color={particleColor}
        emissive={particleColor}
        emissiveIntensity={0.6}
        transparent
        opacity={0.7}
      />
    </instancedMesh>
  );
}

// ─── Componente público exportado ─────────────────────────────────────────────
interface JaiAssistantModelProps {
  mood?: AssistantMood;
  side?: "left" | "right";
  className?: string;
}

export function JaiAssistantModel({
  mood = "idle",
  className = "",
}: JaiAssistantModelProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`flex-shrink-0 ${className}`}
      style={{
        width: "280px",
        height: "95%",
        filter: isDark
          ? "drop-shadow(0 0 20px rgba(68,136,255,0.5))"
          : "drop-shadow(0 0 12px rgba(68,136,255,0.25))",
      }}
    >
      <Canvas
        camera={{ position: [0, 1.2, 6.5], fov: 28 }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
        shadows
        gl={{ alpha: true, antialias: true }}
      >
        <DynamicLights mood={mood} isDark={isDark} />
        <FloatingParticles mood={mood} isDark={isDark} />
        <AssistantMesh mood={mood} />
        <ContactShadows
          position={[0, -1.4, 0]}
          opacity={isDark ? 0.4 : 0.2}
          scale={3}
          blur={2}
          far={2}
          color={isDark ? "#001133" : "#aabbcc"}
        />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.8}
          autoRotate={mood === "idle"}
          autoRotateSpeed={0.5}
        />
        <Environment preset={isDark ? "night" : "dawn"} />
      </Canvas>
    </div>
  );
}
useGLTF.preload("/mesh/glb/jai-assistant-model-v2.glb");
