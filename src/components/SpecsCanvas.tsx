import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CustomizationState } from '../types';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger with GSAP
gsap.registerPlugin(ScrollTrigger);

interface SpecsCanvasProps {
  customization: CustomizationState;
  onScrollSectionChange?: (section: string) => void;
  onReady?: () => void;
}

type SpectacleStyle = CustomizationState['style'];

const MAIN_CANVAS_DPR = 1.5;

const FRAME_COLORS: Record<string, { hex: string; transmission: number; opacity: number; roughness: number; metalness: number }> = {
  'matte-black': { hex: '#16161a', transmission: 0.0, opacity: 1.0, roughness: 0.85, metalness: 0.08 },
  'champagne-crystal': { hex: '#eedbb0', transmission: 0.92, opacity: 0.64, roughness: 0.1, metalness: 0.04 },
  'polished-amber': { hex: '#d97706', transmission: 0.42, opacity: 0.9, roughness: 0.18, metalness: 0.04 },
  'rose-acetate': { hex: '#fda4af', transmission: 0.78, opacity: 0.74, roughness: 0.16, metalness: 0.04 },
  'pure-gold': { hex: '#d4af37', transmission: 0.0, opacity: 1.0, roughness: 0.22, metalness: 0.94 },
  'platinum': { hex: '#e2e8f0', transmission: 0.0, opacity: 1.0, roughness: 0.16, metalness: 0.88 }
};

const LENS_COLORS: Record<string, { hex: string; transmission: number; opacity: number; roughness: number; metalness: number }> = {
  'solar-charcoal': { hex: '#0f172a', transmission: 0.48, opacity: 0.86, roughness: 0.04, metalness: 0.12 },
  'blue-block': { hex: '#38bdf8', transmission: 0.84, opacity: 0.58, roughness: 0.025, metalness: 0.22 },
  'sunset-gold': { hex: '#f59e0b', transmission: 0.62, opacity: 0.76, roughness: 0.04, metalness: 0.45 },
  'forest-ocean': { hex: '#0d9488', transmission: 0.68, opacity: 0.8, roughness: 0.04, metalness: 0.2 }
};

const getCachedGeometry = (
  cache: Map<string, THREE.BufferGeometry>,
  key: string,
  build: () => THREE.BufferGeometry
) => {
  const cached = cache.get(key);
  if (cached) return cached;

  const geometry = build();
  geometry.userData.cached = true;
  cache.set(key, geometry);
  return geometry;
};

const getLensCurveBounds = (style: SpectacleStyle) => {
  if (style === 'round') return { rx: 0.82, ry: 0.82 };
  if (style === 'rectangular') return { rx: 1.02, ry: 0.62 };
  return { rx: 0.98, ry: 0.92 };
};

const addSubtleLensCurve = (geometry: THREE.BufferGeometry, centerX: number, style: SpectacleStyle) => {
  const position = geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
  if (!position) return;

  const { rx, ry } = getLensCurveBounds(style);
  for (let i = 0; i < position.count; i += 1) {
    const localX = (position.getX(i) - centerX) / rx;
    const localY = position.getY(i) / ry;
    const falloff = Math.max(0, 1 - (localX * localX + localY * localY));
    position.setZ(i, position.getZ(i) + falloff * 0.045);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
};

const createTortoiseTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, 96, 96);
  gradient.addColorStop(0, '#6b2f0d');
  gradient.addColorStop(0.45, '#d97706');
  gradient.addColorStop(1, '#241007');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 96, 96);

  for (let i = 0; i < 52; i += 1) {
    const x = Math.random() * 96;
    const y = Math.random() * 96;
    const r = 5 + Math.random() * 18;
    const spot = ctx.createRadialGradient(x, y, 0, x, y, r);
    spot.addColorStop(0, Math.random() > 0.48 ? 'rgba(255, 215, 146, 0.42)' : 'rgba(22, 10, 5, 0.6)');
    spot.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spot;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.8, 1.8);
  texture.anisotropy = 4;
  return texture;
};

