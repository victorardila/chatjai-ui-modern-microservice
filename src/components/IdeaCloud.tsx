import { motion, AnimatePresence } from "framer-motion";
import { Idea } from "../types/chat";
import { useTheme } from "../contexts/ThemeContext";
import { X, Eye, EyeOff } from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

interface IdeaCloudProps {
  ideas: Idea[];
  isVisible: boolean;
  onToggleVisibility: () => void;
  onSelectIdea: (ideaId: string) => void;
}

function solidColor(rgba: string): string {
  return rgba.replace(/,\s*[\d.]+\)$/, ", 1)");
}

type Category =
  | "instruction"
  | "creation"
  | "analysis"
  | "knowledge"
  | "problem"
  | "interaction"
  | "meta"
  | "context"
  | "general";

function classifyPrompt(text: string): Category {
  const t = text.toLowerCase();
  if (
    /(a partir de ahora|desde ahora|en adelante|responde (siempre|solo|en)|usa (un tono|formato)|no incluyas|no uses|corrige tu|en tu respuesta anterior|cambia (el tono|el formato)|comporta(te)?|instrucción global)/.test(
      t,
    )
  )
    return "meta";
  if (
    /(voy a (darte|compartir|enviarte)|antes de (empezar|comenzar)|mi contexto|actúa como|eres un|eres una|finge que eres|imagina que eres|te daré|¿entendido|toma nota de)/.test(
      t,
    )
  )
    return "context";
  if (
    /(hablemos|platiquemos|conversemos|juguemos|finjamos|roleplay|rol|como si fuera(s|mos)|practiq|entrena|acompáñame|cuéntame algo|¿cómo estás|hola|buenos días|buenas tardes|¿funcionas)/.test(
      t,
    )
  )
    return "interaction";
  if (
    /(resuelve|soluciona|ayúdame (a resolver|con este (error|bug|problema))|cómo (arreglo|corrijo|depuro|optimizo|soluciono)|tengo un (error|bug|problema)|optimiza (esta|el)|encuentra la solución|paso a paso para|debug|ecuación|algoritmo para)/.test(
      t,
    )
  )
    return "problem";
  if (
    /(analiza|evalúa|evalua|critica|compara|contrasta|encuentra (fallos|errores|sesgos|problemas)|pros y contras|ventajas y desventajas|¿qué sesgos|revisa (este|esta)|qué (piensas|opinas) (de|sobre)|¿es correcto|¿está bien)/.test(
      t,
    )
  )
    return "analysis";
  if (
    /(escribe (un|una|el|la)|crea (un|una|el|la)|genera (un|una)|redacta|diseña|elabora|construye|desarrolla (un|una)|inventa|compone|haz (un|una)|produce|plantilla|template|código para|función que|clase que|componente (de|para|react|vue))/.test(
      t,
    )
  )
    return "creation";
  if (
    /(traduce|resume|resumir|sintetiza|calcula|convierte|extrae|lista|enumera|ordena|clasifica|formatea|transforma|corrige|mejora|simplifica|expande|amplía|parafrasea|pasa (a|esto)|dame (la lista|el resultado|un resumen)|muéstrame los|hazlo (más|menos))/.test(
      t,
    )
  )
    return "instruction";
  if (
    /(explica|¿qué es|¿cómo funciona|¿por qué|¿cuándo|¿quién|¿dónde|¿cuál es|¿cuánto|¿cuántos|define|definición de|qué significa|cómo se llama|historia de|origen de|diferencia entre|what is|how does|why is)/.test(
      t,
    )
  )
    return "knowledge";
  return "general";
}

const CATEGORY_ICONS: Record<Category, { path: string; label: string }> = {
  instruction: { label: "Instrucción", path: "M3 8h10M9 4l4 4-4 4" },
  creation: { label: "Creación", path: "M8 2v12M4 6l4-4 4 4M5 14h6" },
  analysis: { label: "Análisis", path: "M2 12l4-4 3 3 5-7" },
  knowledge: { label: "Conocimiento", path: "M8 2a4 4 0 010 8M8 10v4M6 14h4" },
  problem: {
    label: "Problema",
    path: "M8 3v5l3 3M8 1a7 7 0 100 14A7 7 0 008 1z",
  },
  interaction: { label: "Conversación", path: "M2 4h12v7H9l-3 3v-3H2z" },
  meta: {
    label: "Configuración",
    path: "M8 5a3 3 0 100 6 3 3 0 000-6zM8 1v2M8 13v2M1 8h2M13 8h2",
  },
  context: { label: "Contexto", path: "M4 4h8M4 8h8M4 12h5" },
  general: {
    label: "General",
    path: "M8 4v4l2 2M8 1a7 7 0 100 14A7 7 0 008 1z",
  },
};

