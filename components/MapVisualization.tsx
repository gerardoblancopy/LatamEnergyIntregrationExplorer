import React, { useMemo, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip as LeafletTooltip, GeoJSON, LayersControl, FeatureGroup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
const canvasRenderer = L.canvas({ padding: 0.5 });
import { Country, LineData, InvestmentData, HeatmapTechnology, CountryInvestmentData, KpiData } from '../types';
import { getCountryByName } from '../services/dataService';

// Helper component to continuously invalidate map size on container changes and viewport events
const MapSizeWatcher: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize(false));
    ro.observe(container);

    const onResize = () => map.invalidateSize(false);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    // Safari iOS: visualViewport resize
    const vv = (window as any).visualViewport;
    if (vv && typeof vv.addEventListener === 'function') {
      vv.addEventListener('resize', onResize);
    }

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      if (vv && typeof vv.removeEventListener === 'function') {
        vv.removeEventListener('resize', onResize);
      }
    };
  }, [map]);
  return null;
};

interface MapVisualizationProps {
  nodes: Country[];
  lines: LineData[];
  onNodeClick: (countryName: string) => void;
  selectedCountry: Country | null;
  investmentData: InvestmentData | null;
  kpiData: KpiData | null;
  geoJsonData: any | null;
  selectedHeatmapTechnology: HeatmapTechnology;
}

const createDivIcon = (isSelected: boolean, code: string) => {
  const baseClasses = 'rounded-full border-2 transition-all duration-300 flex items-center justify-center font-bold text-xs';
  const size = isSelected ? 'w-6 h-6' : 'w-5 h-5';
  const color = isSelected 
    ? 'bg-brand-secondary border-white text-brand-bg shadow-lg' 
    : 'bg-brand-primary border-brand-bg text-brand-bg';
  
  return L.divIcon({
    html: `<div class="${size} ${color} ${baseClasses}">${code}</div>`,
    className: 'leaflet-div-icon-container',
    iconSize: isSelected ? [24, 24] : [20, 20],
    iconAnchor: isSelected ? [12, 12] : [10, 10],
  });
};

const Legend: React.FC<{ grades: number[], getColor: (d: number | undefined) => string, technology: string }> = ({ grades, getColor, technology }) => {
    const map = useMap();
    
    useEffect(() => {
        const legend = new L.Control({ position: 'topright' });

        legend.onAdd = function () {
            const div = L.DomUtil.create('div', 'info legend p-2 w-48');
            
            let innerHTML = `<h4 class="font-bold text-xs mb-1">${technology}</h4>`;

            if (grades.length <= 1) {
                 innerHTML += '<div class="text-xs">No data available</div>'
            } else {
                 for (let i = 0; i < grades.length; i++) {
                    const from = grades[i];
                    const to = grades[i + 1];
                    
                    const formatNumber = (num: number) => {
                        if (num >= 1000) return (num / 1000).toLocaleString('en-US', {maximumFractionDigits: 1}) + 'k';
                        return Math.round(num);
                    }

                    innerHTML +=
                        '<div class="flex items-center text-xs mt-1">' +
                        '<i style="background:' + getColor(from + 1) + '"></i> ' +
                        formatNumber(from) +
                        (to ? '&ndash;' + formatNumber(to) : '+') + '</div>';
                }
            }

            div.innerHTML = innerHTML
            return div;
        };

        legend.addTo(map);

        return () => {
            legend.remove();
        };
    }, [map, grades, getColor, technology]);

    return null;
}

const HomeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
);

const ZoomControlWithHome: React.FC<{ initialCenter: L.LatLngExpression, initialZoom: number }> = ({ initialCenter, initialZoom }) => {
  const map = useMap();

  const handleZoomIn = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    map.zoomIn();
  };

  const handleZoomOut = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    map.zoomOut();
  };

  const handleResetView = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    map.flyTo(initialCenter, initialZoom);
  };
  
  return (
    <div className="leaflet-top leaflet-left">
      <div className="leaflet-control-zoom leaflet-bar leaflet-control">
        <a className="leaflet-control-zoom-in" href="#" title="Zoom in" role="button" aria-label="Zoom in" onClick={handleZoomIn}>+</a>
        <a className="leaflet-control-zoom-out" href="#" title="Zoom out" role="button" aria-label="Zoom out" onClick={handleZoomOut}>−</a>
        <a className="leaflet-control-zoom-home" href="#" title="Reset view" role="button" aria-label="Reset view" onClick={handleResetView}>
           <div className="flex items-center justify-center w-full h-full">
             <HomeIcon className="w-5 h-5" />
           </div>
        </a>
      </div>
    </div>
  );
};

const MapEvents: React.FC<{ initialZoom: number }> = ({ initialZoom }) => {
  const map = useMapEvents({
    zoomend: () => {
      if (map.getZoom() === initialZoom) {
        map.dragging.disable();
      } else {
        map.dragging.enable();
      }
    },
  });

  useEffect(() => {
    if (map.getZoom() === initialZoom) {
      map.dragging.disable();
    }
  }, [map, initialZoom]);

  return null;
};