export default function SpecsCanvas({ customization, onScrollSectionChange, onReady }: SpecsCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Keep customization state in ref for rendering loop and quick changes
  const customizationRef = useRef<CustomizationState>(customization);
  useEffect(() => {
    customizationRef.current = customization;
  }, [customization]);

  // References to materials/meshes so we can update them in-place safely
  const frameMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const lensMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const hingeMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const nosePadMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const geometryCacheRef = useRef(new Map<string, THREE.BufferGeometry>());
  const tortoiseTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const specsGroupRef = useRef<THREE.Group | null>(null);
  const glassesGroupRef = useRef<THREE.Group | null>(null); // holds dynamic parts
  const caseGroupRef = useRef<THREE.Group | null>(null);
  const lidPivotRef = useRef<THREE.Group | null>(null);
  const stageGroupRef = useRef<THREE.Group | null>(null);
  const onReadyRef = useRef(onReady);
  const hasReportedReadyRef = useRef(false);

  // State to track loaded / ready status
  const [isReady, setIsReady] = useState(false);
  const [hasWebGLError, setHasWebGLError] = useState(false);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  // Re-generate geometry when style changes
  useEffect(() => {
    if (!glassesGroupRef.current) return;

    // Clear previous meshes. Cached geometries and shared materials are disposed on full unmount.
    while (glassesGroupRef.current.children.length > 0) {
      const obj = glassesGroupRef.current.children[0];
      glassesGroupRef.current.remove(obj);

      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (!child.geometry.userData.cached) {
            child.geometry.dispose();
          }
        }
      });
    }

    const style = customization.style;
    const cache = geometryCacheRef.current;

    // Materials
    const frameMaterial = frameMaterialRef.current || new THREE.MeshPhysicalMaterial();
    const lensMaterial = lensMaterialRef.current || new THREE.MeshPhysicalMaterial();
    const hingeMaterial = hingeMaterialRef.current || new THREE.MeshStandardMaterial();
    const nosePadMaterial = nosePadMaterialRef.current || new THREE.MeshPhysicalMaterial({
      color: '#f4f1eb',
      roughness: 0.18,
      metalness: 0,
      transmission: 0.72,
      opacity: 0.46,
      transparent: true,
      thickness: 0.28,
      ior: 1.42
    });

    nosePadMaterialRef.current = nosePadMaterial;

    // Create Left and Right eye frame shapes in x, y coordinate space
    const leftFrameShape = new THREE.Shape();
    const rightFrameShape = new THREE.Shape();

    const leftLensShape = new THREE.Shape();
    const rightLensShape = new THREE.Shape();

    const eyeSpacing = 1.35; // Center of eyes offset from origin
    
    // Create shapes based on chosen optical shape style
    if (style === 'round') {
      const radiusOuter = 0.95;
      const radiusInner = 0.82;

      // Draw outer round rims
      leftFrameShape.absarc(-eyeSpacing, 0, radiusOuter, 0, Math.PI * 2, false);
      rightFrameShape.absarc(eyeSpacing, 0, radiusOuter, 0, Math.PI * 2, false);

      // Create inner holes (sub-paths)
      const leftHole = new THREE.Path();
      leftHole.absarc(-eyeSpacing, 0, radiusInner, 0, Math.PI * 2, true);
      leftFrameShape.holes.push(leftHole);

      const rightHole = new THREE.Path();
      rightHole.absarc(eyeSpacing, 0, radiusInner, 0, Math.PI * 2, true);
      rightFrameShape.holes.push(rightHole);

      // Lens inner geometries
      leftLensShape.absarc(-eyeSpacing, 0, radiusInner, 0, Math.PI * 2, false);
      rightLensShape.absarc(eyeSpacing, 0, radiusInner, 0, Math.PI * 2, false);

    } else if (style === 'rectangular') {
      const wOuter = 1.15;
      const hOuter = 0.75;
      const rOuter = 0.25;

      const wInner = 1.02;
      const hInner = 0.62;
      const rInner = 0.18;

      // Util function for rounded rectangle
      const drawRoundedRect = (s: THREE.Shape | THREE.Path, cx: number, cy: number, w: number, h: number, r: number, clockwise = false) => {
        const x = cx - w;
        const y = cy - h;
        const width = w * 2;
        const height = h * 2;

        if (clockwise) {
          s.moveTo(x + r, y + height);
          s.lineTo(x + width - r, y + height);
          s.quadraticCurveTo(x + width, y + height, x + width, y + height - r);
          s.lineTo(x + width, y + r);
          s.quadraticCurveTo(x + width, y, x + width - r, y);
          s.lineTo(x + r, y);
          s.quadraticCurveTo(x, y, x, y + r);
          s.lineTo(x, y + height - r);
          s.quadraticCurveTo(x, y + height, x + r, y + height);
        } else {
          s.moveTo(x + r, y + height);
          s.quadraticCurveTo(x, y + height, x, y + height - r);
          s.lineTo(x, y + r);
          s.quadraticCurveTo(x, y, x + r, y);
          s.lineTo(x + width - r, y);
          s.quadraticCurveTo(x + width, y, x + width, y + r);
          s.lineTo(x + width, y + height - r);
          s.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
          s.lineTo(x + r, y + height);
        }
      };

      // Outer left/right
      drawRoundedRect(leftFrameShape, -eyeSpacing, 0, wOuter, hOuter, rOuter, false);
      drawRoundedRect(rightFrameShape, eyeSpacing, 0, wOuter, hOuter, rOuter, false);

      // Inner left/right holes
      const leftHole = new THREE.Path();
      drawRoundedRect(leftHole, -eyeSpacing, 0, wInner, hInner, rInner, true);
      leftFrameShape.holes.push(leftHole);

      const rightHole = new THREE.Path();
      drawRoundedRect(rightHole, eyeSpacing, 0, wInner, hInner, rInner, true);
      rightFrameShape.holes.push(rightHole);

      // Lenses
      drawRoundedRect(leftLensShape, -eyeSpacing, 0, wInner, hInner, rInner, false);
      drawRoundedRect(rightLensShape, eyeSpacing, 0, wInner, hInner, rInner, false);

    } else { // aviator style code
      const scaleX = 1.05;
      const scaleY = 1.0;

      const drawAviatorRim = (s: THREE.Shape | THREE.Path, cx: number, flipX = false, sizeFactor = 1.0, clockwise = false) => {
        const mul = flipX ? -1 : 1;
        const sx = scaleX * sizeFactor;
        const sy = scaleY * sizeFactor;

        // Custom teardrop coordinates
        const pts = [
          new THREE.Vector2(0, 0.55 * sy),
          new THREE.Vector2(0.85 * sx, 0.45 * sy),
          new THREE.Vector2(0.95 * sx, -0.15 * sy),
          new THREE.Vector2(0.45 * sx, -0.85 * sy),
          new THREE.Vector2(-0.25 * sx, -0.9 * sy),
          new THREE.Vector2(-0.85 * sx, -0.35 * sy),
          new THREE.Vector2(-0.75 * sx, 0.35 * sy)
        ];

        if (clockwise) pointsToPathClockwise(s, cx, pts, mul);
        else pointsToPathCounterClockwise(s, cx, pts, mul);
      };

      function pointsToPathCounterClockwise(s: THREE.Shape | THREE.Path, cx: number, pts: THREE.Vector2[], mul: number) {
        s.moveTo(cx + pts[0].x * mul, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          s.bezierCurveTo(
            cx + pts[i - 1].x * mul, pts[i - 1].y,
            cx + pts[i].x * 0.9 * mul, pts[i].y * 1.05,
            cx + pts[i].x * mul, pts[i].y
          );
        }
        s.bezierCurveTo(
          cx + pts[pts.length - 1].x * mul, pts[pts.length - 1].y,
          cx + pts[0].x * 0.9 * mul, pts[0].y * 1.05,
          cx + pts[0].x * mul, pts[0].y
        );
      }

      function pointsToPathClockwise(s: THREE.Shape | THREE.Path, cx: number, pts: THREE.Vector2[], mul: number) {
        // Reverse array direction for clock-wise punch hole
        const rev = [...pts].reverse();
        s.moveTo(cx + rev[0].x * mul, rev[0].y);
        for (let i = 1; i < rev.length; i++) {
          s.bezierCurveTo(
            cx + rev[i - 1].x * mul, rev[i - 1].y,
            cx + rev[i].x * 0.9 * mul, rev[i].y * 1.05,
            cx + rev[i].x * mul, rev[i].y
          );
        }
        s.bezierCurveTo(
          cx + rev[rev.length - 1].x * mul, rev[rev.length - 1].y,
          cx + rev[0].x * 0.9 * mul, rev[0].y * 1.05,
          cx + rev[0].x * mul, rev[0].y
        );
      }

      // Draw Aviator Rims
      drawAviatorRim(leftFrameShape, -eyeSpacing, false, 1.05, false);
      drawAviatorRim(rightFrameShape, eyeSpacing, true, 1.05, false);

      const leftHole = new THREE.Path();
      drawAviatorRim(leftHole, -eyeSpacing, false, 0.92, true);
      leftFrameShape.holes.push(leftHole);

      const rightHole = new THREE.Path();
      drawAviatorRim(rightHole, eyeSpacing, true, 0.92, true);
      rightFrameShape.holes.push(rightHole);

      // Aviator Lenses
      drawAviatorRim(leftLensShape, -eyeSpacing, false, 0.92, false);
      drawAviatorRim(rightLensShape, eyeSpacing, true, 0.92, false);
    }

    // Extrude Settings for acetate eyewire frames
    const extrudeSettings = {
      depth: 0.14,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.03,
      bevelThickness: 0.03,
      curveSegments: 24
    };

    // Frame meshes
    const leftFrameGeom = getCachedGeometry(cache, `${style}-left-frame`, () => {
      const geometry = new THREE.ExtrudeGeometry(leftFrameShape, extrudeSettings);
      geometry.center();
      geometry.computeVertexNormals();
      return geometry;
    });
    const rightFrameGeom = getCachedGeometry(cache, `${style}-right-frame`, () => {
      const geometry = new THREE.ExtrudeGeometry(rightFrameShape, extrudeSettings);
      geometry.center();
      geometry.computeVertexNormals();
      return geometry;
    });

    const leftFrameMesh = new THREE.Mesh(leftFrameGeom, frameMaterial);
    const rightFrameMesh = new THREE.Mesh(rightFrameGeom, frameMaterial);

    leftFrameMesh.position.set(-eyeSpacing, 0, 0);
    rightFrameMesh.position.set(eyeSpacing, 0, 0);
    
    // Enable shadows
    leftFrameMesh.castShadow = true;
    leftFrameMesh.receiveShadow = true;
    rightFrameMesh.castShadow = true;
    rightFrameMesh.receiveShadow = true;

    glassesGroupRef.current.add(leftFrameMesh);
    glassesGroupRef.current.add(rightFrameMesh);

    // Dynamic bridges
    if (style === 'aviator') {
      // Aviator classical double bridge: Top bar + Main bridge
      const bridgeTopCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.48, 0.52, 0.05),
        new THREE.Vector3(0, 0.54, 0.05),
        new THREE.Vector3(0.48, 0.52, 0.05)
      ]);
      const bridgeTopGeom = getCachedGeometry(cache, `${style}-${customization.transmissionType}-bridge-top`, () => new THREE.TubeGeometry(bridgeTopCurve, 12, 0.04 * (customization.transmissionType === 'matte' ? 1.35 : 1.0), 8, false));
      const topBridgeMesh = new THREE.Mesh(bridgeTopGeom, hingeMaterial);
      glassesGroupRef.current.add(topBridgeMesh);

      const bridgeBottomCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.46, 0.12, 0.05),
        new THREE.Vector3(0, 0.16, 0.08),
        new THREE.Vector3(0.46, 0.12, 0.05)
      ]);
      const bridgeBottomGeom = getCachedGeometry(cache, `${style}-bridge-bottom`, () => new THREE.TubeGeometry(bridgeBottomCurve, 12, 0.052, 8, false));
      const bottomBridgeMesh = new THREE.Mesh(bridgeBottomGeom, frameMaterial);
      glassesGroupRef.current.add(bottomBridgeMesh);
    } else {
      // Standard Bridge
      const bridgeCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.4, 0.12, 0.03),
        new THREE.Vector3(0, 0.22, 0.09),
        new THREE.Vector3(0.4, 0.12, 0.03)
      ]);
      const bridgeGeom = getCachedGeometry(cache, `${style}-bridge`, () => new THREE.TubeGeometry(bridgeCurve, 16, 0.065, 8, false));
      const bridgeMesh = new THREE.Mesh(bridgeGeom, frameMaterial);
      bridgeMesh.castShadow = true;
      glassesGroupRef.current.add(bridgeMesh);

      // Gold core wire running through translucent bridges for sheer luxury!
      if (customization.transmissionType === 'translucent') {
        const coreCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.4, 0.12, 0.03),
          new THREE.Vector3(0, 0.22, 0.085),
          new THREE.Vector3(0.4, 0.12, 0.03)
        ]);
        const coreGeom = getCachedGeometry(cache, `${style}-bridge-core`, () => new THREE.TubeGeometry(coreCurve, 14, 0.02, 6, false));
        const coreMesh = new THREE.Mesh(coreGeom, hingeMaterial);
        glassesGroupRef.current.add(coreMesh);
      }
    }

    // Slightly domed lenses read more like real optics than flat panes.
    const lensExtrudeSettings = {
      depth: 0.032,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.012,
      bevelThickness: 0.012,
      curveSegments: 20
    };
    const lensShapeGeomLeft = getCachedGeometry(cache, `${style}-left-lens`, () => {
      const geometry = new THREE.ExtrudeGeometry(leftLensShape, lensExtrudeSettings);
      addSubtleLensCurve(geometry, -eyeSpacing, style);
      return geometry;
    });
    const lensShapeGeomRight = getCachedGeometry(cache, `${style}-right-lens`, () => {
      const geometry = new THREE.ExtrudeGeometry(rightLensShape, lensExtrudeSettings);
      addSubtleLensCurve(geometry, eyeSpacing, style);
      return geometry;
    });

    const leftLensMesh = new THREE.Mesh(lensShapeGeomLeft, lensMaterial);
    const rightLensMesh = new THREE.Mesh(lensShapeGeomRight, lensMaterial);

    // Place lenses slightly in the center of eyewires
    leftLensMesh.position.set(0, 0, 0.06);
    rightLensMesh.position.set(0, 0, 0.06);

    glassesGroupRef.current.add(leftLensMesh);
    glassesGroupRef.current.add(rightLensMesh);

    // Hinges and Metal Accents on Frame Ends
    const hingeLeftPos = style === 'round' ? -2.24 : style === 'rectangular' ? -2.42 : -2.32;
    const hingeRightPos = style === 'round' ? 2.24 : style === 'rectangular' ? 2.42 : 2.32;

    const hingeGeom = getCachedGeometry(cache, 'hinge-box', () => new THREE.BoxGeometry(0.08, 0.12, 0.15));
    const metalAccentGeom = getCachedGeometry(cache, 'front-pin-cylinder', () => {
      const geometry = new THREE.CylinderGeometry(0.04, 0.04, 0.12, 8);
      geometry.rotateX(Math.PI / 2);
      return geometry;
    });

    const leftHinge = new THREE.Mesh(hingeGeom, hingeMaterial);
    leftHinge.position.set(hingeLeftPos - 0.05, 0.08, -0.05);
    glassesGroupRef.current.add(leftHinge);

    const rightHinge = new THREE.Mesh(hingeGeom, hingeMaterial);
    rightHinge.position.set(hingeRightPos + 0.05, 0.08, -0.05);
    glassesGroupRef.current.add(rightHinge);

    // Metal pins on fronts
    const leftPin = new THREE.Mesh(metalAccentGeom, hingeMaterial);
    leftPin.position.set(hingeLeftPos, 0.08, 0.08);
    glassesGroupRef.current.add(leftPin);

    const rightPin = new THREE.Mesh(metalAccentGeom, hingeMaterial);
    rightPin.position.set(hingeRightPos, 0.08, 0.08);
    glassesGroupRef.current.add(rightPin);

    const screwGeom = getCachedGeometry(cache, 'hinge-screw-head', () => {
      const geometry = new THREE.CylinderGeometry(0.024, 0.024, 0.018, 10);
      geometry.rotateX(Math.PI / 2);
      return geometry;
    });

    [-0.035, 0.035].forEach((offsetY) => {
      const screwLeft = new THREE.Mesh(screwGeom, hingeMaterial);
      screwLeft.position.set(hingeLeftPos, 0.08 + offsetY, 0.165);
      glassesGroupRef.current?.add(screwLeft);

      const screwRight = new THREE.Mesh(screwGeom, hingeMaterial);
      screwRight.position.set(hingeRightPos, 0.08 + offsetY, 0.165);
      glassesGroupRef.current?.add(screwRight);
    });

    const padArmCurveLeft = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.18, -0.04, 0.06),
      new THREE.Vector3(-0.26, -0.16, 0.16),
      new THREE.Vector3(-0.34, -0.26, 0.2)
    ]);
    const padArmCurveRight = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.18, -0.04, 0.06),
      new THREE.Vector3(0.26, -0.16, 0.16),
      new THREE.Vector3(0.34, -0.26, 0.2)
    ]);
    const leftPadArmGeom = getCachedGeometry(cache, `${style}-left-pad-arm`, () => new THREE.TubeGeometry(padArmCurveLeft, 8, 0.012, 6, false));
    const rightPadArmGeom = getCachedGeometry(cache, `${style}-right-pad-arm`, () => new THREE.TubeGeometry(padArmCurveRight, 8, 0.012, 6, false));
    glassesGroupRef.current.add(new THREE.Mesh(leftPadArmGeom, hingeMaterial));
    glassesGroupRef.current.add(new THREE.Mesh(rightPadArmGeom, hingeMaterial));

    const nosePadGeom = getCachedGeometry(cache, 'soft-clear-nose-pad', () => new THREE.SphereGeometry(0.16, 12, 8));
    const leftNosePad = new THREE.Mesh(nosePadGeom, nosePadMaterial);
    leftNosePad.position.set(-0.36, -0.32, 0.23);
    leftNosePad.rotation.set(0.28, 0.18, -0.32);
    leftNosePad.scale.set(0.64, 1.05, 0.28);
    leftNosePad.renderOrder = 2;
    glassesGroupRef.current.add(leftNosePad);

    const rightNosePad = new THREE.Mesh(nosePadGeom, nosePadMaterial);
    rightNosePad.position.set(0.36, -0.32, 0.23);
    rightNosePad.rotation.set(0.28, -0.18, 0.32);
    rightNosePad.scale.set(0.64, 1.05, 0.28);
    rightNosePad.renderOrder = 2;
    glassesGroupRef.current.add(rightNosePad);

    // Elegant Temples (Arms) extending backward
    // Left temple curve
    const templeLength = 4.2;
    const templeStartX = hingeLeftPos - 0.08;
    const templeStartY = 0.08;
    const leftTempleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(templeStartX, templeStartY, -0.1),
      new THREE.Vector3(templeStartX - 0.02, templeStartY, -1.5),
      new THREE.Vector3(templeStartX - 0.04, templeStartY - 0.05, -3.0),
      new THREE.Vector3(templeStartX - 0.06, templeStartY - 0.28, -3.8),
      new THREE.Vector3(templeStartX - 0.08, templeStartY - 0.72, -4.15),
    ]);

    // Right temple curve
    const templeRightStartX = hingeRightPos + 0.08;
    const rightTempleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(templeRightStartX, templeStartY, -0.1),
      new THREE.Vector3(templeRightStartX + 0.02, templeStartY, -1.5),
      new THREE.Vector3(templeRightStartX + 0.04, templeStartY - 0.05, -3.0),
      new THREE.Vector3(templeRightStartX + 0.06, templeStartY - 0.28, -3.8),
      new THREE.Vector3(templeRightStartX + 0.08, templeStartY - 0.72, -4.15),
    ]);

    // Construct temple tubes with gold metal core wire representation
    const templeAcetateRadius = 0.075;
    const templeMetalRadius = 0.035;

    // Left Acetate Sleeve
    const leftTempleGeom = getCachedGeometry(cache, `${style}-left-temple`, () => new THREE.TubeGeometry(leftTempleCurve, 20, templeAcetateRadius, 8, false));
    const leftTempleMesh = new THREE.Mesh(leftTempleGeom, frameMaterial);
    leftTempleMesh.castShadow = true;
    glassesGroupRef.current.add(leftTempleMesh);

    // Left inner precious titanium core rod (visible when frame is translucent!)
    if (customization.transmissionType === 'translucent') {
      const leftCoreGeom = getCachedGeometry(cache, `${style}-left-temple-core`, () => new THREE.TubeGeometry(leftTempleCurve, 18, templeMetalRadius, 6, false));
      const leftCoreMesh = new THREE.Mesh(leftCoreGeom, hingeMaterial);
      glassesGroupRef.current.add(leftCoreMesh);
    }

    // Right Acetate Sleeve
    const rightTempleGeom = getCachedGeometry(cache, `${style}-right-temple`, () => new THREE.TubeGeometry(rightTempleCurve, 20, templeAcetateRadius, 8, false));
    const rightTempleMesh = new THREE.Mesh(rightTempleGeom, frameMaterial);
    rightTempleMesh.castShadow = true;
    glassesGroupRef.current.add(rightTempleMesh);

    // Right inner metal core rod
    if (customization.transmissionType === 'translucent') {
      const rightCoreGeom = getCachedGeometry(cache, `${style}-right-temple-core`, () => new THREE.TubeGeometry(rightTempleCurve, 18, templeMetalRadius, 6, false));
      const rightCoreMesh = new THREE.Mesh(rightCoreGeom, hingeMaterial);
      glassesGroupRef.current.add(rightCoreMesh);
    }

    // Small metal tipping caps at end of tips
    const tipEndGeom = getCachedGeometry(cache, 'temple-tip-sphere', () => new THREE.SphereGeometry(0.1, 8, 8));
    const leftTipEnd = new THREE.Mesh(tipEndGeom, hingeMaterial);
    leftTipEnd.position.set(templeStartX - 0.082, templeStartY - 0.72, -4.15);
    glassesGroupRef.current.add(leftTipEnd);

    const rightTipEnd = new THREE.Mesh(tipEndGeom, hingeMaterial);
    rightTipEnd.position.set(templeRightStartX + 0.082, templeStartY - 0.72, -4.15);
    glassesGroupRef.current.add(rightTipEnd);

    if (!hasReportedReadyRef.current) {
      hasReportedReadyRef.current = true;
      onReadyRef.current?.();
    }

  }, [customization.style, customization.transmissionType, isReady]);

  useEffect(() => {
    if (!hingeMaterialRef.current) return;

    const hingeMaterial = hingeMaterialRef.current;
    hingeMaterial.color.set(customization.hingeGold ? '#dfb76c' : '#c6c9cf');
    hingeMaterial.metalness = customization.hingeGold ? 0.92 : 0.84;
    hingeMaterial.roughness = customization.hingeGold ? 0.16 : 0.22;
    hingeMaterial.needsUpdate = true;
  }, [customization.hingeGold, isReady]);

  // Handle live material updates without rebuilding geometry.
  useEffect(() => {
    if (!frameMaterialRef.current || !lensMaterialRef.current) return;

    // Apply active frame customizations directly to materials to animate in real-time
    const fMat = frameMaterialRef.current;
    const lMat = lensMaterialRef.current;
    const fConfig = FRAME_COLORS[customization.frameColor] || FRAME_COLORS['matte-black'];
    const lConfig = LENS_COLORS[customization.lensColor] || LENS_COLORS['solar-charcoal'];

    if (customization.frameColor === 'polished-amber' && customization.transmissionType !== 'matte') {
      if (!tortoiseTextureRef.current) {
        tortoiseTextureRef.current = createTortoiseTexture();
      }
      fMat.map = tortoiseTextureRef.current;
    } else {
      fMat.map = null;
    }

    // Update Frame material
    fMat.color.set(fConfig.hex);
    fMat.roughness = fConfig.roughness;
    fMat.metalness = fConfig.metalness;
    fMat.transmission = customization.transmissionType === 'translucent' ? Math.max(0.7, fConfig.transmission) : (customization.transmissionType === 'matte' ? 0 : fConfig.transmission);
    fMat.thickness = customization.transmissionType === 'translucent' ? 1.05 : 0.5;
    fMat.opacity = customization.transmissionType === 'translucent' ? 0.78 : fConfig.opacity;
    fMat.ior = 1.48;
    fMat.clearcoat = customization.transmissionType === 'matte' ? 0.18 : 0.9;
    fMat.clearcoatRoughness = customization.transmissionType === 'matte' ? 0.5 : 0.08;
    fMat.envMapIntensity = customization.transmissionType === 'matte' ? 0.45 : 1.1;
    fMat.transparent = fMat.opacity < 1.0 || fMat.transmission > 0;
    fMat.needsUpdate = true;

    // Update Lens material
    lMat.color.set(lConfig.hex);
    lMat.roughness = lConfig.roughness;
    lMat.metalness = lConfig.metalness;
    lMat.transmission = lConfig.transmission;
    lMat.opacity = lConfig.opacity;
    lMat.thickness = 0.24;
    lMat.ior = 1.54;
    lMat.transparent = true;
    lMat.depthWrite = false;
    lMat.side = THREE.DoubleSide;
    lMat.clearcoat = 1.0;
    lMat.clearcoatRoughness = 0.025;
    lMat.envMapIntensity = 1.25;
    lMat.needsUpdate = true;

  }, [customization.frameColor, customization.lensColor, customization.transmissionType, isReady]);

  // Main Three.js + GSAP Initializer
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene Setting
    const scene = new THREE.Scene();

    // Subtle radial gradient or solid clean theme-matching background
    // Since we're styling on luxury warm cream/beige aesthetic, keep canvas transparent to overlay beautifully
    scene.background = null;

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    // 3. Renderer Initializing
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
    } catch (error) {
      console.warn('WebGL is unavailable, continuing without the 3D spectacle canvas.', error);
      setHasWebGLError(true);
      onReadyRef.current?.();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAIN_CANVAS_DPR));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Lights
    const hemiLight = new THREE.HemisphereLight('#fff8ee', '#1c2433', 1.1);
    scene.add(hemiLight);

    // Warm Key Directional Light
    const dirLight1 = new THREE.DirectionalLight('#fff7ed', 3.2);
    dirLight1.position.set(5, 5, 6);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 768;
    dirLight1.shadow.mapSize.height = 768;
    dirLight1.shadow.bias = -0.0002;
    scene.add(dirLight1);

    // Soft Blue Fill Light
    const dirLight2 = new THREE.DirectionalLight('#eff6ff', 1.6);
    dirLight2.position.set(-5, 2, 4);
    scene.add(dirLight2);

    // Top Rim Light
    const rimLight = new THREE.DirectionalLight('#ffffff', 2.6);
    rimLight.position.set(0, 8, -5);
    scene.add(rimLight);

    // Point Light next to frame center for high specular highlights
    const highlightLight = new THREE.PointLight('#dfb76c', 1.1, 10);
    highlightLight.position.set(0, 0, 3);
    scene.add(highlightLight);

    // 5. Build Material References (Shared across style-changes)
    const frameMaterial = new THREE.MeshPhysicalMaterial({
      color: '#16161a',
      roughness: 0.15,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05
    });
    const lensMaterial = new THREE.MeshPhysicalMaterial({
      color: '#0f172a',
      roughness: 0.02,
      metalness: 0.1,
      transmission: 0.5,
      opacity: 0.9,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      clearcoat: 1,
      clearcoatRoughness: 0.025
    });
    const hingeMaterial = new THREE.MeshStandardMaterial({
      color: '#dfb76c',
      metalness: 0.95,
      roughness: 0.1
    });
    const nosePadMaterial = new THREE.MeshPhysicalMaterial({
      color: '#f4f1eb',
      roughness: 0.18,
      metalness: 0,
      transmission: 0.72,
      opacity: 0.46,
      transparent: true,
      thickness: 0.28,
      ior: 1.42,
      depthWrite: false
    });

    frameMaterialRef.current = frameMaterial;
    lensMaterialRef.current = lensMaterial;
    hingeMaterialRef.current = hingeMaterial;
    nosePadMaterialRef.current = nosePadMaterial;

    // 6. Master Spec-Group & Spectacles Case Group
    const specsGroup = new THREE.Group();
    const glassesGroup = new THREE.Group(); // dynamic part which gets purged & rebuilt
    specsGroup.add(glassesGroup);
    scene.add(specsGroup);

    specsGroupRef.current = specsGroup;
    glassesGroupRef.current = glassesGroup;

    // Create Spectacles Case Group
    const caseGroup = new THREE.Group();
    scene.add(caseGroup);
    caseGroupRef.current = caseGroup;

    const caseLeatherMat = new THREE.MeshPhysicalMaterial({
      color: '#121213',
      roughness: 0.65,
      metalness: 0.15,
      clearcoat: 0.2,
      clearcoatRoughness: 0.3
    });

    const caseLiningMat = new THREE.MeshStandardMaterial({
      color: '#a18e74', // warm gold velvet lining
      roughness: 0.85,
      metalness: 0.1
    });

    const caseMetalMat = new THREE.MeshStandardMaterial({
      color: '#dfb76c', // gold clasp
      metalness: 0.95,
      roughness: 0.12
    });

    const caseBaseGeom = new THREE.BoxGeometry(4.2, 0.6, 2.0);
    const caseBaseMesh = new THREE.Mesh(caseBaseGeom, caseLeatherMat);
    caseBaseMesh.position.set(0, -0.3, 0);
    caseBaseMesh.castShadow = true;
    caseBaseMesh.receiveShadow = true;
    caseGroup.add(caseBaseMesh);

    const caseLiningGeom = new THREE.BoxGeometry(4.1, 0.55, 1.9);
    const caseLiningMesh = new THREE.Mesh(caseLiningGeom, caseLiningMat);
    caseLiningMesh.position.set(0, -0.25, 0);
    caseGroup.add(caseLiningMesh);

    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 0.0, -1.0);
    caseGroup.add(lidPivot);
    lidPivotRef.current = lidPivot;

    const caseLidGeom = new THREE.BoxGeometry(4.24, 0.35, 2.04);
    const caseLidMesh = new THREE.Mesh(caseLidGeom, caseLeatherMat);
    caseLidMesh.position.set(0, 0.175, 1.02);
    caseLidMesh.castShadow = true;
    caseLidMesh.receiveShadow = true;
    lidPivot.add(caseLidMesh);

    const claspGeom = new THREE.BoxGeometry(0.4, 0.15, 0.04);
    const claspMesh = new THREE.Mesh(claspGeom, caseMetalMat);
    claspMesh.position.set(0, -0.05, 2.06);
    caseLidMesh.add(claspMesh);

    // Ensure the case is visible for Hero animation
    caseGroup.visible = true;

    // Create 3D Circular Stage Group
    const stageGroup = new THREE.Group();
    scene.add(stageGroup);
    stageGroupRef.current = stageGroup;
    stageGroup.position.set(0, -12, 0);
    stageGroup.scale.set(0.001, 0.001, 0.001);
    stageGroup.visible = false;

    // Main platform (dark satin plinth)
    const stageBaseGeom = new THREE.CylinderGeometry(1.8, 1.8, 0.1, 40);
    const stageBaseMat = new THREE.MeshPhysicalMaterial({
      color: '#0a0a0b',
      roughness: 0.18,
      metalness: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });
    const stageBaseMesh = new THREE.Mesh(stageBaseGeom, stageBaseMat);
    stageBaseMesh.castShadow = true;
    stageBaseMesh.receiveShadow = false; // Disabled to resolve shadow acne Moire ring rendering artifacts on metallic plinth
    stageGroup.add(stageBaseMesh);

    // Gold edge rim accent
    const stageGoldTrimGeom = new THREE.CylinderGeometry(1.805, 1.805, 0.03, 40);
    const stageGoldTrimMat = new THREE.MeshStandardMaterial({
      color: '#dfb76c',
      roughness: 0.15,
      metalness: 0.95
    });
    const stageGoldTrimMesh = new THREE.Mesh(stageGoldTrimGeom, stageGoldTrimMat);
    stageGoldTrimMesh.position.y = 0.037; // Raised slightly to create a gold raised lip above the plinth
    stageGroup.add(stageGoldTrimMesh);

    // Emissive Glowing Ring at the stage edge
    const ringGeom = new THREE.TorusGeometry(1.76, 0.012, 8, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#dfb76c',
      toneMapped: false
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.055; // Raised slightly to sit perfectly on top of the gold trim lip
    stageGroup.add(ringMesh);

    // Trigger the geometry build pass; App readiness is reported after meshes are created.
    setIsReady(true);

    let currentSection = 'hero';

    // 7. Dynamic Scrolling Animations with GSAP & ScrollTrigger
    // Reset any earlier triggers
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

    // Use gsap.matchMedia() for real-time responsiveness across all screen sizes
    const mm = gsap.matchMedia();

    mm.add({
      isDesktop: "(min-width: 1025px)",
      isTablet: "(max-width: 1024px) and (min-width: 769px)",
      isMobile: "(max-width: 768px)"
    }, (context) => {
      const { isDesktop, isTablet, isMobile } = context.conditions as any;

      // Base properties setting (Section 1: Hero - Specs initially nested closed inside case)
      specsGroup.position.set(0, -0.45, 1.25);
      specsGroup.rotation.set(0.12, 0, 0); // Front-facing / centered!
      specsGroup.scale.set(0.001, 0.001, 0.001); // Start completely tiny (concealed inside)

      caseGroup.position.set(0, isDesktop ? -0.48 : -0.62, 1.25);
      caseGroup.rotation.set(0.12, 0, 0); // Centered!
      const heroCaseScale = isDesktop ? 0.86 : (isTablet ? 0.78 : 0.68);
      caseGroup.scale.set(heroCaseScale, heroCaseScale, heroCaseScale);
      lidPivot.rotation.x = 0; // Case lid is closed!

      // Initialize HTML elements to hidden layout states
      gsap.set('#main-navigation', { opacity: 1, y: 0 });
      gsap.set('#hero-left-text', { opacity: 1, x: 0 });
      gsap.set('#hero-right-text', { opacity: 1, x: 0 });
      gsap.set('#hero-scroll-indicator', { opacity: 1, y: 0 });
      gsap.set('#customizer-panel-section', { opacity: 0, y: 150 });
      gsap.set('#catalog-trigger', { opacity: 0, y: 80 });

      // Timeline 1: Scroll from Hero to Tech Sections
      // Case opens, glasses rise, case slides out, glasses float centered and then slide to right side
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '#hero-trigger',
          start: 'top top',
          end: '+=200%',
          pin: true,
          pinSpacing: true,
          scrub: 0.5,
          preventOverlaps: true,
          fastScrollEnd: true,
          onEnter: () => { currentSection = 'hero'; onScrollSectionChange?.('hero'); },
          onEnterBack: () => { currentSection = 'hero'; onScrollSectionChange?.('hero'); },
          onLeave: () => { currentSection = 'tech'; onScrollSectionChange?.('tech'); }
        }
      });

      // 1. Lid rotates open back
      tl.to(lidPivot.rotation, {
        x: -Math.PI * 0.75,
        ease: 'power2.inOut'
      }, 0);

      // 2. Spectacles rise up and scale, emerging from the case
      tl.to(specsGroup.position, {
        x: 0,
        y: 0.35,
        z: 1.15,
        ease: 'power2.out'
      }, 0.05);

      tl.to(specsGroup.scale, {
        x: isDesktop ? 0.78 : (isTablet ? 0.72 : 0.62),
        y: isDesktop ? 0.78 : (isTablet ? 0.72 : 0.62),
        z: isDesktop ? 0.78 : (isTablet ? 0.72 : 0.62),
        ease: 'power2.out'
      }, 0.05);

      // 3. Case slides down and scales out of view
      tl.to(caseGroup.position, {
        y: -5.0,
        ease: 'power2.inOut'
      }, 0.25);

      tl.to(caseGroup.scale, {
        x: 0.2,
        y: 0.2,
        z: 0.2,
        ease: 'power2.inOut'
      }, 0.25);

      // 4. Once the specs emerge completely, show navbar, side text blocks, indicator, and footers
      tl.to('#main-navigation', {
        opacity: 1,
        y: 0,
        ease: 'power1.out'
      }, 0.32);

      tl.to('#hero-left-text', {
        opacity: 1,
        x: 0,
        ease: 'power2.out'
      }, 0.48);

      tl.to('#hero-right-text', {
        opacity: 1,
        x: 0,
        ease: 'power2.out'
      }, 0.48);

      tl.to('#hero-scroll-indicator', {
        opacity: 1,
        y: 0,
        ease: 'power2.out'
      }, 0.42);

      // Transition Timeline: Scroll from Hero to Craftsmanship (Section 1 -> Section 2)
      // This transition scrubs exactly when features-trigger enters the bottom and reaches top
      const tlTransition1 = gsap.timeline({
        scrollTrigger: {
          trigger: '#features-trigger',
          start: 'top bottom', // starts when Section 2 enters viewport bottom
          end: 'top top',     // ends when Section 2 hits viewport top
          scrub: 0.5,
          preventOverlaps: true,
          fastScrollEnd: true
        }
      });

      tlTransition1.to(specsGroup.position, {
        x: isDesktop ? 4.2 : (isTablet ? 3.0 : 1.7),
        y: isDesktop ? 0.0 : (isTablet ? 0.0 : -0.25),
        z: 1.8, // zoomed-in close-up
        ease: 'power2.inOut'
      }, 0);

      tlTransition1.to(specsGroup.rotation, {
        x: 0.1,
        y: -Math.PI * 2, // 360-degree rotation Y-axis, front-facing
        z: 0.0,
        ease: 'power2.inOut'
      }, 0);

      tlTransition1.to(specsGroup.scale, {
        x: isDesktop ? 1.55 : (isTablet ? 1.35 : 1.15),
        y: isDesktop ? 1.55 : (isTablet ? 1.35 : 1.15),
        z: isDesktop ? 1.55 : (isTablet ? 1.35 : 1.15),
        ease: 'power2.inOut'
      }, 0);

      // Timeline 2: Scroll from Tech Sections to Customizer Workshop
      const tl2 = gsap.timeline({
        scrollTrigger: {
          trigger: '#features-trigger',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.5,
          preventOverlaps: true,
          fastScrollEnd: true,
          onEnter: () => { currentSection = 'tech'; onScrollSectionChange?.('tech'); },
          onEnterBack: () => { currentSection = 'tech'; onScrollSectionChange?.('tech'); },
          onLeave: () => { currentSection = 'customizer'; onScrollSectionChange?.('customizer'); }
        }
      });

      // 1. Keep spectacles on the right, front-facing
      tl2.to(specsGroup.position, {
        x: isDesktop ? 4.2 : (isTablet ? 3.0 : 1.7),
        y: isDesktop ? 0.0 : (isTablet ? 0.0 : -0.25),
        z: 1.8,
        ease: 'power2.inOut'
      }, 0);

      tl2.to(specsGroup.rotation, {
        x: 0.1,
        y: -Math.PI * 2,
        z: 0.0,
        ease: 'power2.inOut'
      }, 0);

      tl2.to(specsGroup.scale, {
        x: isDesktop ? 1.55 : (isTablet ? 1.35 : 1.15),
        y: isDesktop ? 1.55 : (isTablet ? 1.35 : 1.15),
        z: isDesktop ? 1.55 : (isTablet ? 1.35 : 1.15),
        ease: 'power2.inOut'
      }, 0);

      // Define stage start state at scroll 0 of Section 2 so it is hidden and off-screen,
      // and reverts properly when scrolling backward
      tl2.set(stageGroup, { visible: false }, 0);
      tl2.to(stageGroup.position, {
        x: 0,
        y: -12,
        z: 1.3,
        duration: 0.001
      }, 0);
      tl2.to(stageGroup.scale, {
        x: 0.001,
        y: 0.001,
        z: 0.001,
        duration: 0.001
      }, 0);

      // Specs stay on the right side for the ENTIRE Craftsmanship section.
      // The landing animation (centering + stage) happens in tl3 (Design Lab).

      // Timeline 3: Scroll from Customizer to Catalog (Pinned Section 3)
      const tl3 = gsap.timeline({
        scrollTrigger: {
          trigger: '#customizer-trigger',
          start: 'top top',
          end: '+=150%',
          pin: true,
          pinSpacing: true,
          scrub: 0.5,
          preventOverlaps: true,
          fastScrollEnd: true,
          onEnter: () => { currentSection = 'customizer'; onScrollSectionChange?.('customizer'); },
          onEnterBack: () => { currentSection = 'customizer'; onScrollSectionChange?.('customizer'); },
          onLeave: () => { currentSection = 'catalog'; onScrollSectionChange?.('catalog'); }
        }
      });

      // === PHASE 1: Landing Animation (0 → 0.65) ===
      // Specs fly from right-side (tl2 end state) to center stage.
      // Duration spans 0–0.65 so the tween HOLDS ownership of the property
      // until the scroll-out starts, preventing tl2's stale end-state from pulling specs right.
      // power2.out makes most movement happen early, then the tween holds steady.
      tl3.to(specsGroup.position, {
        x: 0,
        y: 1.2,
        z: 1.3,
        duration: 0.65,
        ease: 'power2.out'
      }, 0);

      tl3.to(specsGroup.rotation, {
        x: 0.12,
        y: -Math.PI * 2,
        z: 0.0,
        duration: 0.65,
        ease: 'power2.out'
      }, 0);

      tl3.to(specsGroup.scale, {
        x: isDesktop ? 0.95 : (isTablet ? 0.85 : 0.7),
        y: isDesktop ? 0.95 : (isTablet ? 0.85 : 0.7),
        z: isDesktop ? 0.95 : (isTablet ? 0.85 : 0.7),
        duration: 0.65,
        ease: 'power2.out'
      }, 0);

      // Stage rises from below and scales up
      tl3.set(stageGroup, { visible: true }, 0.001);

      tl3.to(stageGroup.position, {
        x: 0,
        y: -0.5,
        z: 1.3,
        duration: 0.65,
        ease: 'power2.out'
      }, 0);

      tl3.to(stageGroup.scale, {
        x: 1.0,
        y: 1.0,
        z: 1.0,
        duration: 0.65,
        ease: 'power2.out'
      }, 0);

      // Customizer panel fades in slightly delayed
      tl3.to('#customizer-panel-section', {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out'
      }, 0.1);

      // === PHASE 2: Scroll Out (0.65 → end) ===
      // Specs, stage, and customizer exit upward; catalog fades in
      tl3.to(specsGroup.position, {
        x: 0,
        y: 5.5,
        z: 1.3,
        ease: 'power2.in'
      }, 0.65);

      tl3.to(stageGroup.position, {
        x: 0,
        y: 4.0,
        z: 1.3,
        ease: 'power2.in'
      }, 0.65);

      tl3.to(specsGroup.scale, {
        x: 0.5,
        y: 0.5,
        z: 0.5,
        ease: 'power2.in'
      }, 0.65);

      tl3.to(stageGroup.scale, {
        x: 0.5,
        y: 0.5,
        z: 0.5,
        ease: 'power2.in'
      }, 0.65);

      tl3.to('#customizer-panel-section', {
        opacity: 0,
        y: -350,
        ease: 'power2.in'
      }, 0.65);

      tl3.to('#catalog-trigger', {
        opacity: 1,
        y: 0,
        ease: 'power2.out'
      }, 0.65);

      // Listener for final footer scrolling representation
      ScrollTrigger.create({
        trigger: '#catalog-trigger',
        start: 'top center',
        end: 'bottom bottom',
        onEnter: () => { currentSection = 'catalog'; onScrollSectionChange?.('catalog'); },
        onEnterBack: () => { currentSection = 'catalog'; onScrollSectionChange?.('catalog'); }
      });
    });

    // 8. Animation & Floating/Hover Effect loop
    let clock = new THREE.Clock();
    let animationFrameId: number;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pointerTarget = new THREE.Vector2(0, 0);

    const handlePointerMove = (event: PointerEvent) => {
      pointerTarget.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointerTarget.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Gentle floating waving movement based on elapsed time to feel organic
      if (specsGroup && !prefersReducedMotion) {
        const scrollFraction = window.scrollY / window.innerHeight;
        if (scrollFraction < 0.15) {
          // Slow passive wiggle when sitting in the case (Hero), keeping it centered
          specsGroup.rotation.y = Math.sin(elapsedTime * 0.3) * 0.05;
        }
      }

      if (glassesGroupRef.current) {
        // Float the child mesh cleanly rather than the parent specsGroup,
        // which prevents vertical drifting and prevents conflicts with GSAP scrubbing.
        glassesGroupRef.current.position.y = prefersReducedMotion ? 0 : Math.sin(elapsedTime * 1.5) * 0.08;
        glassesGroupRef.current.rotation.x = THREE.MathUtils.lerp(glassesGroupRef.current.rotation.x, pointerTarget.y * 0.035, 0.035);
        glassesGroupRef.current.rotation.y = THREE.MathUtils.lerp(glassesGroupRef.current.rotation.y, pointerTarget.x * 0.055, 0.035);
      }

      // Keep light tracking model position
      if (highlightLight && !prefersReducedMotion) {
        highlightLight.position.x = Math.sin(elapsedTime) * 3;
        highlightLight.position.y = Math.cos(elapsedTime) * 3;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. ResizeObserver handling (Core mandate item in user prompt)
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      const w = entry.contentRect.width || containerRef.current?.clientWidth || width;
      const h = entry.contentRect.height || containerRef.current?.clientHeight || height;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAIN_CANVAS_DPR));
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // 10. Cleanups
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', handlePointerMove);
      resizeObserver.disconnect();
      mm.revert(); // Reverts matchMedia states cleanly and cleans up internal elements
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

      // Dispose scene resources recursively
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (!obj.geometry.userData.cached) {
            obj.geometry.dispose();
          }
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat) => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      geometryCacheRef.current.forEach((geometry) => geometry.dispose());
      geometryCacheRef.current.clear();
      tortoiseTextureRef.current?.dispose();
      tortoiseTextureRef.current = null;
      renderer.dispose();
    };
  }, []);

  if (hasWebGLError) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      id="specs-canvas-container"
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-0 transition-opacity duration-700 ease-out"
        style={{ opacity: isReady ? 1 : 0 }}
      />
    </div>
  );
}
