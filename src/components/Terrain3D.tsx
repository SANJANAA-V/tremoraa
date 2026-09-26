import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useTelemetry } from '../context/TelemetryContext';
import { NodeDetailPanel } from './NodeDetailPanel';
import { ZoneDetailPanel } from './ZoneDetailPanel';
import { CENTRAL_DEPRESSION } from '../data/mockData';
import {
  Layers,
  RotateCw,
  Sliders,
  Wifi,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface ZoneOverlayPosition {
  id: string;
  title: string;
  nodeCount: number | string;
  subtitle: string;
  worldPos: THREE.Vector3;
  screenX: number;
  screenY: number;
  visible: boolean;
  color: string;
  isGateway?: boolean;
  isDepression?: boolean;
}

export const Terrain3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    nodes,
    zones,
    gateway,
    selectedNode,
    selectedZone,
    selectNode,
    selectZone,
  } = useTelemetry();

  // Survey States: Mar '24 Baseline, Mar '25 Current, ΔZ Differential
  const [surveyState, setSurveyState] = useState<'BASELINE' | 'CURRENT' | 'DIFFERENTIAL'>('DIFFERENTIAL');

  // Camera views
  const [activeCameraView, setActiveCameraView] = useState<'OVERVIEW' | 'CRATER' | 'A' | 'B' | 'C' | 'GATEWAY'>('OVERVIEW');

  // 3D Digital Elevation Controls (Default 80x scale)
  const [verticalScale, setVerticalScale] = useState<number>(80);
  const [showRelayArcs, setShowRelayArcs] = useState<boolean>(true);
  const [showStarFanLinks, setShowStarFanLinks] = useState<boolean>(true);
  const [showStationPillars, setShowStationPillars] = useState<boolean>(true);
  const [showStructuralWireframe, setShowStructuralWireframe] = useState<boolean>(true);
  const [slowTurntableOrbit, setSlowTurntableOrbit] = useState<boolean>(false);

  // Floating 2D Screen-projected badges
  const [zoneBadges, setZoneBadges] = useState<ZoneOverlayPosition[]>([]);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const wireframeMeshRef = useRef<THREE.Mesh | null>(null);
  const arcsGroupRef = useRef<THREE.Group | null>(null);
  const fanGroupRef = useRef<THREE.Group | null>(null);
  const hubsGroupRef = useRef<THREE.Group | null>(null);
  const pillarsGroupRef = useRef<THREE.Group | null>(null);
  const gatewayGroupRef = useRef<THREE.Group | null>(null);
  const craterBeaconGroupRef = useRef<THREE.Group | null>(null);

  // Camera transition animation state
  const cameraTargetRef = useRef<{
    pos: THREE.Vector3;
    lookAt: THREE.Vector3;
    isTransitioning: boolean;
  }>({
    pos: new THREE.Vector3(0, 95, 115),
    lookAt: new THREE.Vector3(0, -6, 0),
    isTransitioning: false,
  });

  const worldSize = 130;
  const gridResolution = 110;

  // Convert GPS (lat, lng) to local 3D coordinates (x, z)
  // Center: [22.3678, 82.6322] -> (0, 0)
  const gpsTo3D = useMemo(() => {
    return (lat: number, lng: number): [number, number] => {
      const centerLat = 22.3678;
      const centerLng = 82.6322;
      const x = (lng - centerLng) * 5800;
      const z = -(lat - centerLat) * 6200;
      return [x, z];
    };
  }, []);

  // Compute elevation displacement at (x, z)
  // Realism update: Central crater is deepest, BUT Zones A, B, and C each show
  // independent realistic dips/unevenness and continuous geological undulation!
  const getElevation = (x: number, z: number, state: 'BASELINE' | 'CURRENT' | 'DIFFERENTIAL') => {
    // 1. Natural multi-harmonic regional topography (rolling hills, bedrock ridges)
    // Ensures surrounding ground is NOT flat, but reads as a realistic terrain surface.
    const regionalTopo =
      Math.sin(x * 0.045) * 3.2 +
      Math.cos(z * 0.038) * 2.8 +
      Math.sin(x * 0.075 + z * 0.06) * 1.6 +
      Math.cos(x * 0.025 - z * 0.055) * 2.0;

    // High elevated bedrock ridge where side gateway sits (Northeast quadrant)
    const ridgeBoost = 3.5 * Math.exp(-((x - 55) * (x - 55) + (z + 35) * (z + 35)) / (2 * 22 * 22));

    const totalNaturalTopo = regionalTopo + ridgeBoost;

    if (state === 'BASELINE') {
      // In baseline survey date, terrain is in its natural pre-subsidence state
      return totalNaturalTopo;
    }

    // 2. CENTRAL CRATER SUBSIDENCE DEPRESSION (Active caving epicenter at (0, 0))
    // Deepest and most dramatic point
    const rCenter = Math.hypot(x, z);
    const centralCrater =
      16.5 * Math.exp(-(rCenter * rCenter) / (2 * 14 * 14)) +
      4.2 * Math.exp(-(rCenter * rCenter) / (2 * 26 * 26));

    // 3. ZONE A (North Perimeter: Longwall Panel Ridge LW-01)
    // Longwall retreat panel creates an elongated subsidence trough with rib-pillar margin
    const [zaX, zaZ] = gpsTo3D(22.3732, 82.6300);
    const dxA = x - zaX;
    const dzA = z - zaZ;
    const distA = Math.sqrt((dxA * dxA) / (18 * 18) + (dzA * dzA) / (11 * 11));
    const subZoneA = 7.4 * Math.exp(-(distA * distA) / 2);

    // 4. ZONE B (Southeast Perimeter: Goaf Flank CV-02)
    // Active caving stage closest to depression; asymmetrical caving trough with ground fractures
    const [zbX, zbZ] = gpsTo3D(22.3648, 82.6375);
    const dxB = x - zbX;
    const dzB = z - zbZ;
    const distB = Math.hypot(dxB, dzB);
    const subZoneB =
      10.8 * Math.exp(-(distB * distB) / (2 * 13 * 13)) +
      1.8 * Math.sin(dxB * 0.35) * Math.exp(-distB / 14);

    // 5. ZONE C (Southwest Perimeter: Barrier Pillar DP-03)
    // Depillaring secondary consolidation: shallower, broader bowl-shaped dip
    const [zcX, zcZ] = gpsTo3D(22.3635, 82.6265);
    const dxC = x - zcX;
    const dzC = z - zcZ;
    const distC = Math.hypot(dxC, dzC);
    const subZoneC = 4.6 * Math.exp(-(distC * distC) / (2 * 14 * 14));

    // Total cumulative subsidence depression across all mining panels
    const totalSubsidence = centralCrater + subZoneA + subZoneB + subZoneC;

    if (state === 'DIFFERENTIAL') {
      // In differential mode, show pure subsidence deformation funnels
      return -totalSubsidence * 1.2;
    }

    // CURRENT survey mode: natural undulating topography minus panel-specific depressions
    return totalNaturalTopo - totalSubsidence;
  };

  // Generate color palette canvas texture for ΔZ Differential / Current / Baseline
  const generateColorTexture = (state: 'BASELINE' | 'CURRENT' | 'DIFFERENTIAL') => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    const centerX = 512;
    const centerY = 512;

    if (state === 'DIFFERENTIAL') {
      // Light geotechnical deformation colormap:
      // Undisturbed outer zones: Muted pale sage / green
      // Slopes: Warm amber / yellow
      // Zone Dips: Orange / Red
      // Central Crater: Deep Crimson
      ctx.fillStyle = '#bbf7d0';
      ctx.fillRect(0, 0, 1024, 1024);

      // Central Subsidence Depression Crater Funnel
      const gradCentral = ctx.createRadialGradient(centerX, centerY, 15, centerX, centerY, 260);
      gradCentral.addColorStop(0, '#991b1b'); // Crimson epicenter
      gradCentral.addColorStop(0.25, '#dc2626');
      gradCentral.addColorStop(0.45, '#ea580c'); // Orange
      gradCentral.addColorStop(0.68, '#f59e0b'); // Amber
      gradCentral.addColorStop(0.85, '#84cc16'); // Lime
      gradCentral.addColorStop(1, '#bbf7d0');
      ctx.fillStyle = gradCentral;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 260, 0, Math.PI * 2);
      ctx.fill();

      // Zone B Trough Dip (Southeast)
      const gradB = ctx.createRadialGradient(730, 680, 10, 730, 680, 150);
      gradB.addColorStop(0, '#dc2626');
      gradB.addColorStop(0.4, '#ea580c');
      gradB.addColorStop(0.7, '#f59e0b');
      gradB.addColorStop(1, '#bbf7d0');
      ctx.fillStyle = gradB;
      ctx.beginPath();
      ctx.arc(730, 680, 150, 0, Math.PI * 2);
      ctx.fill();

      // Zone A Trough Dip (North)
      const gradA = ctx.createRadialGradient(510, 260, 10, 510, 260, 130);
      gradA.addColorStop(0, '#ea580c');
      gradA.addColorStop(0.5, '#f59e0b');
      gradA.addColorStop(0.8, '#84cc16');
      gradA.addColorStop(1, '#bbf7d0');
      ctx.fillStyle = gradA;
      ctx.beginPath();
      ctx.arc(510, 260, 130, 0, Math.PI * 2);
      ctx.fill();

      // Zone C Trough Dip (Southwest)
      const gradC = ctx.createRadialGradient(280, 690, 10, 280, 690, 110);
      gradC.addColorStop(0, '#f59e0b');
      gradC.addColorStop(0.6, '#84cc16');
      gradC.addColorStop(1, '#bbf7d0');
      ctx.fillStyle = gradC;
      ctx.beginPath();
      ctx.arc(280, 690, 110, 0, Math.PI * 2);
      ctx.fill();
    } else if (state === 'BASELINE') {
      // Baseline terrain: light realistic earthy terrain with subtle natural elevation contours
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, 0, 1024, 1024);

      // Natural sandstone & topsoil mottling
      for (let i = 0; i < 400; i++) {
        const rx = Math.random() * 1024;
        const ry = Math.random() * 1024;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(148, 163, 184, 0.4)' : 'rgba(203, 213, 225, 0.5)';
        ctx.beginPath();
        ctx.arc(rx, ry, Math.random() * 40 + 15, 0, Math.PI * 2);
        ctx.fill();
      }

      // Natural contour lines
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.25)';
      ctx.lineWidth = 1.2;
      for (let r = 100; r < 500; r += 50) {
        ctx.beginPath();
        ctx.arc(centerX + 40, centerY - 30, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      // CURRENT Survey Date: Realistic geological terrain with visible depressions under all zones + central crater
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, 0, 1024, 1024);

      // Central crater depression discoloration
      const gradCrater = ctx.createRadialGradient(centerX, centerY, 20, centerX, centerY, 230);
      gradCrater.addColorStop(0, '#64748b'); // Deep shadow in pit
      gradCrater.addColorStop(0.5, '#94a3b8');
      gradCrater.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = gradCrater;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 230, 0, Math.PI * 2);
      ctx.fill();

      // Zone B Goaf Flank depression shading
      const gradB = ctx.createRadialGradient(730, 680, 10, 730, 680, 130);
      gradB.addColorStop(0, '#64748b');
      gradB.addColorStop(0.7, '#94a3b8');
      gradB.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = gradB;
      ctx.beginPath();
      ctx.arc(730, 680, 130, 0, Math.PI * 2);
      ctx.fill();

      // Zone A Longwall depression shading
      const gradA = ctx.createRadialGradient(510, 260, 10, 510, 260, 110);
      gradA.addColorStop(0, '#94a3b8');
      gradA.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = gradA;
      ctx.beginPath();
      ctx.arc(510, 260, 110, 0, Math.PI * 2);
      ctx.fill();

      // Zone C Barrier depression shading
      const gradC = ctx.createRadialGradient(280, 690, 10, 280, 690, 95);
      gradC.addColorStop(0, '#94a3b8');
      gradC.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = gradC;
      ctx.beginPath();
      ctx.arc(280, 690, 95, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  };

  // Main Three.js Scene Setup (Light Institutional Theme)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene with light institutional sky/environment
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9); // Light slate background
    scene.fog = new THREE.FogExp2(0xf1f5f9, 0.0035);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      1,
      1200
    );
    camera.position.set(0, 95, 115);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 + 0.12;
    controls.minDistance = 25;
    controls.maxDistance = 350;
    controls.target.set(0, -6, 0);
    controlsRef.current = controls;

    // 5. Lighting (Clear sunlight for high-relief geotechnical shadows)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.6);
    sunLight.position.set(70, 110, 80);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x94a3b8, 0.6);
    fillLight.position.set(-60, 40, -50);
    scene.add(fillLight);

    // 6. Base perspective underground reference grid (Clean light slate)
    const baseGrid = new THREE.GridHelper(worldSize * 1.25, 26, 0x94a3b8, 0xcbd5e1);
    baseGrid.position.y = -24;
    scene.add(baseGrid);

    // 7. Terrain Surface Mesh
    const planeGeo = new THREE.PlaneGeometry(worldSize, worldSize, gridResolution, gridResolution);
    planeGeo.rotateX(-Math.PI / 2);

    const terrainTexture = generateColorTexture(surveyState);
    const terrainMat = new THREE.MeshStandardMaterial({
      map: terrainTexture,
      roughness: 0.8,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    const terrainMesh = new THREE.Mesh(planeGeo, terrainMat);
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // 8. Structural Grid Wireframe Mesh (Slate blue outline)
    const wireframeGeo = new THREE.PlaneGeometry(worldSize, worldSize, gridResolution / 2, gridResolution / 2);
    wireframeGeo.rotateX(-Math.PI / 2);
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
    const wireframeMesh = new THREE.Mesh(wireframeGeo, wireframeMat);
    scene.add(wireframeMesh);
    wireframeMeshRef.current = wireframeMesh;

    // 9. Central Subsidence Depression Epicenter Ring Beacon in 3D
    const craterGroup = new THREE.Group();
    const craterRingGeo = new THREE.RingGeometry(2.5, 3.2, 32);
    craterRingGeo.rotateX(-Math.PI / 2);
    const craterRingMat = new THREE.MeshBasicMaterial({
      color: 0xb91c1c,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const craterRing = new THREE.Mesh(craterRingGeo, craterRingMat);
    craterGroup.add(craterRing);

    const craterCenterGeo = new THREE.SphereGeometry(0.75, 16, 16);
    const craterCenterMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
    const craterCenterMesh = new THREE.Mesh(craterCenterGeo, craterCenterMat);
    craterCenterMesh.position.y = 1.0;
    craterGroup.add(craterCenterMesh);

    scene.add(craterGroup);
    craterBeaconGroupRef.current = craterGroup;

    // 10. Central Gateway 3D Mast (Positioned on the SIDE of the map on stable ridge)
    const [gwX, gwZ] = gpsTo3D(gateway.lat, gateway.lng);
    const gwGroup = new THREE.Group();
    gwGroup.position.set(gwX, 0, gwZ);

    // Gateway base station building
    const gwBaseGeo = new THREE.BoxGeometry(4.2, 2.2, 4.2);
    const gwBaseMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
    const gwBase = new THREE.Mesh(gwBaseGeo, gwBaseMat);
    gwBase.position.y = 1.1;
    gwGroup.add(gwBase);

    // Gateway tall steel lattice mast
    const mastGeo = new THREE.CylinderGeometry(0.35, 0.65, 14, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.y = 8.5;
    gwGroup.add(mast);

    // Parabolic antenna dish
    const dishGeo = new THREE.CylinderGeometry(1.8, 0.4, 0.8, 16);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.y = 14.5;
    gwGroup.add(dish);

    // Wi-SUN root beacon
    const beaconGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 15.8;
    gwGroup.add(beacon);

    scene.add(gwGroup);
    gatewayGroupRef.current = gwGroup;

    // 11. Groups for Pillars, Hubs, Fan links, and Arcs
    const pillarsGroup = new THREE.Group();
    scene.add(pillarsGroup);
    pillarsGroupRef.current = pillarsGroup;

    const hubsGroup = new THREE.Group();
    scene.add(hubsGroup);
    hubsGroupRef.current = hubsGroup;

    const fanGroup = new THREE.Group();
    scene.add(fanGroup);
    fanGroupRef.current = fanGroup;

    const arcsGroup = new THREE.Group();
    scene.add(arcsGroup);
    arcsGroupRef.current = arcsGroup;

    // 12. Animation Loop & Screen Space Projection
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Camera smooth interpolation transition
      if (cameraTargetRef.current.isTransitioning) {
        camera.position.lerp(cameraTargetRef.current.pos, 0.05);
        controls.target.lerp(cameraTargetRef.current.lookAt, 0.05);

        if (
          camera.position.distanceTo(cameraTargetRef.current.pos) < 0.2 &&
          controls.target.distanceTo(cameraTargetRef.current.lookAt) < 0.2
        ) {
          cameraTargetRef.current.isTransitioning = false;
        }
      }

      controls.autoRotate = slowTurntableOrbit;
      controls.autoRotateSpeed = 1.0;
      controls.update();

      // Gentle beacon pulse
      beacon.scale.setScalar(1.0 + Math.sin(elapsedTime * 3) * 0.12);
      craterCenterMesh.scale.setScalar(1.0 + Math.sin(elapsedTime * 2.5) * 0.15);

      // Project 3D Zone, Crater & Gateway coordinates to 2D screen positions for floating badges
      if (container) {
        const width = container.clientWidth;
        const height = container.clientHeight;

        const badgesData: ZoneOverlayPosition[] = [];
        const scaleFactor = verticalScale / 20;

        // 1. Central Subsidence Depression Badge
        const cdGroundY = getElevation(0, 0, surveyState) * scaleFactor;
        const cdWorldPos = new THREE.Vector3(0, cdGroundY + 8, 0);
        const cdProjected = cdWorldPos.clone().project(camera);
        badgesData.push({
          id: 'CRATER',
          title: 'Central Subsidence Depression',
          nodeCount: 'CRATER',
          subtitle: 'Active Caving Epicenter (-168mm)',
          worldPos: cdWorldPos,
          screenX: ((cdProjected.x + 1) * width) / 2,
          screenY: ((-cdProjected.y + 1) * height) / 2,
          visible: cdProjected.z < 1.0,
          color: '#b91c1c',
          isDepression: true,
        });

        // 2. Exactly 3 Perimeter Zones
        const zoneDisplayConfigs = [
          {
            id: 'A',
            title: 'Zone A – North Perimeter',
            subtitle: 'Panel LW-01 Longwall Ridge',
            count: 5,
            color: '#b45309',
            center: [22.3732, 82.6300],
          },
          {
            id: 'B',
            title: 'Zone B – Southeast Perimeter',
            subtitle: 'Panel CV-02 Goaf Flank',
            count: 5,
            color: '#b91c1c',
            center: [22.3648, 82.6375],
          },
          {
            id: 'C',
            title: 'Zone C – Southwest Perimeter',
            subtitle: 'Panel DP-03 Barrier Pillar',
            count: 5,
            color: '#15803d',
            center: [22.3635, 82.6265],
          },
        ];

        zoneDisplayConfigs.forEach((zConf) => {
          const [zx, zz] = gpsTo3D(zConf.center[0], zConf.center[1]);
          const zy = getElevation(zx, zz, surveyState) * scaleFactor;
          const worldPos = new THREE.Vector3(zx, zy + 10, zz);

          const projected = worldPos.clone().project(camera);
          badgesData.push({
            id: zConf.id,
            title: zConf.title,
            nodeCount: zConf.count,
            subtitle: zConf.subtitle,
            worldPos,
            screenX: ((projected.x + 1) * width) / 2,
            screenY: ((-projected.y + 1) * height) / 2,
            visible: projected.z < 1.0,
            color: zConf.color,
          });
        });

        // 3. Central Gateway Badge (Strictly Wi-SUN NLN0721)
        const gwGroundY = getElevation(gwX, gwZ, surveyState) * scaleFactor;
        const gwWorldPos = new THREE.Vector3(gwX, gwGroundY + 18, gwZ);
        const gwProjected = gwWorldPos.clone().project(camera);

        badgesData.push({
          id: 'GATEWAY',
          title: 'Central Gateway (Wi-SUN-to-Cloud Relay)',
          nodeCount: '15 Masts',
          subtitle: 'Wi-SUN Mesh Relay (NLN0721, IN865 MHz)',
          worldPos: gwWorldPos,
          screenX: ((gwProjected.x + 1) * width) / 2,
          screenY: ((-gwProjected.y + 1) * height) / 2,
          visible: gwProjected.z < 1.0,
          color: '#1d4ed8',
          isGateway: true,
        });

        setZoneBadges(badgesData);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Raycasting for interactive click on nodes
    const handlePointerDown = (event: MouseEvent) => {
      if (!container || !cameraRef.current || !pillarsGroupRef.current) return;
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(pillarsGroupRef.current.children, true);

      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && !obj.userData?.node && obj.parent) {
          obj = obj.parent;
        }
        if (obj?.userData?.node) {
          selectNode(obj.userData.node);
        }
      }
    };

    container.addEventListener('click', handlePointerDown);

    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('click', handlePointerDown);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update Mesh Heights, Pillars, Hubs, Star Fan Links, and Gateway when surveyState or verticalScale changes
  useEffect(() => {
    const terrain = terrainMeshRef.current;
    const wireframeMesh = wireframeMeshRef.current;
    const pillarsGroup = pillarsGroupRef.current;
    const hubsGroup = hubsGroupRef.current;
    const fanGroup = fanGroupRef.current;
    const arcsGroup = arcsGroupRef.current;
    const gatewayGroup = gatewayGroupRef.current;
    const craterGroup = craterBeaconGroupRef.current;

    if (!terrain || !wireframeMesh || !pillarsGroup || !hubsGroup || !fanGroup || !arcsGroup) return;

    const scaleFactor = verticalScale / 20;

    // 1. Update terrain surface vertex positions
    const terrainGeo = terrain.geometry as THREE.PlaneGeometry;
    const tPos = terrainGeo.attributes.position;
    for (let i = 0; i < tPos.count; i++) {
      const vx = tPos.getX(i);
      const vz = tPos.getZ(i);
      const elev = getElevation(vx, vz, surveyState);
      tPos.setY(i, elev * scaleFactor);
    }
    tPos.needsUpdate = true;
    terrainGeo.computeVertexNormals();

    // 2. Update wireframe vertex positions
    const wireGeo = wireframeMesh.geometry as THREE.PlaneGeometry;
    const wPos = wireGeo.attributes.position;
    for (let i = 0; i < wPos.count; i++) {
      const vx = wPos.getX(i);
      const vz = wPos.getZ(i);
      const elev = getElevation(vx, vz, surveyState);
      wPos.setY(i, elev * scaleFactor + 0.08); // Slight offset above terrain
    }
    wPos.needsUpdate = true;
    wireGeo.computeVertexNormals();

    wireframeMesh.visible = showStructuralWireframe;

    // Update material texture for survey mode
    const newTex = generateColorTexture(surveyState);
    (terrain.material as THREE.MeshStandardMaterial).map = newTex;
    (terrain.material as THREE.MeshStandardMaterial).needsUpdate = true;

    // 3. Update Crater beacon elevation at (0, 0)
    const craterGroundY = getElevation(0, 0, surveyState) * scaleFactor;
    if (craterGroup) {
      craterGroup.position.set(0, craterGroundY + 0.1, 0);
    }

    // 4. Update Gateway elevation (positioned on the side on stable ridge)
    const [gwX, gwZ] = gpsTo3D(gateway.lat, gateway.lng);
    const gwGroundY = getElevation(gwX, gwZ, surveyState) * scaleFactor;
    if (gatewayGroup) {
      gatewayGroup.position.set(gwX, gwGroundY, gwZ);
    }

    // 5. Build Local Zone Hub Pillars
    hubsGroup.clear();
    const zoneHubWorldPositions: Record<string, THREE.Vector3> = {};

    zones.forEach((zone) => {
      const [hx, hz] = gpsTo3D(zone.hubCoords[0], zone.hubCoords[1]);
      const hubSurfaceY = getElevation(hx, hz, surveyState) * scaleFactor;
      const hubPos = new THREE.Vector3(hx, hubSurfaceY, hz);
      zoneHubWorldPositions[zone.id] = hubPos;

      const hubNodeGroup = new THREE.Group();
      hubNodeGroup.position.copy(hubPos);

      // Octagonal hub pedestal (Slate grey)
      const pedGeo = new THREE.CylinderGeometry(1.2, 1.6, 1.2, 8);
      const pedMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
      const pedMesh = new THREE.Mesh(pedGeo, pedMat);
      pedMesh.position.y = 0.6;
      hubNodeGroup.add(pedMesh);

      // Hub antenna mast
      const hubMastGeo = new THREE.CylinderGeometry(0.2, 0.35, 7.0, 8);
      const hubMastMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });
      const hubMast = new THREE.Mesh(hubMastGeo, hubMastMat);
      hubMast.position.y = 4.2;
      hubNodeGroup.add(hubMast);

      // Distinct zone risk color top beacon
      const riskColor =
        zone.riskLevel === 'critical' ? 0xb91c1c : zone.riskLevel === 'moderate' ? 0xb45309 : 0x15803d;
      const hubTopGeo = new THREE.OctahedronGeometry(0.9);
      const hubTopMat = new THREE.MeshBasicMaterial({ color: riskColor });
      const hubTop = new THREE.Mesh(hubTopGeo, hubTopMat);
      hubTop.position.y = 8.0;
      hubNodeGroup.add(hubTop);

      hubsGroup.add(hubNodeGroup);
    });

    // 6. Build In-Situ Physical Station Pillars for all 15 nodes
    pillarsGroup.clear();
    if (showStationPillars) {
      nodes.forEach((node) => {
        const [nx, nz] = gpsTo3D(node.lat, node.lng);
        const surfaceY = getElevation(nx, nz, surveyState) * scaleFactor;

        const isCrit = node.subsidenceRateMmYr >= 25.0;
        const isMod = node.subsidenceRateMmYr >= 10.0 && node.subsidenceRateMmYr < 25.0;
        const headColor = isCrit ? 0xb91c1c : isMod ? 0xb45309 : 0x15803d;

        const pillarNodeGroup = new THREE.Group();
        pillarNodeGroup.position.set(nx, surfaceY, nz);
        pillarNodeGroup.userData = { node };

        // Vertical in-situ pillar column
        const colHeight = 5.2;
        const colGeo = new THREE.CylinderGeometry(0.22, 0.22, colHeight, 8);
        const colMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5 });
        const colMesh = new THREE.Mesh(colGeo, colMat);
        colMesh.position.y = colHeight / 2;
        pillarNodeGroup.add(colMesh);

        // Cone cap radome housing
        const coneGeo = new THREE.ConeGeometry(0.7, 1.2, 12);
        const coneMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
        const coneMesh = new THREE.Mesh(coneGeo, coneMat);
        coneMesh.position.y = colHeight + 0.6;
        pillarNodeGroup.add(coneMesh);

        // Colored station top marker
        const headGeo = new THREE.SphereGeometry(0.45, 12, 12);
        const headMat = new THREE.MeshBasicMaterial({ color: headColor });
        const headMesh = new THREE.Mesh(headGeo, headMat);
        headMesh.position.y = colHeight + 1.35;
        pillarNodeGroup.add(headMesh);

        // Circular concrete foundation flange
        const ringGeo = new THREE.RingGeometry(0.5, 1.2, 16);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({ color: headColor, side: THREE.DoubleSide });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.y = 0.05;
        pillarNodeGroup.add(ringMesh);

        pillarsGroup.add(pillarNodeGroup);
      });
    }

    // 7. Build Local Zone Star / Fan Links: Connect each node to its Zone Hub
    fanGroup.clear();
    if (showStarFanLinks) {
      nodes.forEach((node) => {
        const hubWorldPos = zoneHubWorldPositions[node.zoneId];
        if (!hubWorldPos) return;

        const [nx, nz] = gpsTo3D(node.lat, node.lng);
        const nodeSurfaceY = getElevation(nx, nz, surveyState) * scaleFactor + 4.5;
        const nodePos = new THREE.Vector3(nx, nodeSurfaceY, nz);
        const targetHubPos = new THREE.Vector3(hubWorldPos.x, hubWorldPos.y + 6.0, hubWorldPos.z);

        const midPoint = new THREE.Vector3(
          (nodePos.x + targetHubPos.x) / 2,
          Math.max(nodePos.y, targetHubPos.y) + 1.5,
          (nodePos.z + targetHubPos.z) / 2
        );

        const curve = new THREE.QuadraticBezierCurve3(nodePos, midPoint, targetHubPos);
        const points = curve.getPoints(20);
        const fanGeo = new THREE.BufferGeometry().setFromPoints(points);

        const fanMat = new THREE.LineDashedMaterial({
          color: 0x0284c7, // Muted institutional blue
          dashSize: 1.2,
          gapSize: 0.6,
          linewidth: 1.5,
          transparent: true,
          opacity: 0.85,
        });

        const fanLine = new THREE.Line(fanGeo, fanMat);
        fanLine.computeLineDistances();
        fanGroup.add(fanLine);
      });
    }

    // 8. Build Telemetry Trunk Arcs from each Zone Hub to the Central Gateway Mast (on the side)
    arcsGroup.clear();
    if (showRelayArcs) {
      const gwTopY = gwGroundY + 16.0;
      const gwPos = new THREE.Vector3(gwX, gwTopY, gwZ);

      zones.forEach((zone) => {
        const hubPos = zoneHubWorldPositions[zone.id];
        if (!hubPos) return;

        const start = new THREE.Vector3(hubPos.x, hubPos.y + 8.0, hubPos.z);
        const midX = (start.x + gwPos.x) / 2;
        const midZ = (start.z + gwPos.z) / 2;
        const dist = Math.hypot(start.x - gwPos.x, start.z - gwPos.z);
        const midY = Math.max(start.y, gwPos.y) + dist * 0.32 + 6.0;
        const control = new THREE.Vector3(midX, midY, midZ);

        const curve = new THREE.QuadraticBezierCurve3(start, control, gwPos);
        const points = curve.getPoints(40);
        const arcGeo = new THREE.BufferGeometry().setFromPoints(points);

        const arcMat = new THREE.LineDashedMaterial({
          color: 0x1d4ed8, // Dark institutional blue
          dashSize: 1.8,
          gapSize: 0.8,
          linewidth: 2.0,
          transparent: true,
          opacity: 0.9,
        });

        const arcLine = new THREE.Line(arcGeo, arcMat);
        arcLine.computeLineDistances();
        arcsGroup.add(arcLine);
      });
    }
  }, [
    surveyState,
    verticalScale,
    showStationPillars,
    showStarFanLinks,
    showRelayArcs,
    showStructuralWireframe,
    nodes,
    zones,
    gateway,
    gpsTo3D,
  ]);

  // Handle Camera fly-to view changes
  const flyToView = (view: 'OVERVIEW' | 'CRATER' | 'A' | 'B' | 'C' | 'GATEWAY') => {
    setActiveCameraView(view);
    const scaleFactor = verticalScale / 20;

    if (view === 'OVERVIEW') {
      cameraTargetRef.current = {
        pos: new THREE.Vector3(0, 95, 115),
        lookAt: new THREE.Vector3(0, -6, 0),
        isTransitioning: true,
      };
      selectZone(null);
      return;
    }

    if (view === 'CRATER') {
      const craterY = getElevation(0, 0, surveyState) * scaleFactor;
      cameraTargetRef.current = {
        pos: new THREE.Vector3(0, craterY + 38, 48),
        lookAt: new THREE.Vector3(0, craterY, 0),
        isTransitioning: true,
      };
      selectZone(null);
      return;
    }

    if (view === 'GATEWAY') {
      const [gx, gz] = gpsTo3D(gateway.lat, gateway.lng);
      const gy = getElevation(gx, gz, surveyState) * scaleFactor;
      cameraTargetRef.current = {
        pos: new THREE.Vector3(gx + 25, gy + 32, gz + 35),
        lookAt: new THREE.Vector3(gx, gy + 8, gz),
        isTransitioning: true,
      };
      selectZone(null);
      return;
    }

    // Zone views (A, B, C)
    const zoneObj = zones.find((z) => z.id === view);
    if (zoneObj) {
      selectZone(zoneObj);
      const [zx, zz] = gpsTo3D(zoneObj.center[0], zoneObj.center[1]);
      const zy = getElevation(zx, zz, surveyState) * scaleFactor;
      cameraTargetRef.current = {
        pos: new THREE.Vector3(zx + 24, zy + 28, zz + 32),
        lookAt: new THREE.Vector3(zx, zy, zz),
        isTransitioning: true,
      };
    }
  };

  const handleResetOverview = () => {
    flyToView('OVERVIEW');
  };

  return (
    <div className="relative flex-1 h-full flex flex-col overflow-hidden bg-slate-100 font-sans select-none text-slate-800">
      {/* Sub-header 1: 3D Hierarchical Model title + Survey State Toggles */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 z-10 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-900 tracking-wider">
          <Layers className="w-4 h-4 text-blue-800" />
          <span>3D HIERARCHICAL TERRAIN MODEL • CONTINUOUS TOPOGRAPHY &amp; 3 MINING PANELS</span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-500 font-bold text-[11px] uppercase mr-1">SURVEY STATE:</span>
          <button
            onClick={() => setSurveyState('BASELINE')}
            className={`px-3 py-1 rounded text-xs font-bold transition-all border ${
              surveyState === 'BASELINE'
                ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Mar '24 Baseline (Undisturbed)
          </button>
          <button
            onClick={() => setSurveyState('CURRENT')}
            className={`px-3 py-1 rounded text-xs font-bold transition-all border ${
              surveyState === 'CURRENT'
                ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Mar '25 Current (Active Dips)
          </button>
          <button
            onClick={() => setSurveyState('DIFFERENTIAL')}
            className={`px-3 py-1 rounded text-xs font-bold transition-all border ${
              surveyState === 'DIFFERENTIAL'
                ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            ΔZ Differential Funnel
          </button>
        </div>
      </div>

      {/* Sub-header 2: 3D Camera View Selectors */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 z-10 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-600 font-bold mr-1 text-[11px]">3D CAMERA VIEW:</span>

          <button
            onClick={() => flyToView('OVERVIEW')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all border ${
              activeCameraView === 'OVERVIEW'
                ? 'bg-blue-800 text-white border-blue-800 font-bold shadow-xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Overview (All 3 Zones &amp; Crater)
          </button>

          <button
            onClick={() => flyToView('CRATER')}
            className={`px-2.5 py-1 rounded text-xs transition-all flex items-center gap-1.5 border ${
              activeCameraView === 'CRATER'
                ? 'bg-red-800 text-white border-red-800 font-bold shadow-xs'
                : 'bg-white border-slate-300 text-red-700 hover:bg-red-50'
            }`}
          >
            <AlertCircle className="w-3 h-3 text-red-600" />
            <span>Central Subsidence Crater</span>
          </button>

          <button
            onClick={() => flyToView('A')}
            className={`px-2.5 py-1 rounded text-xs transition-all flex items-center gap-1.5 border ${
              activeCameraView === 'A'
                ? 'bg-amber-800 text-white border-amber-800 font-bold shadow-xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>Zone A (North)</span>
            <span className="px-1 rounded bg-slate-200 text-[10px] text-slate-700">5</span>
          </button>

          <button
            onClick={() => flyToView('B')}
            className={`px-2.5 py-1 rounded text-xs transition-all flex items-center gap-1.5 border ${
              activeCameraView === 'B'
                ? 'bg-red-800 text-white border-red-800 font-bold shadow-xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>Zone B (Southeast)</span>
            <span className="px-1 rounded bg-slate-200 text-[10px] text-slate-700">5</span>
          </button>

          <button
            onClick={() => flyToView('C')}
            className={`px-2.5 py-1 rounded text-xs transition-all flex items-center gap-1.5 border ${
              activeCameraView === 'C'
                ? 'bg-emerald-800 text-white border-emerald-800 font-bold shadow-xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>Zone C (Southwest)</span>
            <span className="px-1 rounded bg-slate-200 text-[10px] text-slate-700">5</span>
          </button>

          <button
            onClick={() => flyToView('GATEWAY')}
            className={`px-2.5 py-1 rounded text-xs transition-all flex items-center gap-1.5 border ${
              activeCameraView === 'GATEWAY'
                ? 'bg-blue-800 text-white border-blue-800 font-bold shadow-xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Wifi className="w-3 h-3 text-blue-700" />
            <span>Side Gateway Mast</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-600 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          <span>
            {activeCameraView === 'OVERVIEW'
              ? 'Overview: 3 Perimeter Panels & Central Crater'
              : activeCameraView === 'CRATER'
              ? 'Focus: Central Subsidence Active Crater Dip'
              : activeCameraView === 'GATEWAY'
              ? 'Focus: Central Gateway (Side Bedrock Ridge Station)'
              : `Focus: Zone ${activeCameraView} Mining Panel (5 Nodes)`}
          </span>
        </div>
      </div>

      {/* Main 3D Canvas Container */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-slate-100">
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing z-0" />

        {/* 3D DIGITAL ELEVATION CONTROLS (Top-Left Floating Panel - Light Institutional Theme) */}
        <div className="absolute top-4 left-4 z-10 w-72 bg-white/95 border border-slate-300 rounded-md p-3.5 shadow-md backdrop-blur font-mono text-xs space-y-3 pointer-events-auto text-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-[11px] font-bold text-slate-900 uppercase tracking-wider">
            <span className="text-blue-900">3D DIGITAL ELEVATION CONTROLS</span>
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
          </div>

          {/* Vertical Scale Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-700 text-[11px]">
              <span className="text-slate-600">Vertical Scale (Deformation):</span>
              <span className="font-bold text-amber-700">{verticalScale}x</span>
            </div>
            <input
              type="range"
              min="10"
              max="120"
              step="5"
              value={verticalScale}
              onChange={(e) => setVerticalScale(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-700"
            />
          </div>

          {/* Feature Checkboxes */}
          <div className="space-y-2 pt-1 border-t border-slate-200 text-[11px] text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
              <input
                type="checkbox"
                checked={showStarFanLinks}
                onChange={(e) => setShowStarFanLinks(e.target.checked)}
                className="rounded bg-white border-slate-300 text-blue-700 focus:ring-0"
              />
              <span>Zone Star/Fan Links (Nodes → Hub)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
              <input
                type="checkbox"
                checked={showRelayArcs}
                onChange={(e) => setShowRelayArcs(e.target.checked)}
                className="rounded bg-white border-slate-300 text-blue-700 focus:ring-0"
              />
              <span>Trunk Arcs (Zone Hubs → Side Gateway)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
              <input
                type="checkbox"
                checked={showStationPillars}
                onChange={(e) => setShowStationPillars(e.target.checked)}
                className="rounded bg-white border-slate-300 text-blue-700 focus:ring-0"
              />
              <span>In-Situ Physical Station Pillars (15 Masts)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
              <input
                type="checkbox"
                checked={showStructuralWireframe}
                onChange={(e) => setShowStructuralWireframe(e.target.checked)}
                className="rounded bg-white border-slate-300 text-blue-700 focus:ring-0"
              />
              <span>Structural Grid Wireframe</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
              <input
                type="checkbox"
                checked={slowTurntableOrbit}
                onChange={(e) => setSlowTurntableOrbit(e.target.checked)}
                className="rounded bg-white border-slate-300 text-blue-700 focus:ring-0"
              />
              <span>Slow Turntable Auto-Orbit</span>
            </label>
          </div>

          {/* Reset Overview View Button */}
          <div className="pt-2 border-t border-slate-200">
            <button
              onClick={handleResetOverview}
              className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded text-[11px] flex items-center justify-center gap-1.5 transition-colors shadow-2xs font-semibold"
            >
              <RotateCw className="w-3 h-3 text-slate-700" />
              <span>Reset Overview View</span>
            </button>
          </div>
        </div>

        {/* 3D Floating Screen-Projected Callout Badges (Light Theme) */}
        {zoneBadges.map((badge) => {
          if (!badge.visible) return null;

          return (
            <div
              key={badge.id}
              onClick={() => {
                if (badge.isGateway) {
                  flyToView('GATEWAY');
                } else if (badge.isDepression) {
                  flyToView('CRATER');
                } else {
                  flyToView(badge.id as any);
                }
              }}
              style={{
                left: `${badge.screenX}px`,
                top: `${badge.screenY}px`,
                transform: 'translate(-50%, -100%)',
              }}
              className="absolute z-10 pointer-events-auto cursor-pointer group transition-transform hover:scale-105"
            >
              <div
                className="px-2.5 py-1.5 rounded bg-white border border-slate-300 shadow-md font-mono text-center min-w-[145px]"
                style={{ borderLeftColor: badge.color, borderLeftWidth: '4px' }}
              >
                <div className="text-[11px] font-bold tracking-tight text-slate-900">
                  {badge.title}
                </div>
                <div className="mt-0.5 flex items-center justify-center gap-1 text-[9px] text-slate-600">
                  <span
                    className="px-1 py-0.2 rounded font-bold"
                    style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
                  >
                    {badge.nodeCount} {typeof badge.nodeCount === 'number' ? 'NODES' : ''}
                  </span>
                  <span className="text-slate-500 truncate max-w-[125px]">{badge.subtitle}</span>
                </div>
              </div>

              {/* Pin indicator line down to surface */}
              <div className="w-0.5 h-3 mx-auto" style={{ backgroundColor: badge.color }} />
            </div>
          );
        })}

        {/* Bottom-Right Navigation Instructions Overlay (Light Institutional Theme) */}
        <div className="absolute bottom-4 right-4 z-10 bg-white/95 border border-slate-300 rounded p-3 text-[11px] font-mono text-slate-700 space-y-1 shadow-md pointer-events-auto backdrop-blur max-w-sm">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-700" />
            <span>Click &amp; Drag: Orbit Rotation</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-700" />
            <span>Mouse Wheel: Zoom in/out</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-700" />
            <span>Click any node pillar in 3D to inspect telemetry</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-700" />
            <span>Click Zone / Gateway / Crater badges to fly to view</span>
          </div>
        </div>
      </div>

      {/* Node / Zone Inspection Detail Slide-out Panels */}
      {selectedNode && (
        <NodeDetailPanel node={selectedNode} onClose={() => selectNode(null)} />
      )}
      {selectedZone && !selectedNode && (
        <ZoneDetailPanel
          zone={selectedZone}
          nodes={nodes}
          onSelectNode={(node) => selectNode(node)}
          onClose={() => selectZone(null)}
        />
      )}
    </div>
  );
};
