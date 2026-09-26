import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useTelemetry } from '../context/TelemetryContext';
import { NodeDetailPanel } from './NodeDetailPanel';
import { ZoneDetailPanel } from './ZoneDetailPanel';
import { CENTRAL_DEPRESSION, getMeshConnections, MINE_INFO } from '../data/mockData';
import {
  Layers,
  ZoomIn,
  ZoomOut,
  Navigation,
  Radio,
  Flame,
  Map as MapIcon,
  Compass,
  Info,
} from 'lucide-react';

type BasemapType = 'SATELLITE' | 'DARK_GIS' | 'TOPO';

export const Map2D: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  const heatOverlayRef = useRef<L.ImageOverlay | null>(null);

  const layersRef = useRef<{
    depressionLayer?: L.LayerGroup;
    zonesLayer?: L.LayerGroup;
    zoneBadgesLayer?: L.LayerGroup;
    hubsLayer?: L.LayerGroup;
    linesLayer?: L.LayerGroup;
    gatewayLayer?: L.LayerGroup;
    nodesLayer?: L.LayerGroup;
  }>({});

  const {
    nodes,
    zones,
    gateway,
    selectedNode,
    selectedZone,
    selectNode,
    selectZone,
  } = useTelemetry();

  const [currentZoom, setCurrentZoom] = useState<number>(15);
  const [basemap, setBasemap] = useState<BasemapType>('SATELLITE');
  const [showDeformationHeatmap, setShowDeformationHeatmap] = useState<boolean>(true);
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.65);
  const [showMeshLines, setShowMeshLines] = useState<boolean>(true);
  const [showDistances, setShowDistances] = useState<boolean>(true);
  const [showIsolines, setShowIsolines] = useState<boolean>(true);
  const [showDepressionDetail, setShowDepressionDetail] = useState<boolean>(false);

  // Geographic bounds for the subsidence deformation heat raster overlay
  const boundsLatLng: L.LatLngBoundsLiteral = [
    [22.3590, 82.6220],
    [22.3780, 82.6450],
  ];

  // Helper to generate colorful subsidence deformation canvas raster
  const generateDeformationCanvas = (withIsolines: boolean): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const latMin = boundsLatLng[0][0];
    const lngMin = boundsLatLng[0][1];
    const latMax = boundsLatLng[1][0];
    const lngMax = boundsLatLng[1][1];

    const toCanvasX = (lng: number) => ((lng - lngMin) / (lngMax - lngMin)) * canvas.width;
    const toCanvasY = (lat: number) => ((latMax - lat) / (latMax - latMin)) * canvas.height;

    // 1. CENTRAL SUBSIDENCE DEPRESSION (Visual focal point: active subsurface caving crater)
    const [cdLat, cdLng] = [CENTRAL_DEPRESSION.lat, CENTRAL_DEPRESSION.lng]; // 22.3678, 82.6322
    const cdX = toCanvasX(cdLng);
    const cdY = toCanvasY(cdLat);

    const gradCentral = ctx.createRadialGradient(cdX, cdY, 20, cdX, cdY, 340);
    gradCentral.addColorStop(0, 'rgba(185, 28, 28, 0.95)'); // Peak Red (-168mm active crater)
    gradCentral.addColorStop(0.30, 'rgba(220, 38, 38, 0.88)'); // Crimson (-140mm)
    gradCentral.addColorStop(0.55, 'rgba(234, 88, 12, 0.78)'); // Orange (-100mm)
    gradCentral.addColorStop(0.75, 'rgba(202, 138, 4, 0.60)'); // Amber (-50mm)
    gradCentral.addColorStop(0.90, 'rgba(22, 163, 74, 0.35)'); // Lime / Green (-20mm)
    gradCentral.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = gradCentral;
    ctx.beginPath();
    ctx.arc(cdX, cdY, 340, 0, Math.PI * 2);
    ctx.fill();

    // 2. Zone B — Southeast Perimeter Goaf Flank (Advancing fracture trough towards crater)
    const [zbLat, zbLng] = [22.3648, 82.6375];
    const zbX = toCanvasX(zbLng);
    const zbY = toCanvasY(zbLat);
    const gradB = ctx.createRadialGradient(zbX, zbY, 15, zbX, zbY, 220);
    gradB.addColorStop(0, 'rgba(220, 38, 38, 0.85)'); // Red (-142mm)
    gradB.addColorStop(0.40, 'rgba(234, 88, 12, 0.75)'); // Orange
    gradB.addColorStop(0.70, 'rgba(202, 138, 4, 0.55)'); // Amber
    gradB.addColorStop(1, 'rgba(22, 163, 74, 0)');
    ctx.fillStyle = gradB;
    ctx.beginPath();
    ctx.arc(zbX, zbY, 220, 0, Math.PI * 2);
    ctx.fill();

    // 3. Zone A — North Perimeter (Longwall Panel Ridge)
    const [zaLat, zaLng] = [22.3732, 82.6300];
    const zaX = toCanvasX(zaLng);
    const zaY = toCanvasY(zaLat);
    const gradA = ctx.createRadialGradient(zaX, zaY, 15, zaX, zaY, 200);
    gradA.addColorStop(0, 'rgba(234, 88, 12, 0.80)'); // Orange (-74mm)
    gradA.addColorStop(0.50, 'rgba(202, 138, 4, 0.60)'); // Amber
    gradA.addColorStop(1, 'rgba(22, 163, 74, 0)');
    ctx.fillStyle = gradA;
    ctx.beginPath();
    ctx.arc(zaX, zaY, 200, 0, Math.PI * 2);
    ctx.fill();

    // 4. Zone C — Southwest Perimeter (Barrier Pillar Stable Baseline)
    const [zcLat, zcLng] = [22.3635, 82.6265];
    const zcX = toCanvasX(zcLng);
    const zcY = toCanvasY(zcLat);
    const gradC = ctx.createRadialGradient(zcX, zcY, 10, zcX, zcY, 170);
    gradC.addColorStop(0, 'rgba(22, 163, 74, 0.65)'); // Emerald Green (-22mm)
    gradC.addColorStop(0.65, 'rgba(2, 132, 199, 0.35)');
    gradC.addColorStop(1, 'rgba(2, 132, 199, 0)');
    ctx.fillStyle = gradC;
    ctx.beginPath();
    ctx.arc(zcX, zcY, 170, 0, Math.PI * 2);
    ctx.fill();

    // 5. Draw colorful geodetic isolines / deformation contours with text labels
    if (withIsolines) {
      ctx.lineWidth = 1.8;
      ctx.font = 'bold 11px "IBM Plex Mono", monospace';

      // Central Subsidence Depression Contours
      ctx.strokeStyle = '#b91c1c';
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.ellipse(cdX, cdY, 80, 65, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillText('-160mm (Crater Epicenter)', cdX - 78, cdY - 72);

      // -120mm contour (Orange)
      ctx.strokeStyle = '#ea580c';
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.ellipse(cdX, cdY, 150, 120, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillText('-120mm Active Caving Trough', cdX - 85, cdY - 128);

      // -80mm contour (Amber)
      ctx.strokeStyle = '#ca8a04';
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.ellipse(cdX, cdY, 230, 180, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillText('-80mm Inflection Rim', cdX - 60, cdY - 188);

      // -40mm contour (Emerald / Lime)
      ctx.strokeStyle = '#16a34a';
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.ellipse(cdX, cdY, 300, 240, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillText('-40mm Limit of Draw', cdX - 55, cdY - 248);

      // Zone B Goaf Isoline
      ctx.strokeStyle = '#b91c1c';
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.ellipse(zbX, zbY, 100, 75, -0.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillText('-135mm (Zone B Flank)', zbX - 60, zbY - 82);

      // Zone A Longwall Isoline
      ctx.strokeStyle = '#ea580c';
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.ellipse(zaX, zaY, 90, 70, 0.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillText('-70mm (Zone A Longwall)', zaX - 65, zaY - 76);
    }

    return canvas.toDataURL();
  };

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [MINE_INFO.anchorCoords.lat, MINE_INFO.anchorCoords.lng],
      zoom: 15,
      minZoom: 13,
      maxZoom: 18,
      zoomControl: false,
    });

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Esri, Maxar, Earthstar Geographics, CNES/Airbus DS, USGS, AeroGRID, IGN',
        maxZoom: 18,
      }
    ).addTo(map);
    tileLayerRef.current = satelliteLayer;

    const labelsLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        opacity: 0.75,
        maxZoom: 18,
      }
    ).addTo(map);
    labelsLayerRef.current = labelsLayer;

    const heatDataUrl = generateDeformationCanvas(showIsolines);
    const heatOverlay = L.imageOverlay(heatDataUrl, boundsLatLng, {
      opacity: heatmapOpacity,
      interactive: false,
    }).addTo(map);
    heatOverlayRef.current = heatOverlay;

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    const depressionLayer = L.layerGroup().addTo(map);
    const zonesLayer = L.layerGroup().addTo(map);
    const zoneBadgesLayer = L.layerGroup().addTo(map);
    const hubsLayer = L.layerGroup().addTo(map);
    const linesLayer = L.layerGroup().addTo(map);
    const gatewayLayer = L.layerGroup().addTo(map);
    const nodesLayer = L.layerGroup().addTo(map);

    layersRef.current = {
      depressionLayer,
      zonesLayer,
      zoneBadgesLayer,
      hubsLayer,
      linesLayer,
      gatewayLayer,
      nodesLayer,
    };

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap Provider
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    if (labelsLayerRef.current) map.removeLayer(labelsLayerRef.current);

    if (basemap === 'SATELLITE') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Esri Satellite', maxZoom: 18 }
      ).addTo(map);

      labelsLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { opacity: 0.75, maxZoom: 18 }
      ).addTo(map);
    } else if (basemap === 'DARK_GIS') {
      tileLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { attribution: '© CartoDB Dark Matter', maxZoom: 19 }
      ).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        { attribution: '© OpenTopoMap', maxZoom: 17 }
      ).addTo(map);
    }

    if (heatOverlayRef.current) {
      heatOverlayRef.current.bringToFront();
    }
  }, [basemap]);

  // Update Heatmap overlay
  useEffect(() => {
    if (!heatOverlayRef.current) return;

    if (showDeformationHeatmap) {
      const dataUrl = generateDeformationCanvas(showIsolines);
      heatOverlayRef.current.setUrl(dataUrl);
      heatOverlayRef.current.setOpacity(heatmapOpacity);
      if (mapInstanceRef.current && !mapInstanceRef.current.hasLayer(heatOverlayRef.current)) {
        heatOverlayRef.current.addTo(mapInstanceRef.current);
      }
    } else {
      if (mapInstanceRef.current && mapInstanceRef.current.hasLayer(heatOverlayRef.current)) {
        mapInstanceRef.current.removeLayer(heatOverlayRef.current);
      }
    }
  }, [showDeformationHeatmap, heatmapOpacity, showIsolines]);

  // Render Central Depression, 3 Perimeter Zones, Hubs, Physical Nodes, Gateway (Light Theme)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const {
      depressionLayer,
      zonesLayer,
      zoneBadgesLayer,
      hubsLayer,
      linesLayer,
      gatewayLayer,
      nodesLayer,
    } = layersRef.current;

    if (
      !map ||
      !depressionLayer ||
      !zonesLayer ||
      !zoneBadgesLayer ||
      !hubsLayer ||
      !linesLayer ||
      !gatewayLayer ||
      !nodesLayer
    )
      return;

    depressionLayer.clearLayers();
    zonesLayer.clearLayers();
    zoneBadgesLayer.clearLayers();
    hubsLayer.clearLayers();
    linesLayer.clearLayers();
    gatewayLayer.clearLayers();
    nodesLayer.clearLayers();

    const isZoomedOut = currentZoom < 16;

    // 1. CENTRAL SUBSIDENCE DEPRESSION
    const centralCircle = L.circle([CENTRAL_DEPRESSION.lat, CENTRAL_DEPRESSION.lng], {
      radius: CENTRAL_DEPRESSION.radiusMeters,
      color: '#b91c1c',
      weight: 2.2,
      dashArray: '4, 4',
      fillColor: '#dc2626',
      fillOpacity: 0.16,
    });
    centralCircle.on('click', () => setShowDepressionDetail(true));
    depressionLayer.addLayer(centralCircle);

    const epicenterRing = L.circle([CENTRAL_DEPRESSION.lat, CENTRAL_DEPRESSION.lng], {
      radius: 95,
      color: '#b91c1c',
      weight: 2.0,
      fillColor: '#991b1b',
      fillOpacity: 0.22,
    });
    depressionLayer.addLayer(epicenterRing);

    // Central Subsidence Depression Epicenter Marker Badge (Light Institutional Theme)
    const depressionBadgeIcon = L.divIcon({
      className: 'depression-badge-marker',
      html: `
        <div class="flex flex-col items-center cursor-pointer group transition-transform hover:scale-105">
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full bg-white border-2 border-red-700 flex items-center justify-center text-red-700 shadow-md">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
            </div>
          </div>
          <div class="mt-1 px-2.5 py-1 rounded bg-white border border-red-300 font-mono text-center shadow-md"
               style="color: #0f172a; min-width: 145px;">
            <div class="text-[9px] font-bold text-red-800 tracking-wider">ACTIVE SUBSIDENCE CRATER</div>
            <div class="text-[8px] text-slate-600 font-sans truncate">Central Goaf Caving Epicenter</div>
            <div class="flex items-center justify-between text-[9px] pt-0.5 border-t border-slate-200 mt-0.5 font-bold">
              <span class="text-red-700">ΔZ -168 mm</span>
              <span class="text-slate-600 font-mono">r=280m</span>
            </div>
          </div>
        </div>
      `,
      iconSize: [160, 60],
      iconAnchor: [80, 22],
    });

    const depressionMarker = L.marker([CENTRAL_DEPRESSION.lat, CENTRAL_DEPRESSION.lng], {
      icon: depressionBadgeIcon,
    });
    depressionMarker.on('click', () => setShowDepressionDetail(true));
    depressionLayer.addLayer(depressionMarker);

    // 2. 3 PERIMETER MINING ZONES
    zones.forEach((zone) => {
      const isSelected = selectedZone?.id === zone.id;
      const riskColor =
        zone.riskLevel === 'critical'
          ? '#b91c1c'
          : zone.riskLevel === 'moderate'
          ? '#b45309'
          : '#15803d';

      const polygon = L.polygon(zone.polygonCoords, {
        color: isSelected ? '#1d4ed8' : riskColor,
        weight: isSelected ? 3.5 : 2.5,
        dashArray: isSelected ? undefined : '5, 5',
        fillColor: riskColor,
        fillOpacity: isSelected ? 0.30 : 0.16,
      });

      polygon.on('click', () => {
        selectZone(zone);
      });

      zonesLayer.addLayer(polygon);

      // Zone Center Badge (Light Institutional Theme)
      const zoneBadgeIcon = L.divIcon({
        className: 'zone-badge-marker',
        html: `
          <div class="px-2.5 py-1.5 rounded bg-white border border-slate-300 shadow-md font-mono text-center cursor-pointer transition-all hover:scale-105"
               style="border-left-color: ${riskColor}; border-left-width: 4px; color: #0f172a; min-width: 130px;">
            <div class="flex items-center justify-center gap-1.5">
              <span class="w-2 h-2 rounded-full" style="background-color: ${riskColor}"></span>
              <span class="text-xs font-bold tracking-wider" style="color: ${riskColor}">ZONE ${zone.id}</span>
            </div>
            <div class="text-[9px] text-slate-600 font-sans truncate font-medium mt-0.5">${zone.panelCode}</div>
            <div class="mt-1 pt-1 border-t border-slate-200 flex items-center justify-between text-[10px]">
              <span class="text-slate-600 font-semibold">5 Masts (Hub)</span>
              <span class="font-extrabold" style="color: ${riskColor}">${zone.averageSubsidenceRateMmYr} mm/y</span>
            </div>
          </div>
        `,
        iconSize: [136, 52],
        iconAnchor: [68, 26],
      });

      const badgeMarker = L.marker(zone.center, { icon: zoneBadgeIcon });
      badgeMarker.on('click', () => selectZone(zone));
      zoneBadgesLayer.addLayer(badgeMarker);

      // LOCAL ZONE HUB MARKER
      const hubIcon = L.divIcon({
        className: 'local-zone-hub-marker',
        html: `
          <div class="flex flex-col items-center cursor-pointer group">
            <div class="relative flex items-center justify-center">
              <div class="w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center shadow-xs"
                   style="border-color: ${riskColor}; color: ${riskColor}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
            </div>
            <div class="mt-0.5 px-1.5 py-0.2 rounded text-[8px] font-mono font-bold whitespace-nowrap bg-white border border-slate-300 shadow-xs"
                 style="color: ${riskColor}">
              HUB-${zone.id} (FAN-IN)
            </div>
          </div>
        `,
        iconSize: [80, 36],
        iconAnchor: [40, 16],
      });

      const hubMarker = L.marker(zone.hubCoords, { icon: hubIcon });
      hubsLayer.addLayer(hubMarker);
    });

    // 3. CENTRAL GATEWAY MARKER (SIDE OF MAP ON ELEVATED RIDGE)
    const gatewayIcon = L.divIcon({
      className: 'central-gateway-marker',
      html: `
        <div class="flex flex-col items-center group cursor-pointer">
          <div class="relative flex items-center justify-center">
            <div class="w-9 h-9 rounded-full bg-white border-2 border-blue-800 flex items-center justify-center text-blue-800 shadow-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                <line x1="12" y1="20" x2="12" y2="20.01"></line>
              </svg>
            </div>
          </div>
          <div class="mt-1 px-2.5 py-0.5 bg-white border border-blue-400 rounded text-[9px] font-mono font-bold text-blue-900 tracking-wider whitespace-nowrap shadow-xs">
            CENTRAL GATEWAY (Wi-SUN ROOT)
          </div>
        </div>
      `,
      iconSize: [160, 55],
      iconAnchor: [80, 22],
    });

    const gwMarker = L.marker([gateway.lat, gateway.lng], { icon: gatewayIcon });
    gwMarker.bindTooltip(
      `
      <div class="p-1 font-mono text-[11px] text-slate-800">
        <strong class="text-blue-900 block">${gateway.name}</strong>
        <div>Location: Side Bedrock Ridge Station (Stable Ground)</div>
        <div>Uplink: ${gateway.uplinkProtocol}</div>
        <div>PDR: <strong class="text-emerald-700">${gateway.pdrPercent}%</strong> • Rx: ${gateway.packetsReceivedToday} pkts</div>
      </div>
      `,
      { direction: 'top', className: 'institutional-tooltip' }
    );
    gatewayLayer.addLayer(gwMarker);

    // 4. MESH CONNECTIONS: FAN/STAR + HUB TO GATEWAY
    if (showMeshLines) {
      const connections = getMeshConnections(nodes, zones, gateway);

      connections.forEach((conn) => {
        if (isZoomedOut && conn.type === 'NODE_TO_ZONE_HUB') return;

        const isHubToGateway = conn.type === 'ZONE_HUB_TO_GATEWAY';
        const color = isHubToGateway ? '#1d4ed8' : '#0284c7';

        const polyline = L.polyline([conn.fromCoords, conn.toCoords], {
          color: color,
          weight: isHubToGateway ? 2.5 : 1.8,
          dashArray: isHubToGateway ? '8, 8' : '5, 6',
          className: 'animated-mesh-link',
          opacity: 0.9,
        });
        linesLayer.addLayer(polyline);

        if (showDistances) {
          const midLat = (conn.fromCoords[0] + conn.toCoords[0]) / 2;
          const midLng = (conn.fromCoords[1] + conn.toCoords[1]) / 2;

          const distanceIcon = L.divIcon({
            className: 'distance-label-marker',
            html: `
              <div class="px-1.5 py-0.2 bg-white/95 border border-slate-300 rounded text-[8px] font-mono font-bold text-slate-800 shadow-2xs whitespace-nowrap">
                ${conn.label}
              </div>
            `,
            iconSize: [46, 16],
            iconAnchor: [23, 8],
          });

          const distMarker = L.marker([midLat, midLng], {
            icon: distanceIcon,
            interactive: false,
          });
          linesLayer.addLayer(distMarker);
        }
      });
    }

    // 5. IN ZOOMED-IN VIEW: PHYSICAL NODES (Light Theme)
    if (!isZoomedOut) {
      nodes.forEach((node) => {
        const isSelected = selectedNode?.id === node.id;
        const isCritical = node.subsidenceRateMmYr >= 25.0;
        const isModerate = node.subsidenceRateMmYr >= 10.0 && node.subsidenceRateMmYr < 25.0;
        const statusColor = isCritical ? '#b91c1c' : isModerate ? '#b45309' : '#15803d';

        const physicalNodeSvg = `
          <div class="flex flex-col items-center cursor-pointer group transition-transform ${
            isSelected ? 'scale-125 z-50' : 'hover:scale-110'
          }">
            <div class="px-1.5 py-0.2 mb-0.5 rounded font-mono text-[9px] font-bold border shadow-2xs ${
              isSelected
                ? 'bg-blue-900 border-blue-900 text-white'
                : 'bg-white border-slate-300 text-slate-800'
            }">
              ${node.id}
            </div>

            <div class="relative flex items-center justify-center">
              <svg width="28" height="38" viewBox="0 0 28 38" fill="none" class="filter drop-shadow-sm relative z-10">
                <line x1="14" y1="2" x2="14" y2="8" stroke="#475569" stroke-width="1.8" />
                <circle cx="14" cy="3" r="2.8" fill="${statusColor}" />
                <polygon points="14,8 6,17 22,17" fill="#1e293b" stroke="${statusColor}" stroke-width="1.8" />
                <rect x="8" y="18" width="12" height="3" rx="0.5" fill="#0284c7" stroke="#0369a1" stroke-width="0.8" />
                <line x1="14" y1="17" x2="14" y2="31" stroke="#334155" stroke-width="2.8" />
                <ellipse cx="14" cy="32" rx="10" ry="4" fill="#64748b" stroke="${statusColor}" stroke-width="1.5" />
              </svg>
            </div>

            <div class="text-[9px] font-mono px-1.5 py-0.2 rounded -mt-1 font-bold border shadow-2xs bg-white"
                 style="border-color: ${statusColor}; color: ${statusColor}">
              ${node.subsidenceRateMmYr}mm/y
            </div>
          </div>
        `;

        const nodeIcon = L.divIcon({
          className: 'physical-node-marker',
          html: physicalNodeSvg,
          iconSize: [40, 58],
          iconAnchor: [20, 50],
        });

        const nodeMarker = L.marker([node.lat, node.lng], { icon: nodeIcon });
        nodeMarker.on('click', () => {
          selectNode(node);
        });

        nodeMarker.bindTooltip(
          `
          <div class="font-mono text-[10px] text-slate-800 p-1">
            <strong class="text-blue-900 block">NODE ${node.id} (${node.name})</strong>
            <div>Elevation: ${node.currentElevation.toFixed(3)} m MSL</div>
            <div>Total Subsidence: -${node.totalSubsidenceMm} mm</div>
            <div class="font-bold" style="color: ${statusColor}">Velocity: ${node.subsidenceRateMmYr} mm/yr</div>
            <div class="text-[9px] text-slate-600 mt-1">Wi-SUN Mesh Relay (NLN0721, IN865 MHz)</div>
          </div>
          `,
          { direction: 'top', className: 'institutional-tooltip' }
        );

        nodesLayer.addLayer(nodeMarker);
      });
    }
  }, [
    currentZoom,
    nodes,
    zones,
    gateway,
    selectedNode,
    selectedZone,
    showMeshLines,
    showDistances,
    selectNode,
    selectZone,
  ]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetView = () => {
    mapInstanceRef.current?.setView([MINE_INFO.anchorCoords.lat, MINE_INFO.anchorCoords.lng], 15);
  };

  return (
    <div className="relative flex-1 h-full flex overflow-hidden bg-slate-100 font-sans select-none text-slate-800">
      <div ref={mapContainerRef} className="flex-1 h-full w-full z-0" />

      {/* Floating Controls Panel (Top Left - Light Institutional Theme) */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 pointer-events-none max-w-[310px]">
        <div className="bg-white/95 border border-slate-300 rounded-lg p-3 shadow-md backdrop-blur pointer-events-auto text-xs font-mono space-y-3">
          <div className="flex items-center justify-between text-slate-800 pb-1.5 border-b border-slate-200">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
              <Layers className="w-3.5 h-3.5 text-blue-800" />
              <span>2D NODE NETWORK &amp; DEFORMATION</span>
            </div>
            <span className="text-[10px] text-blue-800 font-bold">
              {currentZoom >= 16 ? 'NODE ZOOM' : 'ZONE OVERVIEW'}
            </span>
          </div>

          {/* Basemap Switcher */}
          <div className="space-y-1">
            <div className="text-[10px] text-slate-600 font-bold uppercase flex items-center gap-1">
              <MapIcon className="w-3 h-3 text-slate-700" />
              <span>Terrain Basemap:</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => setBasemap('SATELLITE')}
                className={`py-1 px-1.5 rounded text-[10px] font-bold border transition-colors ${
                  basemap === 'SATELLITE'
                    ? 'bg-blue-900 border-blue-900 text-white shadow-2xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Satellite
              </button>
              <button
                onClick={() => setBasemap('DARK_GIS')}
                className={`py-1 px-1.5 rounded text-[10px] font-bold border transition-colors ${
                  basemap === 'DARK_GIS'
                    ? 'bg-blue-900 border-blue-900 text-white shadow-2xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Dark GIS
              </button>
              <button
                onClick={() => setBasemap('TOPO')}
                className={`py-1 px-1.5 rounded text-[10px] font-bold border transition-colors ${
                  basemap === 'TOPO'
                    ? 'bg-blue-900 border-blue-900 text-white shadow-2xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Topography
              </button>
            </div>
          </div>

          {/* Subsidence Heatmap Drape Controls */}
          <div className="space-y-1.5 pt-1.5 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-slate-800 hover:text-slate-900 font-bold text-[11px]">
                <input
                  type="checkbox"
                  checked={showDeformationHeatmap}
                  onChange={(e) => setShowDeformationHeatmap(e.target.checked)}
                  className="rounded bg-white border-slate-300 text-blue-700 focus:ring-0"
                />
                <span className="flex items-center gap-1.5 text-slate-800">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  Subsidence Heatmap Drape
                </span>
              </label>
              <span className="text-[10px] font-bold text-slate-700">{Math.round(heatmapOpacity * 100)}%</span>
            </div>

            {showDeformationHeatmap && (
              <div className="space-y-1">
                <input
                  type="range"
                  min="0.2"
                  max="0.95"
                  step="0.05"
                  value={heatmapOpacity}
                  onChange={(e) => setHeatmapOpacity(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-700"
                />
                <div className="flex justify-between text-[9px] text-slate-500">
                  <span>Muted</span>
                  <span>Vivid Color Gradient</span>
                </div>
              </div>
            )}
          </div>

          {/* Toggles for Isolines, Mesh Lines, and Distances */}
          <div className="space-y-1.5 pt-1 border-t border-slate-200 text-[11px] text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
              <input
                type="checkbox"
                checked={showIsolines}
                onChange={(e) => setShowIsolines(e.target.checked)}
                className="rounded bg-white border-slate-300 text-blue-700 focus:ring-0"
              />
              <span>Deformation Isolines &amp; Contours</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
              <input
                type="checkbox"
                checked={showMeshLines}
                onChange={(e) => setShowMeshLines(e.target.checked)}
                className="rounded bg-white border-slate-300 text-blue-700 focus:ring-0"
              />
              <span>Wi-SUN Star Mesh Links</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
              <input
                type="checkbox"
                checked={showDistances}
                onChange={(e) => setShowDistances(e.target.checked)}
                className="rounded bg-white border-slate-300 text-blue-700 focus:ring-0"
              />
              <span>Link Distance Badges (m)</span>
            </label>
          </div>

          <div className="text-[10px] text-slate-600 pt-1 border-t border-slate-200 flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-700" />
            <span>Wi-SUN Mesh Relay (NLN0721, IN865 MHz)</span>
          </div>
        </div>

        {/* Zoom Hint Banner */}
        <div className="bg-white/95 border border-slate-300 rounded px-2.5 py-1.5 shadow-xs pointer-events-auto text-[10px] font-mono text-slate-700 flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-blue-800 flex-shrink-0" />
          <span>
            {currentZoom < 16
              ? 'Zoom in (≥16x) to inspect individual sensor masts.'
              : 'Viewing individual physical sensor masts (A-01 to C-05).'}
          </span>
        </div>
      </div>

      {/* Floating Map Navigation Controls (Top Right - Light Theme) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 pointer-events-auto">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 bg-white border border-slate-300 hover:bg-slate-100 rounded flex items-center justify-center text-slate-700 shadow-xs"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 bg-white border border-slate-300 hover:bg-slate-100 rounded flex items-center justify-center text-slate-700 shadow-xs"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          className="w-8 h-8 bg-white border border-slate-300 hover:bg-slate-100 rounded flex items-center justify-center text-blue-800 shadow-xs"
          title="Reset to Korba Mine Center"
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>

      {/* Subsidence Heatmap Palette Bar (Bottom Center - Light Theme) */}
      {showDeformationHeatmap && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-white/95 border border-slate-300 rounded-lg px-3 py-1.5 shadow-md backdrop-blur font-mono text-[10px] flex items-center gap-3 pointer-events-auto text-slate-800">
          <div className="flex items-center gap-1.5 text-slate-800 font-bold whitespace-nowrap">
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>Subsidence Scale:</span>
          </div>
          <div className="w-44 h-2.5 rounded bg-gradient-to-r from-emerald-600 via-amber-500 via-orange-600 to-red-700 shadow-inner" />
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <span className="text-emerald-700">&lt;10mm</span>
            <span className="text-amber-700">50mm</span>
            <span className="text-orange-700">100mm</span>
            <span className="text-red-700">&ge;150mm</span>
          </div>
        </div>
      )}

      {/* Risk Color Legend (Bottom Left - Light Theme) */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 border border-slate-300 rounded p-2.5 shadow-md backdrop-blur font-mono text-[10px] space-y-1.5 pointer-events-auto text-slate-800">
        <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1 flex items-center justify-between gap-4">
          <span>DGMS Subsidence Thresholds</span>
          <span className="text-slate-500 font-normal">CMR 2017</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 flex-shrink-0" />
          <span className="text-slate-700">Critical Risk:</span>
          <strong className="text-red-700 font-bold ml-auto">&ge; 25 mm/yr</strong>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
          <span className="text-slate-700">Moderate Settlement:</span>
          <strong className="text-amber-700 font-bold ml-auto">10 &ndash; 25 mm/yr</strong>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 flex-shrink-0" />
          <span className="text-slate-700">Stable Baseline:</span>
          <strong className="text-emerald-700 font-bold ml-auto">&lt; 10 mm/yr</strong>
        </div>
      </div>

      {/* Central Subsidence Depression Info Modal (Light Theme) */}
      {showDepressionDetail && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-white border border-slate-300 rounded-lg p-4 shadow-xl max-w-md w-full font-mono text-xs text-slate-800 space-y-3 pointer-events-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2 text-red-800 font-bold">
              <Info className="w-4 h-4" />
              <span>CENTRAL SUBSIDENCE DEPRESSION</span>
            </div>
            <button
              onClick={() => setShowDepressionDetail(false)}
              className="text-slate-500 hover:text-slate-800 px-2 py-0.5 rounded bg-slate-100"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-600">Epicenter Coordinates:</span>
              <span className="text-slate-900 font-bold">22.3678° N, 82.6322° E</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Caving Radius:</span>
              <span className="text-amber-800 font-bold">~280 meters</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Peak Crater Depression:</span>
              <span className="text-red-700 font-bold">-168.0 mm (0.168 m)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Monitoring Perimeter:</span>
              <span className="text-blue-900 font-bold">3 External Perimeter Clusters (15 Nodes)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Wi-SUN Gateway Position:</span>
              <span className="text-slate-900 font-bold">Side Ridge Mast (Elevated Bedrock)</span>
            </div>
            <p className="text-[10px] text-slate-600 pt-1 border-t border-slate-200 leading-relaxed font-sans">
              All 3 perimeter monitoring zones (Zones A, B, and C) are situated on stable ground outside this active caving basin, fanning telemetry into their respective local zone hubs and relaying to the side gateway via Wi-SUN NLN0721.
            </p>
          </div>
        </div>
      )}

      {/* Detail Slide-out Panels */}
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
