
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { MapVisualization } from './components/MapVisualization';
import { RegionalSummary } from './components/RegionalSummary';
import { CountryDetail } from './components/CountryDetail';
import { AboutModal } from './components/AboutModal';
import { ReportModal, ReportData } from './components/ReportModal';
import { Loader } from './components/ui/Loader';
import {
  ScenarioConfig,
  ScenarioData,
  Country,
  KpiData,
  InvestmentData,
  ScenarioManifest,
  HeatmapTechnology
} from './types';
import { fetchScenarioData, getCountryByName } from './services/dataService';
import { COUNTRIES } from './constants';

const App: React.FC = () => {
  const [scenarioConfig, setScenarioConfig] = useState<ScenarioConfig | null>(null);
  const [availableScenarios, setAvailableScenarios] = useState<ScenarioConfig[] | null>(null);
  const [scenarioData, setScenarioData] = useState<ScenarioData | null>(null);
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [investmentData, setInvestmentData] = useState<InvestmentData | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<any | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [selectedHeatmapTechnology, setSelectedHeatmapTechnology] = useState<HeatmapTechnology>('Total');
  const [reportModalData, setReportModalData] = useState<ReportData | null>(null);

  useEffect(() => {
    const fetchManifestAndGeoJson = async () => {
      setLoading(true);
      setError(null);
      try {
        const [manifestRes, geoJsonRes] = await Promise.all([
          fetch('/data/scenarios.json'),
          fetch('/data/ne_110m_admin_0_map_units-1.json')
        ]);
        
        if (!manifestRes.ok) throw new Error('Could not load scenario manifest. Required file scenarios.json not found in /data folder.');
        const manifest: ScenarioManifest = await manifestRes.json();
        
        if (!manifest.scenarios || manifest.scenarios.length === 0) {
          throw new Error('No scenarios found in manifest.');
        }

        setAvailableScenarios(manifest.scenarios);
        setScenarioConfig(manifest.scenarios[0]);

        if (!geoJsonRes.ok) throw new Error('Could not load GeoJSON map data.');
        const geoData = await geoJsonRes.json();
        setGeoJsonData(geoData);

      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load initial configuration.');
        setLoading(false);
      }
    };
    fetchManifestAndGeoJson();
  }, []);

  const fetchAndProcessData = useCallback(async (config: ScenarioConfig) => {
    setLoading(true);
    setError(null);
    setSelectedCountry(null);
    try {
      const { scenarioData, kpiData, investmentData } = await fetchScenarioData(config);
      setScenarioData(scenarioData);
      setKpiData(kpiData);
      setInvestmentData(investmentData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setScenarioData(null);
      setKpiData(null);
      setInvestmentData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (scenarioConfig) {
      fetchAndProcessData(scenarioConfig);
    }
  }, [scenarioConfig, fetchAndProcessData]);

  const handleCountrySelect = (countryName: string) => {
    console.log("Selected country name from map:", countryName);
    const country = getCountryByName(countryName);
    setSelectedCountry(country);
  };

  const handleConfigChange = useCallback((key: keyof ScenarioConfig, value: any) => {
      if (!availableScenarios || !scenarioConfig) return;

      const tempConfig = { ...scenarioConfig, [key]: value };
      const dependencyOrder: (keyof ScenarioConfig)[] = ['year', 'transmission', 'sovereignty', 'demand', 'hydroAndean', 'hydroConoSur'];
      
      const bestMatch = availableScenarios.find(s => {
          for (const depKey of dependencyOrder) {
              if (s[depKey] !== tempConfig[depKey]) return false;
              if (depKey === key) break; 
          }
          return true;
      });

      if (bestMatch) {
          setScenarioConfig(bestMatch);
      }
  }, [availableScenarios, scenarioConfig]);

  const selectedCountryData = useMemo(() => {
    if (!selectedCountry || !scenarioData) return null;
    return scenarioData.countries[selectedCountry.name] || null;
  }, [selectedCountry, scenarioData]);

  const selectedCountryKpis = useMemo(() => {
    if (!selectedCountry || !kpiData) return null;
    return kpiData.countries[selectedCountry.name] || null;
  }, [selectedCountry, kpiData]);

  const selectedCountryInvestment = useMemo(() => {
    if (!selectedCountry || !investmentData) return null;
    return investmentData.countries[selectedCountry.name] || null;
  }, [selectedCountry, investmentData]);

  const handleGenerateReport = useCallback(() => {
    if (!selectedCountry || !scenarioConfig || !selectedCountryKpis || !selectedCountryInvestment || !investmentData || !kpiData || !selectedCountryData) {
        setError("Cannot generate report. Please ensure a country is selected and all data is loaded.");
        return;
    }
    
    setReportModalData({
        country: selectedCountry,
        config: scenarioConfig,
        countryKpis: selectedCountryKpis,
        countryInvestment: selectedCountryInvestment,
        regionalInvestment: investmentData.regional,
        regionalKpis: kpiData.regional,
        countryGenerationMix: selectedCountryData.generationMix
    });
  }, [selectedCountry, scenarioConfig, selectedCountryKpis, selectedCountryData, selectedCountryInvestment, investmentData, kpiData]);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-main p-3 flex flex-col overflow-x-hidden">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-0">
        <div className="text-center sm:text-left">
          <h1 className="text-xl md:text-2xl font-bold text-brand-text-main">LATAM Energy Integration Explorer</h1>
          <p className="text-sm text-brand-text-secondary">Visualizing the Future of Energy in Latin America</p>
        </div>
        <div className="flex items-center gap-x-4 gap-y-2 flex-wrap justify-center sm:justify-end">
          <button onClick={() => setIsAboutModalOpen(true)} className="px-4 py-2 bg-brand-surface border border-brand-border rounded-md hover:bg-brand-border transition-colors text-sm flex-shrink-0">
            About
          </button>
          <a href="https://uchile.cl/" target="_blank" rel="noopener noreferrer" title="Universidad de Chile">
            <img 
              src="https://res.cloudinary.com/dnh5bxvvy/image/upload/v1751649356/escudo-uchile-horizontal-color_bl-fondo-transp_ebnvfq.png" 
              alt="Universidad de Chile Logo" 
              className="h-8 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity" 
            />
          </a>
          <a href="https://die.uchile.cl/" target="_blank" rel="noopener noreferrer" title="Departamento de Ingeniería Eléctrica, Universidad de Chile">
            <img 
              src="https://res.cloudinary.com/dnh5bxvvy/image/upload/v1751648586/ESCUELA_DE_INGENIER%C3%8DA_EL%C3%89CTRICA_blanco_d6oj7o.png" 
              alt="Departamento de Ingeniería Eléctrica Logo"
              className="h-8 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity" 
            />
          </a>
          <a href="https://isci.cl" target="_blank" rel="noopener noreferrer" title="Instituto de Sistemas Complejos de Ingeniería">
            <img 
              src="https://res.cloudinary.com/dnh5bxvvy/image/upload/v1751649019/Logo-ISCI_eacof4.png" 
              alt="ISCI Logo" 
              className="h-8 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity" 
            />
          </a>
        </div>
      </header>
      
      <div className="bg-brand-surface border border-brand-border rounded-lg p-3 mb-4 flex-shrink-0">
         <ControlPanel 
            config={scenarioConfig} 
            setConfig={handleConfigChange} 
            availableScenarios={availableScenarios} 
            selectedHeatmapTechnology={selectedHeatmapTechnology}
            setSelectedHeatmapTechnology={setSelectedHeatmapTechnology}
          />
      </div>

      <div className="flex-grow flex flex-col lg:grid lg:grid-cols-12 gap-4">
        {/* Map (Main Content) - Full width on mobile, larger part of grid on desktop */}
        <div className="h-[60vh] lg:h-auto lg:col-span-8 xl:col-span-9 flex flex-col">
          <div className="flex-grow bg-brand-surface border border-brand-border rounded-lg p- relative flex flex-col z-0">
            {loading && <Loader />}
            {error && <div className="text-brand-accent-red flex items-center justify-center h-full text-center p-4">{error}</div>}
            <div className="w-full h-full">
              {!loading && !error && scenarioData && kpiData && investmentData && geoJsonData && (
                <MapVisualization
                  nodes={COUNTRIES}
                  lines={kpiData.regional.lines}
                  onNodeClick={handleCountrySelect}
                  selectedCountry={selectedCountry}
                  investmentData={investmentData}
                  kpiData={kpiData}
                  geoJsonData={geoJsonData}
                  selectedHeatmapTechnology={selectedHeatmapTechnology}
                />
              )}
            </div>
          </div>
        </div>

        {/* KPIs & Details (Sidebar) - Below map on mobile, side panel on desktop */}
        <div className="flex-1 lg:h-auto lg:col-span-4 xl:col-span-3 flex flex-col gap-4 lg:pr-2">
          <div className="bg-brand-surface border border-brand-border rounded-lg p-3 flex-shrink-0">
             {loading && <div className="h-[240px] relative"><Loader /></div>}
             {error && <div className="text-brand-accent-red flex items-center justify-center h-[300px] text-center p-4">{error}</div>}
             {!loading && !error && scenarioData && kpiData && (
                <RegionalSummary regionalData={scenarioData.regional} kpis={kpiData.regional} />
              )}
          </div>
          
          <div className="bg-brand-surface border border-brand-border rounded-lg p-3 flex-shrink-0 relative">
            {loading && scenarioConfig && <div className="absolute inset-0"><Loader/></div>}
            {!selectedCountry && !loading && <div className="flex items-center justify-center h-[300px] text-brand-text-secondary">Select a country on the map to see details</div>}
            {selectedCountry && !selectedCountryData && !loading && !error && <div className="text-brand-accent-red flex items-center justify-center h-full">No data for {selectedCountry.name}</div>}
            {selectedCountry && selectedCountryData && kpiData && selectedCountryKpis && selectedCountryInvestment && (
              <CountryDetail 
                country={selectedCountry} 
                data={selectedCountryData} 
                kpis={selectedCountryKpis}
                onGenerateReport={handleGenerateReport}
              />
            )}
          </div>
        </div>
      </div>
      {isAboutModalOpen && <AboutModal onClose={() => setIsAboutModalOpen(false)} />}
      {reportModalData && (
        <ReportModal
          onClose={() => setReportModalData(null)}
          data={reportModalData}
        />
      )}
    </div>
  );
};

export default App;
