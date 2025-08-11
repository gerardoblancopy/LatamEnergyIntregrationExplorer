import { ScenarioConfig, ScenarioData, Country, GenerationMix, RawGenerationMix, KpiData, LineData, InvestmentData } from '../types';
import { COUNTRIES } from '../constants';

const scenarioKeyBuilder = (config: ScenarioConfig): string => {
  return `${config.year}-${config.transmission}-${config.sovereignty}-${config.demand}-${config.hydroAndean}-${config.hydroConoSur}`;
};

const transformGenerationMix = (rawMix: RawGenerationMix): GenerationMix => {
    const { Hydro_Embalse = 0, Hydro_Pasada = 0, ...rest } = rawMix;
    const typedRest = rest as Omit<RawGenerationMix, 'Hydro_Embalse' | 'Hydro_Pasada'>;
    return {
        ...typedRest,
        Hydroelectric: (Hydro_Embalse || 0) + (Hydro_Pasada || 0),
    };
};

// Map for non-standard country codes found in data files to standard ISO codes
const dataFileCodeToStandardCode: Record<string, string> = {
    'GU': 'GT', // Guatemala
    'HO': 'HN', // Honduras
    'ES': 'SV', // El Salvador
    'FG': 'GF', // French Guiana
    'SU': 'SR'  // Suriname
};

const countryCodeToNameMap = COUNTRIES.reduce((acc, country) => {
    acc[country.code] = country.name;
    return acc;
}, {} as Record<string, string>);


const normalizeCountryKeys = (countries: Record<string, any>): Record<string, any> => {
    const normalized: Record<string, any> = {};
    if (!countries) return normalized;

    for (const key in countries) {
        // Step 1: Check if the key is a non-standard code and convert it to standard.
        const standardCode = dataFileCodeToStandardCode[key] || key;
        
        // Step 2: Use the standard code to find the full name. 
        // If the key was already a full name, it passes through and is used as the final key.
        const countryName = countryCodeToNameMap[standardCode] || standardCode;

        normalized[countryName] = countries[key];
    }
    return normalized;
};


export const fetchScenarioData = async (config: ScenarioConfig): Promise<{ scenarioData: ScenarioData, kpiData: KpiData, investmentData: InvestmentData }> => {
    const key = scenarioKeyBuilder(config);
    const scenarioUrl = `/data/${key}_scenario.json`;
    const kpiUrl = `/data/${key}_kpi.json`;
    const investmentUrl = `/data/${key}_investment.json`;

    try {
        const [scenarioRes, kpiRes, investmentRes] = await Promise.all([
            fetch(scenarioUrl),
            fetch(kpiUrl),
            fetch(investmentUrl)
        ]);

        if (!scenarioRes.ok) throw new Error(`Scenario data not found for ${key} (scenario)`);
        if (!kpiRes.ok) throw new Error(`Scenario data not found for ${key} (kpi)`);
        if (!investmentRes.ok) throw new Error(`Scenario data not found for ${key} (investment)`);

        const rawScenarioData = await scenarioRes.json();
        const rawKpiData = await kpiRes.json();
        const rawInvestmentData = await investmentRes.json();

        // --- Normalization Step ---
        const normalizedScenarioCountries = normalizeCountryKeys(rawScenarioData.countries);
        const normalizedKpiCountries = normalizeCountryKeys(rawKpiData.countries);
        const normalizedInvestmentCountries = normalizeCountryKeys(rawInvestmentData.generation.countries);

        // 1. Assemble ScenarioData
        const scenarioData: ScenarioData = {
          scenarioParameters: rawScenarioData.scenarioParameters,
          regional: {
            generationMix: transformGenerationMix(rawScenarioData.regional.generationMix)
          },
          countries: Object.keys(normalizedScenarioCountries).reduce((acc, countryName) => {
            acc[countryName] = {
              generationMix: transformGenerationMix(normalizedScenarioCountries[countryName].generationMix)
            };
            return acc;
          }, {} as Record<string, any>),
          staticLines: rawScenarioData.staticLines
        };
        
        // 2. Assemble Lines data (used in KPIs)
        const linesMap = new Map<string, Partial<LineData>>();

        rawScenarioData.staticLines.forEach((line: any) => {
            linesMap.set(line.id, {
                id: line.id,
                from: line.from,
                to: line.to,
                capacity: line.existingCapacity,
                isNew: false
            });
        });

        rawInvestmentData.transmission.lines.forEach((invLine: any) => {
            if (invLine.newCapacityMW > 0) {
                const existing = linesMap.get(invLine.id);
                if (existing) {
                    existing.capacity = (existing.capacity || 0) + invLine.newCapacityMW;
                } else {
                    const [fromCode, toCode] = invLine.id.split('-');
                    const fromCountry = COUNTRIES.find(c => c.code === fromCode)?.name;
                    const toCountry = COUNTRIES.find(c => c.code === toCode)?.name;
                    if(fromCountry && toCountry){
                         linesMap.set(invLine.id, {
                            id: invLine.id,
                            from: fromCountry,
                            to: toCountry,
                            capacity: invLine.newCapacityMW,
                            isNew: true
                        });
                    }
                }
            }
        });

        const finalLines: LineData[] = Array.from(linesMap.values()).map(line => {
            const capacity = line.capacity || 0;
            // Generate a deterministic flow based on properties of the line for stable visualization
            const deterministicFlow = (line.from > line.to) 
              ? capacity * 0.35 
              : -capacity * 0.35;
              
            return {
                ...line,
                flow: deterministicFlow
            } as LineData
        });

        // 3. Assemble KpiData
        const kpiData: KpiData = {
            regional: {
                ...rawKpiData.regional,
                lines: finalLines,
            },
            countries: Object.keys(normalizedKpiCountries).reduce((acc, countryName) => {
                const countryKpi = normalizedKpiCountries[countryName];
                acc[countryName] = {
                    ...countryKpi,
                    energyBalance: {
                        imports: countryKpi.energyBalance.imports,
                        exports: Math.abs(countryKpi.energyBalance.exports)
                    }
                };
                return acc;
            }, {} as Record<string, any>)
        };

        // 4. Assemble InvestmentData
        const investmentData: InvestmentData = {
            regional: rawInvestmentData.generation.regional,
            countries: normalizedInvestmentCountries,
        };

        return { scenarioData, kpiData, investmentData };

    } catch (error) {
        console.error("Failed to fetch scenario data:", error);
        throw new Error(`Data not available for the selected scenario. Please check if data files exist for this configuration.`);
    }
};

export const getCountryByName = (name: string): Country | undefined => {
    return COUNTRIES.find(c => c.name === name);
};