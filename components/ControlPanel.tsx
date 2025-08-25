
import React, { useMemo } from 'react';
import { ScenarioConfig, HeatmapTechnology, CountryInvestmentData } from '../types';

interface ControlPanelProps {
  config: ScenarioConfig | null;
  setConfig: (key: keyof ScenarioConfig, value: any) => void;
  availableScenarios: ScenarioConfig[] | null;
  selectedHeatmapTechnology: HeatmapTechnology;
  setSelectedHeatmapTechnology: (tech: HeatmapTechnology) => void;
}

const Select: React.FC<React.PropsWithChildren<{ value: string | number; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; label: string; disabled?: boolean }>> = ({ label, value, onChange, children, disabled }) => (
  <div>
    <label className="block text-xs font-medium text-brand-text-secondary mb-1">{label}</label>
    <select 
      value={value} 
      onChange={onChange} 
      disabled={disabled}
      className="w-full bg-brand-bg border border-brand-border rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </select>
  </div>
);

const ControlPanelSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4 animate-pulse">
    {[...Array(7)].map((_, i) => (
      <div key={i}>
        <div className="h-4 bg-brand-border rounded-md w-1/2 mb-2"></div>
        <div className="h-9 bg-brand-border rounded-md w-full"></div>
      </div>
    ))}
  </div>
);

const heatmapTechOptions: { value: HeatmapTechnology, label: string }[] = [
    { value: 'Total', label: 'Total Investment' },
    { value: 'BESS', label: 'Investment: BESS' },
    { value: 'Solar', label: 'Investment: Solar' },
    { value: 'Wind', label: 'Investment: Wind' },
    { value: 'Gas', label: 'Investment: Gas' },
    { value: 'Diesel', label: 'Investment: Diesel' },
    { value: 'Coal', label: 'Investment: Coal' },
    { value: 'lossToTrust', label: 'KPI: Loss to Trust' },
    { value: 'lossToNotTrust', label: 'KPI: Loss to Not Trust' },
    { value: 'operationCost', label: 'KPI: Operation Cost' },
    { value: 'imports', label: 'KPI: Imports' },
    { value: 'exports', label: 'KPI: Exports' },
    { value: 'totalEmissions', label: 'KPI: Total Emissions' },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({ config, setConfig, availableScenarios, selectedHeatmapTechnology, setSelectedHeatmapTechnology }) => {
  const handleChange = (key: keyof ScenarioConfig, value: string | number) => {
    const isNumeric = typeof config?.[key] === 'number';
    setConfig(key, isNumeric ? parseInt(value as string) : value);
  };
  
  const validOptions = useMemo(() => {
    if (!config || !availableScenarios) {
      return {};
    }

    const options: { [key in keyof ScenarioConfig]?: (string | number)[] } = {};
    const dependencyOrder: (keyof ScenarioConfig)[] = ['year', 'transmission', 'sovereignty', 'demand', 'hydroAndean', 'hydroConoSur'];

    dependencyOrder.forEach(field => {
      let filteredScenarios = availableScenarios;
      for (const dep of dependencyOrder) {
        if (dep === field) break;
        filteredScenarios = filteredScenarios.filter(s => s[dep] === config[dep]);
      }
      options[field] = [...new Set(filteredScenarios.map(s => s[field]))];
    });

    return options;

  }, [config, availableScenarios]);

  if (!config || !availableScenarios) {
    return <ControlPanelSkeleton />;
  }
  
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
        <Select label="Horizon (Year)" value={config.year} onChange={e => handleChange('year', e.target.value)}>
          <option value={2025} disabled={!validOptions.year?.includes(2025)}>2025</option>
          <option value={2035} disabled={!validOptions.year?.includes(2035)}>2035</option>
          <option value={2045} disabled={!validOptions.year?.includes(2045)}>2045</option>
        </Select>

         <Select label="Transmission" value={config.transmission} onChange={e => handleChange('transmission', e.target.value as any)}>
            <option value="Isolated" disabled={!validOptions.transmission?.includes('Isolated')}>Isolated System</option>
            <option value="Integrated" disabled={!validOptions.transmission?.includes('Integrated')}>Integrated System</option>
        </Select>

         <Select label="Sovereignty" value={config.sovereignty} onChange={e => handleChange('sovereignty', e.target.value as any)}>
            <option value="WithSovereignty" disabled={!validOptions.sovereignty?.includes('WithSovereignty')}>With Sovereignty</option>
            <option value="WithoutSovereignty" disabled={!validOptions.sovereignty?.includes('WithoutSovereignty')}>Without Sovereignty</option>
        </Select>

        

         <Select label="Andean Hydro" value={config.hydroAndean} onChange={e => handleChange('hydroAndean', e.target.value as any)}>
            <option value="High" disabled={!validOptions.hydroAndean?.includes('High')}>High</option>
            <option value="Medium" disabled={!validOptions.hydroAndean?.includes('Medium')}>Medium</option>
            <option value="Low" disabled={!validOptions.hydroAndean?.includes('Low')}>Low</option>
        </Select>

         <Select label="Southern Cone Hydro" value={config.hydroConoSur} onChange={e => handleChange('hydroConoSur', e.target.value as any)}>
            <option value="High" disabled={!validOptions.hydroConoSur?.includes('High')}>High</option>
            <option value="Medium" disabled={!validOptions.hydroConoSur?.includes('Medium')}>Medium</option>
            <option value="Low" disabled={!validOptions.hydroConoSur?.includes('Low')}>Low</option>
        </Select>

        <Select 
            label="Heatmap" 
            value={selectedHeatmapTechnology} 
            onChange={e => setSelectedHeatmapTechnology(e.target.value as HeatmapTechnology)}
        >
          {heatmapTechOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
      </div>
    </div>
  );
};