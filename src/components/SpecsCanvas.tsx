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
}

export default function SpecsCanvas({ customization, onScrollSectionChange }: SpecsCanvasProps) {
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
  const specsGroupRef = useRef<THREE.Group | null>(null);
  const glassesGroupRef = useRef<THREE.Group | null>(null); // holds dynamic parts
  const caseGroupRef = useRef<THREE.Group | null>(null);
  const lidPivotRef = useRef<THREE.Group | null>(null);
  const stageGroupRef = useRef<THREE.Group | null>(null);

  // State to track loaded / ready status
  const [isReady, setIsReady] = useState(false);

  // Re-generate geometry when style changes
  useEffect(() => {
    if (!glassesGroupRef.current) return;

    // Clear previous geometries/meshes from glassesGroup
    while (glassesGroupRef.current.children.length > 0) {
      const obj = glassesGroupRef.current.children[0];
      glassesGroupRef.current.remove(obj);
      // Recursively dispose geometries and materials
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    // Colors mapping from customization properties
    const style = customization.style;
    const isGoldHinge = customization.hingeGold;

    // Materials
    const frameMaterial = frameMaterialRef.current || new THREE.MeshPhysicalMaterial();
    const lensMaterial = lensMaterialRef.current || new THREE.MeshPhysicalMaterial();
    const hingeMaterial = hingeMaterialRef.current || new THREE.MeshStandardMaterial();

    hingeMaterial.color.set(isGoldHinge ? '#dfb76c' : '#c0c0c0');
    hingeMaterial.metalness = 0.9;
    hingeMaterial.roughness = 0.15;

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
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.03,
      bevelThickness: 0.03
    };

    // Frame meshes
    const leftFrameGeom = new THREE.ExtrudeGeometry(leftFrameShape, extrudeSettings);
    const rightFrameGeom = new THREE.ExtrudeGeometry(rightFrameShape, extrudeSettings);
    
    // Recenter frame depth origin so scaling is beautifully centered
    leftFrameGeom.center();
    rightFrameGeom.center();

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
      const bridgeTopGeom = new THREE.TubeGeometry(bridgeTopCurve, 16, 0.04 * (customization.transmissionType === 'matte' ? 1.4 : 1.0), 8, false);
      const topBridgeMesh = new THREE.Mesh(bridgeTopGeom, hingeMaterial);
      glassesGroupRef.current.add(topBridgeMesh);

      const bridgeBottomCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.46, 0.12, 0.05),
        new THREE.Vector3(0, 0.16, 0.08),
        new THREE.Vector3(0.46, 0.12, 0.05)
      ]);
      const bridgeBottomGeom = new THREE.TubeGeometry(bridgeBottomCurve, 16, 0.052, 8, false);
      const bottomBridgeMesh = new THREE.Mesh(bridgeBottomGeom, frameMaterial);
      glassesGroupRef.current.add(bottomBridgeMesh);
    } else {
      // Standard Bridge
      const bridgeLength = customization.style === 'round' ? 0.38 : 0.28;
      const bridgeCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.4, 0.12, 0.03),
        new THREE.Vector3(0, 0.22, 0.09),
        new THREE.Vector3(0.4, 0.12, 0.03)
      ]);
      const bridgeGeom = new THREE.TubeGeometry(bridgeCurve, 20, 0.065, 8, false);
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
        const coreGeom = new THREE.TubeGeometry(coreCurve, 20, 0.02, 6, false);
        const coreMesh = new THREE.Mesh(coreGeom, hingeMaterial);
        glassesGroupRef.current.add(coreMesh);
      }
    }

    // Creating highly detailed Lenses
    const lensShapeGeomLeft = new THREE.ShapeGeometry(leftLensShape);
    const lensShapeGeomRight = new THREE.ShapeGeometry(rightLensShape);

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

    const hingeGeom = new THREE.BoxGeometry(0.08, 0.12, 0.15);
    const metalAccentGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.12, 8);
    metalAccentGeom.rotateX(Math.PI / 2);

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
    const leftTempleGeom = new THREE.TubeGeometry(leftTempleCurve, 32, templeAcetateRadius, 8, false);
    const leftTempleMesh = new THREE.Mesh(leftTempleGeom, frameMaterial);
    leftTempleMesh.castShadow = true;
    glassesGroupRef.current.add(leftTempleMesh);

    // Left inner precious titanium core rod (visible when frame is translucent!)
    if (customization.transmissionType === 'translucent') {
      const leftCoreGeom = new THREE.TubeGeometry(leftTempleCurve, 32, templeMetalRadius, 6, false);
      const leftCoreMesh = new THREE.Mesh(leftCoreGeom, hingeMaterial);
      glassesGroupRef.current.add(leftCoreMesh);
    }

    // Right Acetate Sleeve
    const rightTempleGeom = new THREE.TubeGeometry(rightTempleCurve, 32, templeAcetateRadius, 8, false);
    const rightTempleMesh = new THREE.Mesh(rightTempleGeom, frameMaterial);
    rightTempleMesh.castShadow = true;
    glassesGroupRef.current.add(rightTempleMesh);

    // Right inner metal core rod
    if (customization.transmissionType === 'translucent') {
      const rightCoreGeom = new THREE.TubeGeometry(rightTempleCurve, 32, templeMetalRadius, 6, false);
      const rightCoreMesh = new THREE.Mesh(rightCoreGeom, hingeMaterial);
      glassesGroupRef.current.add(rightCoreMesh);
    }

    // Small metal tipping caps at end of tips
    const tipEndGeom = new THREE.SphereGeometry(0.1, 8, 8);
    const leftTipEnd = new THREE.Mesh(tipEndGeom, hingeMaterial);
    leftTipEnd.position.set(templeStartX - 0.082, templeStartY - 0.72, -4.15);
    glassesGroupRef.current.add(leftTipEnd);

    const rightTipEnd = new THREE.Mesh(tipEndGeom, hingeMaterial);
    rightTipEnd.position.set(templeRightStartX + 0.082, templeStartY - 0.72, -4.15);
    glassesGroupRef.current.add(rightTipEnd);

  }, [customization.style, customization.hingeGold, customization.transmissionType, isReady]);

  // Handle live color updating in the active loop seamlessly (very snappy rendering!)
  useEffect(() => {
    if (!frameMaterialRef.current || !lensMaterialRef.current) return;

    // Apply active frame customizations directly to materials to animate in real-time
    const fMat = frameMaterialRef.current;
    const lMat = lensMaterialRef.current;

    // Frame Colors definition mapping
    const frameColors: Record<string, { hex: string; transmission: number; opacity: number; roughness: number; metalness: number }> = {
      'matte-black': { hex: '#16161a', transmission: 0.0, opacity: 1.0, roughness: 0.85, metalness: 0.1 },
      'champagne-crystal': { hex: '#eedbb0', transmission: 0.95, opacity: 0.65, roughness: 0.08, metalness: 0.05 },
      'polished-amber': { hex: '#d97706', transmission: 0.45, opacity: 0.9, roughness: 0.12, metalness: 0.05 },
      'rose-acetate': { hex: '#fda4af', transmission: 0.8, opacity: 0.75, roughness: 0.15, metalness: 0.05 },
      'pure-gold': { hex: '#d4af37', transmission: 0.0, opacity: 1.0, roughness: 0.2, metalness: 0.95 },
      'platinum': { hex: '#e2e8f0', transmission: 0.0, opacity: 1.0, roughness: 0.1, metalness: 0.9 }
    };

    // Lens Colors definition mapping
    const lensColors: Record<string, { hex: string; transmission: number; opacity: number; roughness: number; metalness: number }> = {
      'solar-charcoal': { hex: '#0f172a', transmission: 0.5, opacity: 0.88, roughness: 0.05, metalness: 0.2 },
      'blue-block': { hex: '#38bdf8', transmission: 0.85, opacity: 0.6, roughness: 0.02, metalness: 0.45 },
      'sunset-gold': { hex: '#f59e0b', transmission: 0.65, opacity: 0.78, roughness: 0.05, metalness: 0.75 },
      'forest-ocean': { hex: '#0d9488', transmission: 0.7, opacity: 0.82, roughness: 0.05, metalness: 0.3 }
    };

    const fConfig = frameColors[customization.frameColor] || frameColors['matte-black'];
    const lConfig = lensColors[customization.lensColor] || lensColors['solar-charcoal'];

    // Update Frame material
    fMat.color.set(fConfig.hex);
    fMat.roughness = fConfig.roughness;
    fMat.metalness = fConfig.metalness;
    fMat.transmission = customization.transmissionType === 'translucent' ? Math.max(0.7, fConfig.transmission) : (customization.transmissionType === 'matte' ? 0 : fConfig.transmission);
    fMat.thickness = 0.8;
    fMat.opacity = customization.transmissionType === 'translucent' ? 0.78 : fConfig.opacity;
    fMat.ior = 1.48;
    fMat.transparent = fMat.opacity < 1.0 || fMat.transmission > 0;
    fMat.needsUpdate = true;

    // Update Lens material
    lMat.color.set(lConfig.hex);
    lMat.roughness = lConfig.roughness;
    lMat.metalness = lConfig.metalness;
    lMat.transmission = lConfig.transmission;
    lMat.opacity = lConfig.opacity;
    lMat.thickness = 0.2;
    lMat.ior = 1.54;
    lMat.transparent = true;
    lMat.clearcoat = 1.0;
    lMat.clearcoatRoughness = 0.05;
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
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight('#ffffff', 1.0);
    scene.add(ambientLight);

    // Warm Key Directional Light
    const dirLight1 = new THREE.DirectionalLight('#fff7ed', 3.5);
    dirLight1.position.set(5, 5, 6);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    dirLight1.shadow.bias = -0.0002;
    scene.add(dirLight1);

    // Soft Blue Fill Light
    const dirLight2 = new THREE.DirectionalLight('#eff6ff', 2.0);
    dirLight2.position.set(-5, 2, 4);
    scene.add(dirLight2);

    // Top Rim Light
    const rimLight = new THREE.DirectionalLight('#ffffff', 3.0);
    rimLight.position.set(0, 8, -5);
    scene.add(rimLight);

    // Point Light next to frame center for high specular highlights
    const highlightLight = new THREE.PointLight('#dfb76c', 1.5, 10);
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
      transparent: true
    });
    const hingeMaterial = new THREE.MeshStandardMaterial({
      color: '#dfb76c',
      metalness: 0.95,
      roughness: 0.1
    });

    frameMaterialRef.current = frameMaterial;
    lensMaterialRef.current = lensMaterial;
    hingeMaterialRef.current = hingeMaterial;

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
    const stageBaseGeom = new THREE.CylinderGeometry(1.8, 1.8, 0.1, 64);
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
    const stageGoldTrimGeom = new THREE.CylinderGeometry(1.805, 1.805, 0.03, 64);
    const stageGoldTrimMat = new THREE.MeshStandardMaterial({
      color: '#dfb76c',
      roughness: 0.15,
      metalness: 0.95
    });
    const stageGoldTrimMesh = new THREE.Mesh(stageGoldTrimGeom, stageGoldTrimMat);
    stageGoldTrimMesh.position.y = 0.037; // Raised slightly to create a gold raised lip above the plinth
    stageGroup.add(stageGoldTrimMesh);

    // Emissive Glowing Ring at the stage edge
    const ringGeom = new THREE.TorusGeometry(1.76, 0.012, 8, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#dfb76c',
      toneMapped: false
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.055; // Raised slightly to sit perfectly on top of the gold trim lip
    stageGroup.add(ringMesh);

    // Trigger state to show canvas is ready
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
      specsGroup.position.set(0, -0.15, 1.25);
      specsGroup.rotation.set(0.12, 0, 0); // Front-facing / centered!
      specsGroup.scale.set(0.001, 0.001, 0.001); // Start completely tiny (concealed inside)

      caseGroup.position.set(0, -0.1, 1.25);
      caseGroup.rotation.set(0.12, 0, 0); // Centered!
      caseGroup.scale.set(1.1, 1.1, 1.1);
      lidPivot.rotation.x = 0; // Case lid is closed!

      // Initialize HTML elements to hidden layout states
      gsap.set('#main-navigation', { opacity: 0, y: -40 });
      gsap.set('#hero-left-text', { opacity: 0, x: -50 });
      gsap.set('#hero-right-text', { opacity: 0, x: 50 });
      gsap.set('#hero-scroll-indicator', { opacity: 0, y: 30 });
      gsap.set('#hero-footer-details', { opacity: 0, y: 20 });
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
        z: 1.35,
        ease: 'power2.out'
      }, 0.05);

      tl.to(specsGroup.scale, {
        x: isDesktop ? 1.25 : (isTablet ? 1.15 : 0.95),
        y: isDesktop ? 1.25 : (isTablet ? 1.15 : 0.95),
        z: isDesktop ? 1.25 : (isTablet ? 1.15 : 0.95),
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
      }, 0.38);

      tl.to('#hero-right-text', {
        opacity: 1,
        x: 0,
        ease: 'power2.out'
      }, 0.38);

      tl.to('#hero-scroll-indicator', {
        opacity: 1,
        y: 0,
        ease: 'power2.out'
      }, 0.42);

      tl.to('#hero-footer-details', {
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

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Gentle floating waving movement based on elapsed time to feel organic
      if (specsGroup) {
        const scrollFraction = window.scrollY / window.innerHeight;
        if (scrollFraction < 0.15) {
          // Slow passive wiggle when sitting in the case (Hero), keeping it centered
          specsGroup.rotation.y = Math.sin(elapsedTime * 0.3) * 0.05;
        }
      }

      if (glassesGroupRef.current) {
        // Float the child mesh cleanly rather than the parent specsGroup,
        // which prevents vertical drifting and prevents conflicts with GSAP scrubbing.
        glassesGroupRef.current.position.y = Math.sin(elapsedTime * 1.5) * 0.08;
      }

      // Keep light tracking model position
      if (highlightLight) {
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
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // 10. Cleanups
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      mm.revert(); // Reverts matchMedia states cleanly and cleans up internal elements
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

      // Dispose scene resources recursively
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat) => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="specs-canvas-container"
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 10 }}
    >
      <div className="absolute top-4 left-4 z-40 bg-neutral-950/80 backdrop-blur-md px-4 py-2 rounded-full border border-neutral-800 flex items-center gap-2 shadow-lg text-xs font-mono text-neutral-300">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-semibold tracking-wider">OPTIQUE™ REAL-TIME ENGINE</span>
      </div>

      {/* Sleek Theme Tech Labels */}
      <div className="absolute top-20 left-6 flex flex-col gap-1 z-40 hidden sm:flex pointer-events-auto bg-neutral-950/50 backdrop-blur-md p-3 rounded-lg border border-neutral-800">
        <div className="text-[10px] font-mono text-[#b5a68e] tracking-wider font-bold">CALIBRATION READOUTS:</div>
        <div className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">ROTATION: <span className="text-neutral-200 font-semibold">DYNAMIC SCROLL</span></div>
        <div className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">ELEVATION: <span className="text-neutral-200 font-semibold">12.0° ATELIER</span></div>
        <div className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">ENGINE: <span className="text-neutral-200 font-semibold">WEBGL THREE.JS</span></div>
      </div>
      
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-0 transition-opacity duration-700 ease-out"
        style={{ opacity: isReady ? 1 : 0 }}
      />
    </div>
  );
}
