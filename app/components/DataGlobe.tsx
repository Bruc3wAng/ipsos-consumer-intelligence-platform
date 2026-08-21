"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { MeshPhongMaterial } from "three";
import type { GlobeMethods, GlobeProps } from "react-globe.gl";
import { researchMarkets, type ResearchMarket } from "../data/globalResearchNetwork";
import { publicAssetPath } from "../lib/publicRuntime";

const Globe = dynamic<GlobeProps>(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => <div className="globe-loading" aria-hidden="true" />,
});

type CountryFeature = {
  properties: { ISO_A2?: string; ADMIN?: string; NAME?: string };
  geometry: { type: string; coordinates: number[] };
};

const marketIds = new Set(researchMarkets.map((market) => market.id));

function markerLabel(market: ResearchMarket) {
  return `<div class="globe-tooltip"><b>${market.country}</b><span>${market.series[0] ?? "研究项目"}</span></div>`;
}

export default function DataGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: 720, height: 620 });
  const [countries, setCountries] = useState<CountryFeature[]>([]);
  const [activeResearch, setActiveResearch] = useState(researchMarkets[0]);

  const globeMaterial = useMemo(
    () => new MeshPhongMaterial({ color: "#0c1d4c", transparent: true, opacity: 0.92, shininess: 5 }),
    [],
  );
  const arcs = useMemo(
    () => researchMarkets.slice(1).map((market) => ({ startLat: 38, startLng: -98, endLat: market.lat, endLng: market.lng })),
    [],
  );

  useEffect(() => {
    fetch(publicAssetPath("/world-countries-110m.geojson"))
      .then((response) => response.json())
      .then((geojson) => setCountries(geojson.features ?? []))
      .catch(() => setCountries([]));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const resize = () => {
      const rect = container.getBoundingClientRect();
      setDimensions({ width: Math.max(320, rect.width), height: Math.max(380, rect.height) });
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    return () => observer.disconnect();
  }, []);

  const focusMarket = (market: ResearchMarket) => {
    setActiveResearch(market);
    globeRef.current?.pointOfView({ lat: market.lat, lng: market.lng, altitude: 1.72 }, 900);
  };

  return (
    <div className="data-globe" ref={containerRef} aria-label="全球研究网络交互式三维地球">
      <div className="globe-webgl">
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"
          globeMaterial={globeMaterial}
          showAtmosphere
          atmosphereColor="#37c8c0"
          atmosphereAltitude={0.13}
          showGraticules
          polygonsData={countries}
          polygonGeoJsonGeometry="geometry"
          polygonAltitude={(feature) => marketIds.has((feature as CountryFeature).properties.ISO_A2 ?? "") ? 0.012 : 0.006}
          polygonCapColor={(feature) => marketIds.has((feature as CountryFeature).properties.ISO_A2 ?? "") ? "rgba(44, 166, 169, .42)" : "rgba(54, 79, 139, .24)"}
          polygonSideColor={() => "rgba(19, 42, 91, .45)"}
          polygonStrokeColor={() => "rgba(91, 160, 193, .28)"}
          pointsData={researchMarkets}
          pointLat="lat"
          pointLng="lng"
          pointAltitude={(point) => 0.025 + (point as ResearchMarket).waves * 0.008}
          pointRadius={(point) => 0.24 + (point as ResearchMarket).waves * 0.035}
          pointColor={() => "#5ce0d6"}
          pointLabel={(point) => markerLabel(point as ResearchMarket)}
          onPointClick={(point) => focusMarket(point as ResearchMarket)}
          onPointHover={(point) => point && setActiveResearch(point as ResearchMarket)}
          ringsData={[activeResearch]}
          ringLat="lat"
          ringLng="lng"
          ringColor={() => "rgba(92, 224, 214, .7)"}
          ringMaxRadius={3.4}
          ringPropagationSpeed={1.2}
          ringRepeatPeriod={850}
          arcsData={arcs}
          arcColor={() => "rgba(67, 196, 192, .38)"}
          arcAltitude={0.18}
          arcStroke={0.28}
          arcDashLength={0.42}
          arcDashGap={1.4}
          arcDashAnimateTime={5200}
          onGlobeReady={() => {
            if (!globeRef.current) return;
            const controls = globeRef.current.controls();
            controls.autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            controls.autoRotateSpeed = 0.28;
            controls.enablePan = false;
            controls.minDistance = 150;
            controls.maxDistance = 340;
            globeRef.current.pointOfView({ lat: 30, lng: -78, altitude: 1.72 }, 0);
          }}
        />
      </div>

      <div className="globe-coordinate globe-coordinate-top">DRAG · SELECT A RESEARCH MARKET</div>

      <article className="globe-market-card globe-guide-card">
        <header><span>{activeResearch.id}</span><div><h2>{activeResearch.country}</h2><p>{activeResearch.english}</p></div><strong>{activeResearch.waves}<small>可用波次</small></strong></header>
        <div className="globe-project-list">{activeResearch.series.map((series) => <p key={series}>{series}</p>)}</div>
        <Link href="/tmt">进入 TMT 项目空间 <span>→</span></Link>
      </article>
    </div>
  );
}
