
export interface ScenarioConfig {
  year: 2025 | 2035 | 2045;
  transmission: 'Isolated' | 'Integrated';
  sovereignty: 'WithSovereignty' | 'WithoutSovereignty';
  demand: 'BaseCase' | 'NoCoal' | 'ElecPlus' | 'ElecRenLimit';
  hydroAndean: 'High' | 'Medium' | 'Low';
  hydroConoSur: 'High' | 'Medium' | 'Low';
}

export interface ScenarioManifest {
  scenarios: ScenarioConfig[];
}

export interface Country {
  name: string;
  code: string;
  latlng: [number, number];
}

export interface GenerationMix {
  Solar: number;
  Wind: number;
  Nuclear: number;
  Hydroelectric: number;
  Coal: number;
  Gas: number;
  Diesel: number;
}

export interface RawGenerationMix {
    Solar: number;
    Wind: number;
    Nuclear: number;
    Hydro_Embalse: number;
    Hydro_Pasada: number;
    Coal: number;
    Gas: number;
    Diesel: number;
}

export interface CountryData {
  generationMix: GenerationMix;
}

export interface RegionalData {
  generationMix: GenerationMix;
}

export interface StaticLine {
  id: string;
  from: string;
  to: string;
  existingCapacity: number;
  coordinates: { c1: string, c2: string };
}

export interface ScenarioData {
  scenarioParameters: Omit<ScenarioConfig, 'year'> & { year: number };
  regional: RegionalData;
  countries: Record<string, CountryData>;
  staticLines: StaticLine[];
}


export interface LineData {
  id: string;
  from: string;
  to: string;
  capacity: number;
  flow: number;
  isNew: boolean;
}

export interface CountryKpiData {
  lossToTrust: number;
  lossToNotTrust: number;
  operationCost: number;
  totalEmissions: number;
  energyBalance: {
    imports: number;
    exports: number;
  }
}

export interface RegionalKpiData {
  totalCost: number;
  totalInvestment: number;
  totalEmissions: number;
  geopoliticalCost: number;
  lines: LineData[];
}

export interface KpiData {
  generation: any;
  regional: RegionalKpiData,
  countries: Record<string, CountryKpiData>
}

export interface CountryInvestmentData {
  BESS: number;
  Coal: number;
  Diesel: number;
  Gas: number;
  Solar: number;
  Wind: number;
}

export interface InvestmentData {
  regional: CountryInvestmentData;
  countries: Record<string, CountryInvestmentData>;
}

export type HeatmapTechnology = keyof CountryInvestmentData | 'Total' | 'lossToTrust' | 'lossToNotTrust' | 'operationCost' | 'imports' | 'exports' | 'totalEmissions';