function BubbleIcon({
  category,
  cx,
  cy,
  color,
}: {
  category: Category;
  cx: number;
  cy: number;
  color: string;
}) {
  const icon = CATEGORY_ICONS[category];
  const SIZE = 16;
  const PAD = 6;
  const BOX = SIZE + PAD * 2;
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={BOX / 2}
        fill={color}
        opacity={0.25}
        stroke={solidColor(color)}
        strokeWidth={1}
      />
      <g transform={`translate(${cx - SIZE / 2}, ${cy - SIZE / 2})`}>
        <path
          d={icon.path}
          fill="none"
          stroke={solidColor(color)}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </g>
  );
}

interface Connection {
  id: string;
  fromId: string;
  toId: string;
}
interface DragState {
  connId: string;
  anchorId: string;
  anchorEnd: "from" | "to";
  mouseX: number;
  mouseY: number;
}

function makeBranchPath(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  BW: number,
) {
  const goRight = bx > ax;
  const x1 = goRight ? ax + BW / 2 : ax - BW / 2;
  const x2 = goRight ? bx - BW / 2 : bx + BW / 2;
  const dx = x2 - x1;
  return {
    d: `M${x1},${ay} C${x1 + dx * 0.5},${ay} ${x2 - dx * 0.5},${by} ${x2},${by}`,
    x1,
    y1: ay,
    x2,
    y2: by,
  };
}

function makeDragPath(
  ax: number,
  ay: number,
  mx: number,
  my: number,
  BW: number,
  anchorEnd: "from" | "to",
) {
  const goRight = anchorEnd === "from" ? mx > ax : ax > mx;
  const x1 = anchorEnd === "from" ? (goRight ? ax + BW / 2 : ax - BW / 2) : mx;
  const y1 = anchorEnd === "from" ? ay : my;
  const x2 = anchorEnd === "from" ? mx : goRight ? ax - BW / 2 : ax + BW / 2;
  const y2 = anchorEnd === "from" ? my : ay;
  const dx = x2 - x1;
  return {
    d: `M${x1},${y1} C${x1 + dx * 0.5},${y1} ${x2 - dx * 0.5},${y2} ${x2},${y2}`,
    x1,
    y1,
    x2,
    y2,
  };
}

// ─── Astronauta robótico ──────────────────────────────────────────────────────
interface AstronautState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  angle: number; // orientación actual (rad)
  state: "floating" | "flying" | "placing" | "returning";
  floatT: number; // tiempo base para animación idle
  thrusterT: number; // tiempo para parpadeo de propulsor
  placeTimer: number; // cuenta regresiva de animación "colocar"
  returnTarget: { x: number; y: number } | null;
}

