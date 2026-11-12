import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Play, Pause, Camera, Download, Box } from 'lucide-react';
import { parseEquation } from '../../engines/parser/expressionParser';
import { ExportService } from '../../services/export/exportService';

interface ThreeCanvasProps {
  equationStr: string;
  resolution?: number;
  colorMap?: 'viridis' | 'plasma' | 'coolwarm' | 'spectral' | 'neon';
  wireframe?: boolean;
  showAxes?: boolean;
  showGrid?: boolean;
  isAnimated?: boolean;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  equationStr,
  resolution = 60,
  colorMap = 'viridis',
  wireframe = false,
  showAxes = true,
  showGrid = true,
  isAnimated = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const wireframeMeshRef = useRef<THREE.LineSegments | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  const [animating, setAnimating] = useState(isAnimated);

  // Colormap color generator
  const getColorForHeight = (normalizedZ: number, cmap: string): THREE.Color => {
    const t = Math.max(0, Math.min(1, normalizedZ));
    const c = new THREE.Color();

    if (cmap === 'plasma') {
      c.setHSL(0.8 - t * 0.75, 1.0, 0.5 + t * 0.2);
    } else if (cmap === 'coolwarm') {
      c.setRGB(t, 0.3, 1 - t);
    } else if (cmap === 'spectral') {
      c.setHSL((1 - t) * 0.7, 1.0, 0.5);
    } else if (cmap === 'neon') {
      c.setRGB(Math.sin(t * Math.PI), t, 1);
    } else {
      // Default: Viridis-like
      c.setHSL(0.6 - t * 0.5, 0.9, 0.45 + t * 0.25);
    }
    return c;
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = 550;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(16, 14, 16);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 60;
    controls.minDistance = 3;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(15, 25, 15);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x71717a, 0.4);
    dirLight2.position.set(-15, -10, -15);
    scene.add(dirLight2);

    // Coordinate Axes
    let axesHelper: THREE.AxesHelper | null = null;
    if (showAxes) {
      axesHelper = new THREE.AxesHelper(6);
      scene.add(axesHelper);
    }

    // Floor Grid
    let gridHelper: THREE.GridHelper | null = null;
    if (showGrid) {
      gridHelper = new THREE.GridHelper(16, 16, 0x3f3f46, 0x18181b);
      gridHelper.position.y = -4;
      scene.add(gridHelper);
    }

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      cameraRef.current.aspect = w / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [showAxes, showGrid]);

  // Mesh creation and parameter animation
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Remove old meshes
    if (meshRef.current) scene.remove(meshRef.current);
    if (wireframeMeshRef.current) scene.remove(wireframeMeshRef.current);

    const parsed = parseEquation(equationStr);
    const compileFn = parsed.compiledFn || ((scope: any) => scope.x * scope.x - scope.y * scope.y);

    const size = 10;
    const segments = Math.max(20, Math.min(120, resolution));
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const pos = geometry.attributes.position;
    const colors: number[] = [];

    // Pre-calculate z values to normalize heights for colormap
    const zVals: number[] = [];
    const tVal = timeRef.current;

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      try {
        let val = compileFn({ x: vx, y: vz, t: tVal });
        if (isNaN(val) || !isFinite(val)) val = 0;
        val = Math.max(-10, Math.min(10, val));
        zVals.push(val);
      } catch {
        zVals.push(0);
      }
    }

    let minZ = Math.min(...zVals);
    let maxZ = Math.max(...zVals);
    if (minZ === maxZ) {
      minZ -= 1;
      maxZ += 1;
    }

    for (let i = 0; i < pos.count; i++) {
      const z = zVals[i];
      pos.setY(i, z);

      const norm = (z - minZ) / (maxZ - minZ);
      const color = getColorForHeight(norm, colorMap);
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.35,
      metalness: 0.15,
      wireframe: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    meshRef.current = mesh;

    if (wireframe) {
      const wireGeo = new THREE.WireframeGeometry(geometry);
      const wireMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 1,
        transparent: true,
        opacity: 0.35,
      });
      const wireframeMesh = new THREE.LineSegments(wireGeo, wireMat);
      scene.add(wireframeMesh);
      wireframeMeshRef.current = wireframeMesh;
    }

    if (rendererRef.current && cameraRef.current) {
      rendererRef.current.render(scene, cameraRef.current);
    }
  }, [equationStr, resolution, colorMap, wireframe]);

  // Animation Loop for dynamic variable t
  useEffect(() => {
    const animate = () => {
      if (controlsRef.current) controlsRef.current.update();

      if (animating && meshRef.current) {
        timeRef.current += 0.03;
        const geom = meshRef.current.geometry as THREE.BufferGeometry;
        const pos = geom.attributes.position;
        const colorAttr = geom.attributes.color;
        const parsed = parseEquation(equationStr);
        const compileFn = parsed.compiledFn;

        if (compileFn) {
          const zVals: number[] = [];
          for (let i = 0; i < pos.count; i++) {
            const vx = pos.getX(i);
            const vz = pos.getZ(i);
            try {
              let val = compileFn({ x: vx, y: vz, t: timeRef.current });
              if (isNaN(val) || !isFinite(val)) val = 0;
              val = Math.max(-10, Math.min(10, val));
              zVals.push(val);
            } catch {
              zVals.push(0);
            }
          }

          let minZ = Math.min(...zVals);
          let maxZ = Math.max(...zVals);
          if (minZ === maxZ) {
            minZ -= 1;
            maxZ += 1;
          }

          for (let i = 0; i < pos.count; i++) {
            const z = zVals[i];
            pos.setY(i, z);
            const norm = (z - minZ) / (maxZ - minZ);
            const color = getColorForHeight(norm, colorMap);
            colorAttr.setXYZ(i, color.r, color.g, color.b);
          }

          pos.needsUpdate = true;
          colorAttr.needsUpdate = true;
          geom.computeVertexNormals();
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [animating, equationStr, colorMap]);

  const handleResetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(16, 14, 16);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const handleExportPNG = () => {
    if (rendererRef.current) {
      ExportService.exportCanvasPNG(rendererRef.current.domElement, 'mathvision-3d-surface');
    }
  };

  return (
    <div className="relative rounded-md border border-border bg-panel overflow-hidden">
      {/* 3D Viewport Controls Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-border bg-panel-hover/50 text-xs">
        <div className="flex items-center gap-2">
          <Box className="w-3.5 h-3.5 text-text-main" />
          <span className="font-bold text-text-main">3D Surface Viewport</span>
          <span className="text-text-muted hidden sm:inline text-xs">
            (Rotate: Left-drag, Pan: Right-drag, Zoom: Scroll)
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setAnimating(!animating)}
            className={`p-1 rounded-sm transition-colors flex items-center gap-1 text-xs ${
              animating ? 'bg-text-main text-background font-bold' : 'text-text-muted hover:bg-panel'
            }`}
            title={animating ? 'Pause Animation' : 'Animate Time (t)'}
          >
            {animating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="text-xs">t</span>
          </button>
          <button
            onClick={handleResetCamera}
            className="p-1 rounded-sm hover:bg-border/50 text-text-muted hover:text-text-main transition-colors"
            title="Reset Camera Angle"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleExportPNG}
            className="p-1 rounded-sm hover:bg-border/50 text-text-muted hover:text-text-main transition-colors"
            title="Export 3D Snapshot"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-[550px] cursor-grab active:cursor-grabbing" />
    </div>
  );
};