export const MapVisualization: React.FC<MapVisualizationProps> = ({ nodes, lines, onNodeClick, selectedCountry, investmentData, kpiData, geoJsonData, selectedHeatmapTechnology }) => {
  
  const mapCenter: L.LatLngExpression = [-15, -60];
  const mapZoom = window.innerWidth < 768 ? 2 : 3;

  const heatmapData = useMemo(() => {
    const map = new Map<string, number>();
    const isKpi = ['lossToTrust', 'lossToNotTrust', 'operationCost', 'imports', 'exports', 'totalEmissions'].includes(selectedHeatmapTechnology);

    if (isKpi) {
        if (!kpiData) return map;
        Object.entries(kpiData.countries).forEach(([countryName, data]) => {
            let value: number;
            if (selectedHeatmapTechnology === 'imports' || selectedHeatmapTechnology === 'exports') {
                value = data.energyBalance[selectedHeatmapTechnology] || 0;
            } else {
                value = (data as any)[selectedHeatmapTechnology] || 0;
            }
            map.set(countryName, value);
        });
    } else {
        if (!investmentData) return map;
        Object.entries(investmentData.countries).forEach(([countryName, data]) => {
            let investmentValue: number;
            if (selectedHeatmapTechnology === 'Total') {
                investmentValue = Object.values(data).reduce((sum, value) => sum + (value || 0), 0);
            } else {
                investmentValue = data[selectedHeatmapTechnology as keyof CountryInvestmentData] || 0;
            }
            map.set(countryName, investmentValue);
        });
    }
    return map;
  }, [investmentData, kpiData, selectedHeatmapTechnology]);

  const { grades, getColor, legendTitle } = useMemo(() => {
      const values = Array.from(heatmapData.values()).filter(v => v > 0);
      const noDataColor = '#18181b'; // brand-surface

      const isKpi = ['lossToTrust', 'lossToNotTrust', 'operationCost', 'imports', 'exports', 'totalEmissions'].includes(selectedHeatmapTechnology);
      const title = isKpi ? `KPI: ${selectedHeatmapTechnology}` : `Investment: ${selectedHeatmapTechnology}`;

      if (values.length === 0) {
          return {
              grades: [0],
              getColor: () => noDataColor,
              legendTitle: title
          }
      }

      const maxValue = Math.max(...values);
      const colorGrades = [
          0,
          maxValue * 0.01,
          maxValue * 0.1,
          maxValue * 0.25,
          maxValue * 0.5,
          maxValue * 0.75,
      ];
      
      const colorFunc = (d: number | undefined): string => {
        if (d === undefined) return noDataColor;
        return d > colorGrades[5] ? '#FFF2F2' :
               d > colorGrades[4] ? '#d4d9ed' :
               d > colorGrades[3] ? '#A9B5DF' :
               d > colorGrades[2] ? '#919cc9' :
               d > colorGrades[1] ? '#7886C7' :
               d > 0              ? '#5f6c9a' :
                                    noDataColor;
      };

      return { grades: colorGrades.map(g => Math.round(g)), getColor: colorFunc, legendTitle: title };

  }, [heatmapData, selectedHeatmapTechnology]);
  

  const styleFeature = (feature?: any) => {
    const value = heatmapData.get(feature?.properties.ADMIN);
    return {
        fillColor: getColor(value),
        weight: 2,
        opacity: 1,
        color: '#18181b', // brand-surface
        dashArray: '3',
        fillOpacity: 0.8,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
      const countryName = feature.properties.ADMIN;
      const value = heatmapData.get(countryName);

      const isKpi = ['lossToTrust', 'lossToNotTrust', 'operationCost', 'imports', 'exports', 'totalEmissions'].includes(selectedHeatmapTechnology);
      const unit = isKpi ? 'MMUSD' : 'MW';
      const formattedValue = value !== undefined && value > 0 ? `${Math.round(value).toLocaleString()} ${unit}` : `No ${isKpi ? 'data' : 'investment'}`;

      const tooltipContent = `<strong>${countryName}</strong><br/>${legendTitle}: ${formattedValue}`;
      const popupContent = `<div style="min-width:160px">
        <div style="font-weight:700;margin-bottom:4px">${countryName}</div>
        <div>${legendTitle}: ${formattedValue}</div>
      </div>`;

      layer.bindTooltip(tooltipContent, { sticky: true, className: 'custom-leaflet-tooltip' });
      layer.bindPopup(popupContent, { className: 'custom-leaflet-popup', closeButton: true });

      layer.on({
        click: (e: any) => {
          // Selecciona el país y abre el popup en el punto clickeado
          onNodeClick(countryName);
          const targetLayer: any = e.target;
          if (typeof targetLayer.openPopup === 'function') {
            targetLayer.openPopup();
          }
        },
        mouseover: (e: any) => {
          e.target.setStyle({ weight: 2.5, color: '#fff', fillOpacity: 1 });
          // Cursor "pointer" sobre el path (SVG)
          if (e?.target?._path) {
            e.target._path.style.cursor = 'pointer';
          }
        },
        mouseout: (e: any) => {
          e.target.setStyle(styleFeature(feature));
          if (e?.target?._path) {
            e.target._path.style.cursor = '';
          }
        },
      });
  };

  const outlineStyle: L.PathOptions = {
    weight: 1,
    color: '#a2a2a5ff', // subtle border (zinc-700)
    opacity: 1,
    fillOpacity: 0,
  };

  const mapLines = lines.map(line => {
    const fromNode = getCountryByName(line.from);
    const toNode = getCountryByName(line.to);
    if (!fromNode || !toNode) return null;
    return { ...line, fromLatLng: fromNode.latlng, toLatLng: toNode.latlng };
  }).filter((line): line is NonNullable<typeof line> => line !== null);

  const flowMax = Math.max(...mapLines.map(l => Math.abs(l.flow)), 1);
  const capacityMax = Math.max(...mapLines.map(l => l.capacity), 1);

  const filteredGeoJson = useMemo(() => {
      if (!geoJsonData) return null;
      const countryNames = new Set(nodes.map(c => c.name));
      const filteredFeatures = geoJsonData.features.filter((feature: any) =>
          countryNames.has(feature.properties.ADMIN)
      );
      return { ...geoJsonData, features: filteredFeatures };
  }, [geoJsonData, nodes]);

  const initialBounds = useMemo(() => {
    try {
      if (filteredGeoJson) {
        const layer = L.geoJSON(filteredGeoJson as any);
        const b = layer.getBounds();
        if (b && b.isValid()) return b.pad(0.05); // pequeño padding visual
      }
    } catch {}
    // Fallback: usar nodos
    const latlngs = nodes.map(n => L.latLng((n.latlng as any)[0], (n.latlng as any)[1]));
    if (latlngs.length) {
      const b = L.latLngBounds(latlngs);
      if (b.isValid()) return b.pad(0.2);
    }
    return null;
  }, [filteredGeoJson, nodes]);


  return (
    <div className="w-full h-full min-h-[320px] bg-gray-800">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="w-full h-full"
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={false}
        preferCanvas
        whenCreated={(map) => requestAnimationFrame(() => map.invalidateSize(false))}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          subdomains={["a","b","c","d"]}
          maxZoom={19}
          updateWhenZooming={true}
          updateWhenIdle={false}
          keepBuffer={3}
          tileSize={512}
          zoomOffset={-1}
          detectRetina={true}
          crossOrigin
        />
        <MapSizeWatcher />
        {filteredGeoJson && (
          <GeoJSON data={filteredGeoJson} style={outlineStyle} interactive={false} renderer={canvasRenderer} />
        )}

        <LayersControl position="topright">
          <LayersControl.Overlay checked name="Heatmap">
              {filteredGeoJson && (investmentData || kpiData) && (
                <FeatureGroup>
                    <GeoJSON 
                        key={selectedHeatmapTechnology}
                        data={filteredGeoJson} 
                        style={styleFeature} 
                        onEachFeature={onEachFeature}
                        renderer={canvasRenderer}
                    />
                    <Legend grades={grades} getColor={getColor} technology={legendTitle} />
                </FeatureGroup>
              )}
          </LayersControl.Overlay>
          <LayersControl.Overlay checked name="Transmission Lines">
            <FeatureGroup>
              {mapLines.map((line) => {
                const pathOptions = {
                  weight: 2 + (line.capacity / capacityMax) * 6,
                  opacity: 0.6 + (Math.abs(line.flow) / flowMax) * 0.4,
                  color: line.isNew ? '#edd9a3' : (line.flow > 0 ? '#4b2991' : '#f7667c'),
                };
                return (
                  <Polyline
                    key={line.id}
                    positions={[line.fromLatLng, line.toLatLng]}
                    pathOptions={pathOptions}
                    renderer={canvasRenderer}
                  >
                    <LeafletTooltip sticky className="custom-leaflet-tooltip">
                      <div>
                        <strong>{line.from} &harr; {line.to}</strong><br />
                        Capacity: {Math.round(line.capacity).toLocaleString()} MW
                      </div>
                    </LeafletTooltip>
                  </Polyline>
                );
              })}
              
              {nodes.map((node) => {
                const isSelected = selectedCountry?.name === node.name;
                const countryCode = node.code === 'French Guiana' ? 'GF' : node.code;
                return (
                  <Marker 
                    key={node.code}
                    position={node.latlng}
                    icon={createDivIcon(isSelected, countryCode)}
                    eventHandlers={{
                      click: () => onNodeClick(node.name),
                    }}
                  >
                    <LeafletTooltip direction="top" offset={[0, -1]} opacity={1} className="custom-leaflet-tooltip">
                      {node.name}
                    </LeafletTooltip>
                  </Marker>
                );
              })}
            </FeatureGroup>
          </LayersControl.Overlay>
        </LayersControl>
        <ZoomControlWithHome initialCenter={mapCenter} initialZoom={mapZoom} />
      </MapContainer>
    </div>
  );
};