function drawAstronaut(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  t: number,
  state: AstronautState["state"],
  isDark: boolean,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const scale = 0.9;
  ctx.scale(scale, scale);

  // ── Propulsor trasero (jet) ──
  if (state === "flying") {
    const jetLen = 8 + Math.sin(t * 20) * 3;
    const grad = ctx.createLinearGradient(-jetLen, 0, 0, 0);
    grad.addColorStop(0, "rgba(0,180,255,0)");
    grad.addColorStop(0.4, "rgba(0,220,255,0.6)");
    grad.addColorStop(1, "rgba(180,240,255,0.9)");
    ctx.beginPath();
    ctx.moveTo(-14, -4);
    ctx.lineTo(-14 - jetLen, -1 + Math.sin(t * 15) * 1.5);
    ctx.lineTo(-14 - jetLen + 2, 0);
    ctx.lineTo(-14 - jetLen, 1 - Math.sin(t * 15) * 1.5);
    ctx.lineTo(-14, 4);
    ctx.fillStyle = grad;
    ctx.fill();

    // Partículas de propulsor
    for (let p = 0; p < 3; p++) {
      const px = -14 - jetLen * (0.5 + p * 0.2) + Math.sin(t * 10 + p * 2) * 2;
      const py = Math.sin(t * 8 + p) * 3;
      const pr = 1.2 - p * 0.3;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(100,220,255,${0.6 - p * 0.15})`;
      ctx.fill();
    }
  }

  // ── Mochila propulsora ──
  ctx.beginPath();
  ctx.roundRect(-16, -5, 6, 10, 2);
  ctx.fillStyle = isDark ? "#2a3a5a" : "#3a4a6a";
  ctx.fill();
  ctx.strokeStyle = isDark ? "#4a6a9a" : "#5a7aaa";
  ctx.lineWidth = 0.5;
  ctx.stroke();
  // Detalle mochila
  ctx.beginPath();
  ctx.rect(-15, -3, 4, 2);
  ctx.fillStyle =
    state === "flying" ? "rgba(0,200,255,0.8)" : "rgba(0,120,180,0.4)";
  ctx.fill();

  // ── Cuerpo del traje ──
  ctx.beginPath();
  ctx.roundRect(-10, -7, 20, 14, 3);
  ctx.fillStyle = isDark ? "#c8d8f0" : "#d8e8ff";
  ctx.fill();
  ctx.strokeStyle = isDark ? "#8aaad0" : "#9abae0";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Panel de pecho
  ctx.beginPath();
  ctx.roundRect(-6, -4, 8, 8, 2);
  ctx.fillStyle = isDark ? "#1a2a4a" : "#2a3a5a";
  ctx.fill();
  // Luces de panel (parpadean según estado)
  const lights = [
    { dx: -4, dy: -2, color: state === "placing" ? "#00ff88" : "#ff4466" },
    { dx: 0, dy: -2, color: state === "flying" ? "#00ccff" : "#ffaa00" },
    { dx: 3, dy: -2, color: "#8866ff" },
    { dx: -2, dy: 2, color: state === "placing" ? "#00ff88" : "#4488ff" },
    { dx: 2, dy: 2, color: "#ff8844" },
  ];
  lights.forEach((l) => {
    const blink = Math.sin(t * 4 + l.dx) > 0;
    ctx.beginPath();
    ctx.arc(l.dx, l.dy, 1, 0, Math.PI * 2);
    ctx.fillStyle = blink ? l.color : l.color + "44";
    ctx.fill();
  });

  // ── Casco ──
  ctx.beginPath();
  ctx.arc(4, -1, 7, 0, Math.PI * 2);
  ctx.fillStyle = isDark ? "#0a1828" : "#1a2838";
  ctx.fill();
  ctx.strokeStyle = isDark ? "#4a7ab0" : "#5a8ac0";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Visor reflectante
  const visorGrad = ctx.createRadialGradient(5, -3, 1, 4, -1, 6);
  visorGrad.addColorStop(0, "rgba(100,200,255,0.5)");
  visorGrad.addColorStop(0.5, "rgba(50,120,200,0.3)");
  visorGrad.addColorStop(1, "rgba(0,40,100,0.8)");
  ctx.beginPath();
  ctx.arc(4, -1, 5.5, 0, Math.PI * 2);
  ctx.fillStyle = visorGrad;
  ctx.fill();

  // Reflejo del visor
  ctx.beginPath();
  ctx.ellipse(5.5, -3, 2, 1, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(200,230,255,0.35)";
  ctx.fill();

  // Ojos robóticos dentro del visor
  const eyeGlow =
    state === "placing"
      ? `rgba(0,255,136,${0.7 + Math.sin(t * 8) * 0.3})`
      : state === "flying"
        ? `rgba(0,200,255,${0.7 + Math.sin(t * 12) * 0.3})`
        : `rgba(180,220,255,${0.5 + Math.sin(t * 3) * 0.2})`;

  ctx.beginPath();
  ctx.arc(2, -1, 1.2, 0, Math.PI * 2);
  ctx.fillStyle = eyeGlow;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(6, -1, 1.2, 0, Math.PI * 2);
  ctx.fillStyle = eyeGlow;
  ctx.fill();

  // Brillo pupila
  ctx.beginPath();
  ctx.arc(2.4, -1.4, 0.4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(6.4, -1.4, 0.4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fill();

  // ── Brazos ──
  // Brazo izquierdo (arriba del cuerpo)
  const armSwing =
    state === "placing" ? Math.sin(t * 6) * 0.4 : Math.sin(t * 2) * 0.15;
  ctx.save();
  ctx.translate(-8, -5);
  ctx.rotate(-0.3 + armSwing);
  ctx.beginPath();
  ctx.roundRect(-3, 0, 5, 9, 2);
  ctx.fillStyle = isDark ? "#b0c8e8" : "#c0d8f8";
  ctx.fill();
  ctx.stroke();
  // Guante
  ctx.beginPath();
  ctx.arc(0, 9, 2.5, 0, Math.PI * 2);
  ctx.fillStyle =
    state === "placing"
      ? "rgba(0,255,136,0.8)"
      : isDark
        ? "#7aaad0"
        : "#8abad0";
  ctx.fill();
  ctx.restore();

  // Brazo derecho
  ctx.save();
  ctx.translate(8, -5);
  ctx.rotate(0.3 - armSwing);
  ctx.beginPath();
  ctx.roundRect(-2, 0, 5, 9, 2);
  ctx.fillStyle = isDark ? "#b0c8e8" : "#c0d8f8";
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(1, 9, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = isDark ? "#7aaad0" : "#8abad0";
  ctx.fill();
  ctx.restore();

  // ── Piernas ──
  const legSwing =
    state === "flying" ? Math.sin(t * 5) * 0.3 : Math.sin(t * 1.5) * 0.1;
  [-1, 1].forEach((side, idx) => {
    ctx.save();
    ctx.translate(side * 4, 7);
    ctx.rotate(side * 0.2 + (idx === 0 ? legSwing : -legSwing));
    ctx.beginPath();
    ctx.roundRect(-2.5, 0, 5, 8, 2);
    ctx.fillStyle = isDark ? "#b0c8e8" : "#c0d8f8";
    ctx.fill();
    ctx.stroke();
    // Bota
    ctx.beginPath();
    ctx.roundRect(-3, 6, 6, 4, 2);
    ctx.fillStyle = isDark ? "#2a3a5a" : "#3a4a6a";
    ctx.fill();
    ctx.restore();
  });

  // ── Aura de colocación ──
  if (state === "placing") {
    const pulseR = 18 + Math.sin(t * 8) * 4;
    const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, pulseR);
    aura.addColorStop(0, "rgba(0,255,136,0.15)");
    aura.addColorStop(1, "rgba(0,255,136,0)");
    ctx.beginPath();
    ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
    ctx.fillStyle = aura;
    ctx.fill();
  }

  ctx.restore();
}

// ─── Hook canvas (estrellas + astronauta) ────────────────────────────────────
interface Star {
  x: number;
  y: number;
  r: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  color: string;
}

function useSpaceCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  w: number,
  h: number,
  isDark: boolean,
  astronautTarget: { x: number; y: number; id: string } | null,
) {
  const starsRef = useRef<Star[]>([]);
  const animRef = useRef<number>(0);
  const astRef = useRef<AstronautState>({
    x: 60,
    y: 60,
    targetX: 60,
    targetY: 60,
    angle: 0,
    state: "floating",
    floatT: 0,
    thrusterT: 0,
    placeTimer: 0,
    returnTarget: null,
  });
  const prevTargetId = useRef<string>("");

  // Genera estrellas
  useEffect(() => {
    if (w === 0 || h === 0) return;
    const COLORS_DARK = ["#ffffff", "#cce8ff", "#ffd6aa", "#d6ccff", "#aaffee"];
    const COLORS_LIGHT = [
      "#6b8cba",
      "#8875c7",
      "#4a7fa5",
      "#7a6bb0",
      "#3d6b8a",
    ];
    const colors = isDark ? COLORS_DARK : COLORS_LIGHT;
    const count = Math.floor((w * h) / 3000);
    starsRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r:
        Math.random() < 0.85
          ? Math.random() * 1 + 0.3
          : Math.random() * 1.8 + 1,
      opacity: Math.random() * 0.5 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, [w, h, isDark]);

  // Reacciona a nuevo target
  useEffect(() => {
    if (!astronautTarget || astronautTarget.id === prevTargetId.current) return;
    prevTargetId.current = astronautTarget.id;
    const ast = astRef.current;
    ast.targetX = astronautTarget.x;
    ast.targetY = astronautTarget.y;
    ast.state = "flying";
    ast.placeTimer = 0;
  }, [astronautTarget]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let last = 0;

    const draw = (ts: number) => {
      const dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;
      const t = ts * 0.001;
      const ast = astRef.current;

      ctx.clearRect(0, 0, w, h);

      // Fondo
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      if (isDark) {
        grad.addColorStop(0, "#07091a");
        grad.addColorStop(0.5, "#070B14");
        grad.addColorStop(1, "#08101f");
      } else {
        grad.addColorStop(0, "#dde8f5");
        grad.addColorStop(0.5, "#e8f0fa");
        grad.addColorStop(1, "#d5e4f2");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Nebulosas
      if (isDark) {
        [
          [w * 0.2, h * 0.3, w * 0.35, "80,0,120", 0.07],
          [w * 0.75, h * 0.6, w * 0.3, "0,40,100", 0.08],
        ].forEach(([nx, ny, nr, rgb, op]) => {
          const neb = ctx.createRadialGradient(
            nx as number,
            ny as number,
            0,
            nx as number,
            ny as number,
            nr as number,
          );
          neb.addColorStop(0, `rgba(${rgb},${op})`);
          neb.addColorStop(0.5, `rgba(${rgb},${(op as number) * 0.5})`);
          neb.addColorStop(1, "transparent");
          ctx.fillStyle = neb;
          ctx.fillRect(0, 0, w, h);
        });
      }

      // Cuadrícula sutil
      ctx.strokeStyle = isDark
        ? "rgba(148,163,184,0.04)"
        : "rgba(100,116,139,0.06)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= w; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Estrellas con twinkle
      starsRef.current.forEach((star) => {
        const twinkle = Math.sin(
          t * star.twinkleSpeed * 60 + star.twinkleOffset,
        );
        const op = Math.max(0.05, star.opacity + twinkle * 0.25);
        const hex = star.color;
        const r = parseInt(hex.slice(1, 3), 16),
          g = parseInt(hex.slice(3, 5), 16),
          b = parseInt(hex.slice(5, 7), 16);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${op})`;
        ctx.fill();
        if (star.r > 1.5) {
          const halo = ctx.createRadialGradient(
            star.x,
            star.y,
            0,
            star.x,
            star.y,
            star.r * 4,
          );
          const rgb2 = isDark ? "200,220,255" : "100,130,180";
          halo.addColorStop(0, `rgba(${rgb2},${op * 0.3})`);
          halo.addColorStop(1, `rgba(${rgb2},0)`);
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.r * 4, 0, Math.PI * 2);
          ctx.fillStyle = halo;
          ctx.fill();
        }
      });

      // ── Lógica astronauta ──
      ast.floatT += dt;
      ast.thrusterT += dt;

      if (ast.state === "floating") {
        // Deriva suave tipo Bob espacial
        const floatX = Math.sin(ast.floatT * 0.4) * 15;
        const floatY = Math.cos(ast.floatT * 0.3) * 10;
        ast.x += (ast.targetX + floatX - ast.x) * 0.02;
        ast.y += (ast.targetY + floatY - ast.y) * 0.02;
        ast.angle += (0 - ast.angle) * 0.05;
      }

      if (ast.state === "flying") {
        const dx = ast.targetX - ast.x;
        const dy = ast.targetY - ast.y;
        const dist = Math.hypot(dx, dy);
        const targetAngle = Math.atan2(dy, dx);
        // Suaviza rotación
        let da = targetAngle - ast.angle;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        ast.angle += da * 0.12;
        // Velocidad adaptativa
        const speed = Math.min(dist * 3, 180) * dt;
        if (dist > 8) {
          ast.x += (dx / dist) * speed;
          ast.y += (dy / dist) * speed;
        } else {
          // Llegó: animación de colocación
          ast.x = ast.targetX;
          ast.y = ast.targetY;
          ast.state = "placing";
          ast.placeTimer = 0;
        }
      }

      if (ast.state === "placing") {
        ast.placeTimer += dt;
        // Vibración de colocación
        ast.x =
          ast.targetX +
          Math.sin(ast.placeTimer * 30) * (1.5 - ast.placeTimer * 1.5);
        ast.y =
          ast.targetY +
          Math.cos(ast.placeTimer * 25) * (1.5 - ast.placeTimer * 1.5);
        if (ast.placeTimer > 1.2) {
          ast.state = "returning";
          // Regresa a una posición de reposo al azar en la zona visible
          ast.returnTarget = {
            x: 40 + Math.random() * (w * 0.3),
            y: 20 + Math.random() * (h * 0.5),
          };
          ast.targetX = ast.returnTarget.x;
          ast.targetY = ast.returnTarget.y;
        }
      }

      if (ast.state === "returning") {
        const dx = ast.targetX - ast.x;
        const dy = ast.targetY - ast.y;
        const dist = Math.hypot(dx, dy);
        const targetAngle = Math.atan2(dy, dx);
        let da = targetAngle - ast.angle;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        ast.angle += da * 0.1;
        const speed = Math.min(dist * 2.5, 120) * dt;
        if (dist > 10) {
          ast.x += (dx / dist) * speed;
          ast.y += (dy / dist) * speed;
        } else {
          ast.state = "floating";
          ast.floatT = 0;
        }
      }

      // Estela de vuelo
      if (ast.state === "flying" || ast.state === "returning") {
        for (let i = 0; i < 4; i++) {
          const tr = 3 - i * 0.6;
          const to = 0.25 - i * 0.05;
          const tx =
            ast.x -
            Math.cos(ast.angle) * (10 + i * 5) +
            Math.sin(ast.floatT * 3 + i) * 2;
          const ty =
            ast.y -
            Math.sin(ast.angle) * (10 + i * 5) +
            Math.cos(ast.floatT * 3 + i) * 2;
          ctx.beginPath();
          ctx.arc(tx, ty, tr, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(100,210,255,${to})`;
          ctx.fill();
        }
      }

      drawAstronaut(ctx, ast.x, ast.y, ast.angle, t, ast.state, isDark);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [w, h, isDark, canvasRef]);
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function IdeaCloud({
  ideas,
  isVisible,
  onToggleVisibility,
  onSelectIdea,
}: IdeaCloudProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isMinimized, setIsMinimized] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [connections, setConnections] = useState<Connection[]>([]);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [returning, setReturning] = useState<{
    connId: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  } | null>(null);
  const [astronautTarget, setAstronautTarget] = useState<{
    x: number;
    y: number;
    id: string;
  } | null>(null);

  const BUBBLE_W = 160;
  const BUBBLE_H = 36;
  const BUBBLE_RX = 18;
  const ICON_OFFSET = 28;
  const SNAP_RADIUS = 30;
  const branchDuration = 0.8;

  useSpaceCanvas(canvasRef, dims.w, dims.h, isDark, astronautTarget);

  useEffect(() => {
    const update = () => {
      if (containerRef.current)
        setDims({
          w: containerRef.current.offsetWidth,
          h: containerRef.current.offsetHeight,
        });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [isVisible]);

  // Detecta nueva idea y manda al astronauta
  const prevIdeasLen = useRef(0);
  useEffect(() => {
    if (ideas.length > prevIdeasLen.current && dims.w > 0) {
      const newIdea = ideas[ideas.length - 1];
      const i = ideas.length - 1;
      const cx =
        i === 0
          ? Math.max(
              BUBBLE_W / 2 + 10,
              Math.min(
                dims.w - BUBBLE_W / 2 - 10,
                (newIdea.position.x / 100) * dims.w,
              ),
            )
          : Math.max(
              BUBBLE_W / 2 + 10,
              Math.min(
                dims.w - BUBBLE_W / 2 - 10,
                (newIdea.position.x / 100) * dims.w,
              ),
            );
      const cy =
        i === 0
          ? 30 + BUBBLE_H / 2
          : Math.max(
              BUBBLE_H / 2 + 10,
              Math.min(
                dims.h - BUBBLE_H / 2 - 10,
                (newIdea.position.y / 100) * dims.h,
              ),
            );
      setAstronautTarget({ x: cx, y: cy, id: newIdea.id });
    }
    prevIdeasLen.current = ideas.length;
  }, [ideas, dims]);

  useEffect(() => {
    setConnections((prev) => {
      const next: Connection[] = [];
      for (let i = 0; i < ideas.length - 1; i++) {
        const existing = prev.find(
          (c) => c.fromId === ideas[i].id && c.toId === ideas[i + 1].id,
        );
        if (existing) {
          next.push(existing);
          continue;
        }
        const linked = prev.some(
          (c) =>
            (c.fromId === ideas[i].id || c.toId === ideas[i].id) &&
            (c.fromId === ideas[i + 1].id || c.toId === ideas[i + 1].id),
        );
        if (linked) {
          const r = prev.find(
            (c) =>
              (c.fromId === ideas[i].id || c.toId === ideas[i].id) &&
              (c.fromId === ideas[i + 1].id || c.toId === ideas[i + 1].id),
          );
          if (r) next.push(r);
        } else {
          next.push({
            id: `conn-${ideas[i].id}-${ideas[i + 1].id}`,
            fromId: ideas[i].id,
            toId: ideas[i + 1].id,
          });
        }
      }
      prev.forEach((c) => {
        if (
          !next.find((n) => n.id === c.id) &&
          ideas.some((id) => id.id === c.fromId) &&
          ideas.some((id) => id.id === c.toId)
        )
          next.push(c);
      });
      return next;
    });
  }, [ideas]);

  const bubbleMap = useMemo(() => {
    const map = new Map<
      string,
      { cx: number; cy: number; category: Category; idea: Idea }
    >();
    ideas.forEach((idea, i) => {
      const cx = Math.max(
        BUBBLE_W / 2 + 10,
        Math.min(dims.w - BUBBLE_W / 2 - 10, (idea.position.x / 100) * dims.w),
      );
      const cy =
        i === 0
          ? 30 + BUBBLE_H / 2
          : Math.max(
              BUBBLE_H / 2 + 10,
              Math.min(
                dims.h - BUBBLE_H / 2 - 10,
                (idea.position.y / 100) * dims.h,
              ),
            );
      map.set(idea.id, {
        cx,
        cy,
        category: classifyPrompt(idea.content),
        idea,
      });
    });
    return map;
  }, [ideas, dims.w, dims.h, BUBBLE_W, BUBBLE_H]);

  const getConnectionPoints = useCallback(
    (id: string) => {
      const b = bubbleMap.get(id);
      if (!b) return null;
      return {
        left: { x: b.cx - BUBBLE_W / 2, y: b.cy },
        right: { x: b.cx + BUBBLE_W / 2, y: b.cy },
      };
    },
    [bubbleMap, BUBBLE_W],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!drag || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const sw = parseFloat(svgRef.current.getAttribute("width") || "1");
      const sh = parseFloat(svgRef.current.getAttribute("height") || "1");
      setDrag((prev) =>
        prev
          ? {
              ...prev,
              mouseX: (e.clientX - rect.left) * (sw / rect.width),
              mouseY: (e.clientY - rect.top) * (sh / rect.height),
            }
          : null,
      );
    },
    [drag],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!drag || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const sw = parseFloat(svgRef.current.getAttribute("width") || "1");
      const sh = parseFloat(svgRef.current.getAttribute("height") || "1");
      const mx = (e.clientX - rect.left) * (sw / rect.width);
      const my = (e.clientY - rect.top) * (sh / rect.height);
      let snapTarget: { id: string } | null = null;
      ideas.forEach((idea) => {
        if (idea.id === drag.anchorId) return;
        const pts = getConnectionPoints(idea.id);
        if (!pts) return;
        for (const side of ["left", "right"] as const)
          if (Math.hypot(pts[side].x - mx, pts[side].y - my) < SNAP_RADIUS)
            snapTarget = { id: idea.id };
      });
      if (snapTarget) {
        const tid = (snapTarget as { id: string }).id;
        setConnections((prev) =>
          prev.map((c) =>
            c.id === drag.connId
              ? {
                  ...c,
                  fromId: drag.anchorEnd === "from" ? drag.anchorId : tid,
                  toId: drag.anchorEnd === "from" ? tid : drag.anchorId,
                }
              : c,
          ),
        );
        setDrag(null);
      } else {
        const pts = getConnectionPoints(drag.anchorId);
        if (pts) {
          const side = drag.anchorEnd === "from" ? "right" : "left";
          setReturning({
            connId: drag.connId,
            fromX: mx,
            fromY: my,
            toX: pts[side].x,
            toY: pts[side].y,
          });
          setTimeout(() => setReturning(null), 400);
        }
        setDrag(null);
      }
    },
    [drag, ideas, getConnectionPoints],
  );

  const startDrag = useCallback(
    (
      e: React.MouseEvent,
      connId: string,
      anchorId: string,
      anchorEnd: "from" | "to",
    ) => {
      e.stopPropagation();
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const sw = parseFloat(svgRef.current.getAttribute("width") || "1");
      const sh = parseFloat(svgRef.current.getAttribute("height") || "1");
      setDrag({
        connId,
        anchorId,
        anchorEnd,
        mouseX: (e.clientX - rect.left) * (sw / rect.width),
        mouseY: (e.clientY - rect.top) * (sh / rect.height),
      });
    },
    [],
  );

  if (!isVisible) return null;

  const contentWidth =
    bubbleMap.size > 0
      ? Math.max(
          ...[...bubbleMap.values()].map(
            (b) => b.cx + BUBBLE_W / 2 + ICON_OFFSET + 20,
          ),
        )
      : dims.w;
  const contentHeight =
    bubbleMap.size > 0
      ? Math.max(
          ...[...bubbleMap.values()].map((b) => b.cy + BUBBLE_H / 2 + 20),
        )
      : dims.h;

  const connectionSide = new Map<string, "left" | "right">();
  connections.forEach((conn) => {
    const a = bubbleMap.get(conn.fromId),
      b = bubbleMap.get(conn.toId);
    if (!a || !b) return;
    const goRight = b.cx > a.cx;
    connectionSide.set(conn.fromId, goRight ? "right" : "left");
    connectionSide.set(conn.toId, goRight ? "left" : "right");
  });

  const svgW = Math.max(contentWidth, dims.w);
  const svgH = Math.max(contentHeight, dims.h);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: isMinimized ? 0.1 : 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
      style={{ height: "30vh" }}
    >
      <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto z-30">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMinimized(!isMinimized)}
          className={`p-2 rounded-lg backdrop-blur-md border transition-colors ${isDark ? "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700" : "bg-white/80 hover:bg-slate-100/80 text-slate-700 border-slate-300"}`}
        >
          {isMinimized ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleVisibility}
          className={`p-2 rounded-lg backdrop-blur-md border transition-colors ${isDark ? "bg-red-900/50 hover:bg-red-800/50 text-red-300 border-red-800" : "bg-red-100/80 hover:bg-red-200/80 text-red-700 border-red-300"}`}
        >
          <X className="w-4 h-4" />
        </motion.button>
      </div>

      <div
        ref={containerRef}
        className="relative w-full h-full"
        style={{
          overflowX: contentWidth > dims.w ? "auto" : "hidden",
          overflowY: contentHeight > dims.h ? "auto" : "hidden",
        }}
      >
        <canvas
          ref={canvasRef}
          width={svgW}
          height={svgH}
          style={{
            position: "absolute",
            inset: 0,
            display: "block",
            pointerEvents: "none",
          }}
        />

        {!isMinimized && (
          <svg
            ref={svgRef}
            width={svgW}
            height={svgH}
            style={{
              position: "relative",
              display: "block",
              cursor: drag ? "grabbing" : "default",
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              if (drag) setDrag(null);
            }}
          >
            <defs>
              {connections.map((conn) => {
                const a = bubbleMap.get(conn.fromId),
                  b = bubbleMap.get(conn.toId);
                if (!a || !b) return null;
                return (
                  <linearGradient
                    key={conn.id}
                    id={`grad-${conn.id}`}
                    x1={a.cx}
                    y1={a.cy}
                    x2={b.cx}
                    y2={b.cy}
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor={solidColor(a.idea.color)} />
                    <stop offset="100%" stopColor={solidColor(b.idea.color)} />
                  </linearGradient>
                );
              })}
              {drag &&
                (() => {
                  const anchor = bubbleMap.get(drag.anchorId);
                  if (!anchor) return null;
                  return (
                    <linearGradient
                      key="drag-grad"
                      id="drag-grad"
                      x1={anchor.cx}
                      y1={anchor.cy}
                      x2={drag.mouseX}
                      y2={drag.mouseY}
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop
                        offset="0%"
                        stopColor={solidColor(anchor.idea.color)}
                      />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.4)" />
                    </linearGradient>
                  );
                })()}
            </defs>

            {connections.map((conn) => {
              const a = bubbleMap.get(conn.fromId),
                b = bubbleMap.get(conn.toId);
              if (!a || !b || drag?.connId === conn.id) return null;
              const { d, x1, y1, x2, y2 } = makeBranchPath(
                a.cx,
                a.cy,
                b.cx,
                b.cy,
                BUBBLE_W,
              );
              return (
                <g key={conn.id}>
                  <motion.path
                    d={d}
                    fill="none"
                    stroke={`url(#grad-${conn.id})`}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: branchDuration, ease: "easeInOut" }}
                  />
                  <circle
                    cx={x1}
                    cy={y1}
                    r={7}
                    fill={solidColor(a.idea.color)}
                    opacity={0.9}
                    stroke="white"
                    strokeWidth={1.5}
                    style={{ cursor: "grab", pointerEvents: "auto" }}
                    onMouseDown={(e) => startDrag(e, conn.id, b.idea.id, "to")}
                  />
                  <circle
                    cx={x2}
                    cy={y2}
                    r={7}
                    fill={solidColor(b.idea.color)}
                    opacity={0.9}
                    stroke="white"
                    strokeWidth={1.5}
                    style={{ cursor: "grab", pointerEvents: "auto" }}
                    onMouseDown={(e) =>
                      startDrag(e, conn.id, a.idea.id, "from")
                    }
                  />
                </g>
              );
            })}

            {drag &&
              (() => {
                const anchor = bubbleMap.get(drag.anchorId);
                if (!anchor) return null;
                const { d, x1, y1 } = makeDragPath(
                  anchor.cx,
                  anchor.cy,
                  drag.mouseX,
                  drag.mouseY,
                  BUBBLE_W,
                  drag.anchorEnd,
                );
                let snapHint: { x: number; y: number } | null = null;
                ideas.forEach((idea) => {
                  if (idea.id === drag.anchorId) return;
                  const pts = getConnectionPoints(idea.id);
                  if (!pts) return;
                  for (const side of ["left", "right"] as const)
                    if (
                      Math.hypot(
                        pts[side].x - drag.mouseX,
                        pts[side].y - drag.mouseY,
                      ) < SNAP_RADIUS
                    )
                      snapHint = pts[side];
                });
                return (
                  <g>
                    <path
                      d={d}
                      fill="none"
                      stroke="url(#drag-grad)"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeDasharray="6 4"
                      opacity={0.8}
                    />
                    <circle
                      cx={x1}
                      cy={y1}
                      r={7}
                      fill={solidColor(anchor.idea.color)}
                      opacity={0.9}
                      stroke="white"
                      strokeWidth={1.5}
                    />
                    <circle
                      cx={drag.mouseX}
                      cy={drag.mouseY}
                      r={7}
                      fill={snapHint ? "#00ff88" : "rgba(255,255,255,0.6)"}
                      stroke={snapHint ? "#00ff88" : "rgba(255,255,255,0.4)"}
                      strokeWidth={2}
                    />
                    {snapHint && (
                      <circle
                        cx={(snapHint as { x: number; y: number }).x}
                        cy={(snapHint as { x: number; y: number }).y}
                        r={12}
                        fill="none"
                        stroke="#00ff88"
                        strokeWidth={2}
                        opacity={0.7}
                        strokeDasharray="4 3"
                      />
                    )}
                  </g>
                );
              })()}

            {returning && (
              <motion.circle
                cx={returning.fromX}
                cy={returning.fromY}
                r={6}
                fill="rgba(255,255,255,0.6)"
                animate={{
                  cx: returning.toX,
                  cy: returning.toY,
                  opacity: [1, 0],
                }}
                transition={{ duration: 0.4, ease: "easeIn" }}
              />
            )}

            <AnimatePresence>
              {ideas.map((idea, i) => {
                const b = bubbleMap.get(idea.id);
                if (!b) return null;
                const { cx, cy, category } = b;
                const appearDelay = i === 0 ? 0 : branchDuration;
                const iconOnLeft = connectionSide.get(idea.id) === "right";
                const iconX = iconOnLeft
                  ? cx - BUBBLE_W / 2 - ICON_OFFSET
                  : cx + BUBBLE_W / 2 + ICON_OFFSET;
                return (
                  <motion.g
                    key={idea.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: 0.9,
                      scale: 1,
                      x: [0, 1.5, -1.5, 0],
                      y: [0, -2, 2, 0],
                    }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{
                      opacity: { delay: appearDelay, duration: 0.4 },
                      scale: {
                        delay: appearDelay,
                        duration: 0.4,
                        type: "spring",
                        stiffness: 200,
                      },
                      x: {
                        repeat: Infinity,
                        duration: 4,
                        ease: "easeInOut",
                        delay: appearDelay + 0.4,
                      },
                      y: {
                        repeat: Infinity,
                        duration: 3,
                        ease: "easeInOut",
                        delay: appearDelay + 0.4,
                      },
                    }}
                    onClick={() => onSelectIdea(idea.id)}
                    style={{ cursor: "pointer", pointerEvents: "auto" }}
                  >
                    <rect
                      x={cx - BUBBLE_W / 2}
                      y={cy - BUBBLE_H / 2}
                      width={BUBBLE_W}
                      height={BUBBLE_H}
                      rx={BUBBLE_RX}
                      fill={idea.color}
                      stroke={solidColor(idea.color).replace("1)", "0.8)")}
                      strokeWidth={1.2}
                    />
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={11}
                      fontFamily="sans-serif"
                      fill={isDark ? "#ffffff" : "#1e293b"}
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      {idea.content.length > 18
                        ? idea.content.substring(0, 18) + "…"
                        : idea.content}
                    </text>
                    <motion.g
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: appearDelay + 0.3,
                        duration: 0.3,
                        ease: "easeOut",
                      }}
                    >
                      <BubbleIcon
                        category={category}
                        cx={iconX}
                        cy={cy}
                        color={idea.color}
                      />
                    </motion.g>
                    <title>{CATEGORY_ICONS[category].label}</title>
                  </motion.g>
                );
              })}
            </AnimatePresence>
          </svg>
        )}
      </div>
    </motion.div>
  );
}
