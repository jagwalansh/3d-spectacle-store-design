import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface SpectacleCardCanvasProps {
  style: 'round' | 'rectangular' | 'aviator';
  frameColor: string;
  lensColor: string;
}

export default function SpectacleCardCanvas({ style, frameColor, lensColor }: SpectacleCardCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isVisibleRef = useRef(false);
  const [hasEnteredView, setHasEnteredView] = useState(false);
  const [hasWebGLError, setHasWebGLError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!('IntersectionObserver' in window)) {
      isVisibleRef.current = true;
      setHasEnteredView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          setHasEnteredView(true);
        }
      },
      { rootMargin: '240px 0px', threshold: 0.01 }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (hasWebGLError || !hasEnteredView || !canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 250;
    const height = containerRef.current.clientHeight || 112;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = null;

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 0, 5.0);

    // 3. Renderer Setup
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power'
      });
    } catch (error) {
      console.warn('WebGL is unavailable for the product card preview.', error);
      setHasWebGLError(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight('#ffffff', 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight('#ffffff', 2.0);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight('#ffffff', 1.0);
    rimLight.position.set(-2, -2, -2);
    scene.add(rimLight);

    // 5. Materials
    const frameColors: Record<string, { hex: string; roughness: number; metalness: number; transmission?: number; opacity?: number }> = {
      'matte-black': { hex: '#16161a', roughness: 0.8, metalness: 0.1 },
      'champagne-crystal': { hex: '#eedbb0', roughness: 0.1, metalness: 0.1, transmission: 0.9, opacity: 0.7 },
      'polished-amber': { hex: '#d97706', roughness: 0.15, metalness: 0.1 },
      'rose-acetate': { hex: '#fda4af', roughness: 0.15, metalness: 0.1, transmission: 0.8, opacity: 0.75 },
      'pure-gold': { hex: '#d4af37', roughness: 0.2, metalness: 0.95 },
      'platinum': { hex: '#cbd5e1', roughness: 0.15, metalness: 0.9 }
    };

    const lensColors: Record<string, string> = {
      'solar-charcoal': '#0f172a',
      'blue-block': '#38bdf8',
      'sunset-gold': '#f59e0b',
      'forest-ocean': '#0d9488'
    };

    const fConfig = frameColors[frameColor] || frameColors['matte-black'];
    const lHex = lensColors[lensColor] || lensColors['solar-charcoal'];

    const frameMaterial = new THREE.MeshPhysicalMaterial({
      color: fConfig.hex,
      roughness: fConfig.roughness,
      metalness: fConfig.metalness,
      transmission: fConfig.transmission || 0,
      opacity: fConfig.opacity !== undefined ? fConfig.opacity : 1.0,
      transparent: fConfig.opacity !== undefined || (fConfig.transmission || 0) > 0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });

    const lensMaterial = new THREE.MeshPhysicalMaterial({
      color: lHex,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.8,
      opacity: 0.6,
      transparent: true,
      side: THREE.DoubleSide
    });

    const metalMaterial = new THREE.MeshStandardMaterial({
      color: '#dfb76c',
      metalness: 0.9,
      roughness: 0.2
    });

    // 6. Geometries
    const glassesGroup = new THREE.Group();
    scene.add(glassesGroup);

    const eyeSpacing = 0.9;

    const leftFrameShape = new THREE.Shape();
    const rightFrameShape = new THREE.Shape();
    const leftLensShape = new THREE.Shape();
    const rightLensShape = new THREE.Shape();

    if (style === 'round') {
      const radiusOuter = 0.65;
      const radiusInner = 0.55;

      leftFrameShape.absarc(-eyeSpacing, 0, radiusOuter, 0, Math.PI * 2, false);
      rightFrameShape.absarc(eyeSpacing, 0, radiusOuter, 0, Math.PI * 2, false);

      const leftHole = new THREE.Path();
      leftHole.absarc(-eyeSpacing, 0, radiusInner, 0, Math.PI * 2, true);
      leftFrameShape.holes.push(leftHole);

      const rightHole = new THREE.Path();
      rightHole.absarc(eyeSpacing, 0, radiusInner, 0, Math.PI * 2, true);
      rightFrameShape.holes.push(rightHole);

      leftLensShape.absarc(-eyeSpacing, 0, radiusInner, 0, Math.PI * 2, false);
      rightLensShape.absarc(eyeSpacing, 0, radiusInner, 0, Math.PI * 2, false);

    } else if (style === 'rectangular') {
      const wOuter = 0.8;
      const hOuter = 0.5;
      const rOuter = 0.15;

      const wInner = 0.7;
      const hInner = 0.4;
      const rInner = 0.1;

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

      drawRoundedRect(leftFrameShape, -eyeSpacing, 0, wOuter, hOuter, rOuter, false);
      drawRoundedRect(rightFrameShape, eyeSpacing, 0, wOuter, hOuter, rOuter, false);

      const leftHole = new THREE.Path();
      drawRoundedRect(leftHole, -eyeSpacing, 0, wInner, hInner, rInner, true);
      leftFrameShape.holes.push(leftHole);

      const rightHole = new THREE.Path();
      drawRoundedRect(rightHole, eyeSpacing, 0, wInner, hInner, rInner, true);
      rightFrameShape.holes.push(rightHole);

      drawRoundedRect(leftLensShape, -eyeSpacing, 0, wInner, hInner, rInner, false);
      drawRoundedRect(rightLensShape, eyeSpacing, 0, wInner, hInner, rInner, false);

    } else { // aviator
      const scaleX = 0.72;
      const scaleY = 0.68;

      const drawAviatorRim = (s: THREE.Shape | THREE.Path, cx: number, flipX = false, sizeFactor = 1.0, clockwise = false) => {
        const mul = flipX ? -1 : 1;
        const sx = scaleX * sizeFactor;
        const sy = scaleY * sizeFactor;

        const pts = [
          new THREE.Vector2(0, 0.55 * sy),
          new THREE.Vector2(0.85 * sx, 0.45 * sy),
          new THREE.Vector2(0.95 * sx, -0.15 * sy),
          new THREE.Vector2(0.45 * sx, -0.85 * sy),
          new THREE.Vector2(-0.25 * sx, -0.9 * sy),
          new THREE.Vector2(-0.85 * sx, -0.35 * sy),
          new THREE.Vector2(-0.75 * sx, 0.35 * sy)
        ];

        if (clockwise) {
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
        } else {
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
      };

      drawAviatorRim(leftFrameShape, -eyeSpacing, false, 1.05, false);
      drawAviatorRim(rightFrameShape, eyeSpacing, true, 1.05, false);

      const leftHole = new THREE.Path();
      drawAviatorRim(leftHole, -eyeSpacing, false, 0.92, true);
      leftFrameShape.holes.push(leftHole);

      const rightHole = new THREE.Path();
      drawAviatorRim(rightHole, eyeSpacing, true, 0.92, true);
      rightFrameShape.holes.push(rightHole);

      drawAviatorRim(leftLensShape, -eyeSpacing, false, 0.92, false);
      drawAviatorRim(rightLensShape, eyeSpacing, true, 0.92, false);
    }

    const extrudeSettings = {
      depth: 0.1,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02
    };

    const leftFrameGeom = new THREE.ExtrudeGeometry(leftFrameShape, extrudeSettings);
    const rightFrameGeom = new THREE.ExtrudeGeometry(rightFrameShape, extrudeSettings);
    leftFrameGeom.center();
    rightFrameGeom.center();

    const leftFrameMesh = new THREE.Mesh(leftFrameGeom, frameMaterial);
    const rightFrameMesh = new THREE.Mesh(rightFrameGeom, frameMaterial);

    leftFrameMesh.position.set(-eyeSpacing, 0, 0);
    rightFrameMesh.position.set(eyeSpacing, 0, 0);

    glassesGroup.add(leftFrameMesh);
    glassesGroup.add(rightFrameMesh);

    // Bridge
    const bridgeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.3, 0.05, 0.02),
      new THREE.Vector3(0, 0.12, 0.05),
      new THREE.Vector3(0.3, 0.05, 0.02)
    ]);
    const bridgeGeom = new THREE.TubeGeometry(bridgeCurve, 10, 0.045, 6, false);
    const bridgeMesh = new THREE.Mesh(bridgeGeom, frameMaterial);
    glassesGroup.add(bridgeMesh);

    if (style === 'aviator') {
      const topCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.35, 0.35, 0.02),
        new THREE.Vector3(0, 0.36, 0.02),
        new THREE.Vector3(0.35, 0.35, 0.02)
      ]);
      const topGeom = new THREE.TubeGeometry(topCurve, 10, 0.025, 6, false);
      const topMesh = new THREE.Mesh(topGeom, metalMaterial);
      glassesGroup.add(topMesh);
    }

    // Lenses
    const leftLensGeom = new THREE.ShapeGeometry(leftLensShape);
    const rightLensGeom = new THREE.ShapeGeometry(rightLensShape);

    const leftLensMesh = new THREE.Mesh(leftLensGeom, lensMaterial);
    const rightLensMesh = new THREE.Mesh(rightLensGeom, lensMaterial);
    leftLensMesh.position.set(0, 0, 0.04);
    rightLensMesh.position.set(0, 0, 0.04);

    glassesGroup.add(leftLensMesh);
    glassesGroup.add(rightLensMesh);

    // Temples (simple backward cylinders)
    const templeGeom = new THREE.CylinderGeometry(0.04, 0.03, 2.6);
    templeGeom.rotateX(Math.PI / 2);
    templeGeom.translate(0, 0, -1.3);

    const leftTemple = new THREE.Mesh(templeGeom, frameMaterial);
    leftTemple.position.set(-eyeSpacing - 0.45, 0.05, 0);
    leftTemple.rotation.y = 0.05;
    glassesGroup.add(leftTemple);

    const rightTemple = new THREE.Mesh(templeGeom, frameMaterial);
    rightTemple.position.set(eyeSpacing + 0.45, 0.05, 0);
    rightTemple.rotation.y = -0.05;
    glassesGroup.add(rightTemple);

    // Position overall glasses
    glassesGroup.position.set(0, 0.05, 0);
    glassesGroup.rotation.x = 0.15; // tilt slightly forward

    // 7. Animation Loop
    let clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisibleRef.current || document.hidden) return;

      const elapsedTime = clock.getElapsedTime();

      // Slow elegant 3D rotation
      glassesGroup.rotation.y = elapsedTime * 0.45;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Resize handling
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    };
  }, [hasEnteredView, style, frameColor, lensColor]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
