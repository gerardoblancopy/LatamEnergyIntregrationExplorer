

import React from 'react';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';
import { Country, CountryData, CountryKpiData, GenerationMix } from '../types';
import { KpiCard } from './ui/Card';

interface CountryDetailProps {
  country: Country;
  data: CountryData;
  kpis: CountryKpiData;
  onGenerateReport: () => void;
}

const formatNumber = (num: number) => {
    if (Math.abs(num) >= 1e3) return `${(num / 1e3).toFixed(1)}k`;
    return num.toFixed(1);
};

const COLORS: { [key in keyof GenerationMix]: string } = {
  Solar: '#A9B5DF', 
  Wind: '#7886C7',
  Nuclear: '#FFF2F2', 
  Hydroelectric: '#96a1d1',
  Coal: '#4e5691',
  Gas: '#cad0e6',
  Diesel: '#E5C593',
};


// A highly robust and stable custom content renderer for the Treemap.
const CustomizedContent: React.FC<any> = (props) => {
  const { x, y, width, height, name, value, totalValue } = props;

  // Initial robust validation against invalid props from Recharts
  if (!isFinite(x) || !isFinite(y) || !isFinite(width) || !isFinite(height) || width <= 0 || height <= 0 || !name) {
    return null;
  }
  
  const color = COLORS[name as keyof GenerationMix] || '#30363D';
  const PADDING = 2;
  const innerWidth = width - PADDING * 2;
  const innerHeight = height - PADDING * 2;
  
  if (innerWidth <= 0 || innerHeight <= 0) return null;

  const canShowText = innerWidth > 45 && innerHeight > 18;
  const canShowPercentage = canShowText && innerHeight > 40;

  return (
    <g>
      <rect
        x={x + PADDING}
        y={y + PADDING}
        width={innerWidth}
        height={innerHeight}
        rx={3}
        fill={color}
      />
      {canShowText && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (canShowPercentage ? 7 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#FFFFFF"
          fontSize={12}
          fontWeight="600"
          style={{ pointerEvents: 'none', userSelect: 'none', textShadow: '0 0 4px rgba(0,0,0,0.7)' }}
        >
          {name}
        </text>
      )}
      {canShowPercentage && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 9}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255, 255, 255, 0.9)"
          fontSize={11}
          fontWeight="400"
          style={{ pointerEvents: 'none', userSelect: 'none', textShadow: '0 0 4px rgba(0,0,0,0.7)' }}
        >
          {`${((value / totalValue) * 100).toFixed(1)}%`}
        </text>
      )}
    </g>
  );
};

const AiIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12.83,3.06C12.56,3.06 12.33,3.17 12.17,3.35L10.15,5.64C10,5.82 10,6.08 10.15,6.26L11.29,7.56C11.44,7.73 11.7,7.73 11.85,7.56L13.88,5.27C14.03,5.09 14.03,4.83 13.88,4.65L12.83,3.06M17.44,4.21C17.38,4.21 17.32,4.21 17.26,4.22L14.73,4.94C14.47,5 14.3,5.25 14.35,5.52L14.9,7.91C14.96,8.17 15.2,8.35 15.47,8.31L17.93,7.56C18.2,7.5 18.35,7.25 18.31,6.98L17.76,4.59C17.71,4.37 17.58,4.21 17.44,4.21M6.56,4.21C6.42,4.21 6.29,4.37 6.24,4.59L5.69,6.98C5.65,7.25 5.8,7.5 6.07,7.56L8.53,8.31C8.8,8.35 9.04,8.17 9.1,7.91L9.65,5.52C9.7,5.25 9.53,5 9.27,4.94L6.74,4.22C6.68,4.21 6.62,4.21 6.56,4.21M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M19.94,11.5C19.94,11.5 20,11.5 20,11.5A2.5,2.5 0 0,0 17.5,9L17.44,9.03C16.5,8.73 15.41,8.91 14.7,9.6L14.56,9.75C14.85,10.28 15,10.89 15,11.5C15,12.75 14.15,13.82 13,14.28V15.58C14.12,16.11 15.06,17.15 15.06,18.44V19.85C16.71,19.85 18.06,18.5 18.06,16.85V14.5C19.13,14.5 20,13.6 20,12.5C20,12.14 19.97,11.81 19.94,11.5M4,12.5C4,13.6 4.87,14.5 5.94,14.5V16.85C5.94,18.5 7.29,19.85 8.94,19.85V18.44C8.94,17.15 9.88,16.11 11,15.58V14.28C9.85,13.82 9,12.75 9,11.5C9,10.89 9.15,10.28 9.44,9.75L9.3,9.6C8.59,8.91 7.5,8.73 6.56,9.03L6.5,9C4,9 4,11.5 4,11.5V12.5Z" />
    </svg>
);

export const CountryDetail: React.FC<CountryDetailProps> = ({ country, data, kpis, onGenerateReport }) => {

  const treemapData = Object.entries(data.generationMix)
    .map(([name, value]) => ({ name, GWh: value }))
    .filter(item => item.GWh > 0)
    .sort((a, b) => b.GWh - a.GWh);
  
  const totalGwh = treemapData.reduce((acc, item) => acc + item.GWh, 0);

  const renderCustomizedContent = React.useCallback((props: any) => {
    return <CustomizedContent {...props} totalValue={totalGwh} />;
  }, [totalGwh]);
  
  if (treemapData.length === 0) {
    return (
        <div className="flex flex-col h-full">
             <div className="flex justify-between items-center mb-2">
                <h2 className="text-base font-semibold text-brand-text-main">{country.name} Details</h2>
                <button 
                  onClick={onGenerateReport} 
                  className="px-3 py-1.5 bg-brand-primary/80 text-brand-bg rounded-md hover:bg-brand-primary transition-colors font-semibold text-xs flex items-center gap-x-1.5"
                >
                  <AiIcon className="w-4 h-4" />
                  Generate AI Report
                </button>
             </div>
             <div className="grid grid-cols-2 gap-1 mb-2">
                <KpiCard title="Loss by Trusting" value={`$${formatNumber(kpis.lossToTrust)}M`} tooltip="Economic loss from relying on an integrated system that may not materialize." />
                <KpiCard title="Loss by Not Trusting" value={`$${formatNumber(kpis.lossToNotTrust)}M`} tooltip="Economic loss from maintaining a redundant, isolated system." />
                <KpiCard title="Imports" value={`${formatNumber(kpis.energyBalance.imports)} GWh`} />
                <KpiCard title="Exports" value={`${formatNumber(kpis.energyBalance.exports)} GWh`} />
            </div>
            <div className="flex-grow min-h-0 flex items-center justify-center">
                 <p className="text-brand-text-secondary">No generation mix data available.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
       <div className="flex justify-between items-center mb-2">
        <h2 className="text-base font-semibold text-brand-text-main">{country.name} Details</h2>
        <button 
          onClick={onGenerateReport} 
          className="px-3 py-1.5 bg-brand-primary/80 text-brand-bg rounded-md hover:bg-brand-primary transition-colors font-semibold text-xs flex items-center gap-x-1.5"
        >
          <AiIcon className="w-4 h-4" />
          Generate AI Report
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-1 mb-2">
        <KpiCard title="Loss by Trusting" value={`$${formatNumber(kpis.lossToTrust)}M`} tooltip="Economic loss from relying on an integrated system that may not materialize." />
        <KpiCard title="Loss by Not Trusting" value={`$${formatNumber(kpis.lossToNotTrust)}M`} tooltip="Economic loss from maintaining a redundant, isolated system." />
        <KpiCard title="Imports" value={`${formatNumber(kpis.energyBalance.imports)} GWh`} />
        <KpiCard title="Exports" value={`${formatNumber(kpis.energyBalance.exports)} GWh`} />
      </div>

      <div className="h-[300px]">
        <h3 className="text-md font-semibold text-brand-text-secondary mb-1 text-center">Generation Mix (GWh)</h3>
        <ResponsiveContainer width="100%" height="92%">
          <Treemap
            data={treemapData}
            dataKey="GWh"
            content={renderCustomizedContent}
            isAnimationActive={false}
          >
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                borderColor: '#3f3f46',
                borderRadius: '0.5rem',
              }}
              itemStyle={{ color: '#FFFFFF' }}
              labelStyle={{ color: '#FFFFFF' }}
              formatter={(value: number, name: string, props: any) => {
                  const technologyName = props.payload.name;
                  const percentage = totalGwh > 0 ? ((value / totalGwh) * 100).toFixed(1) : '0.0';
                  return [`${value.toLocaleString()} GWh (${percentage}%)`, technologyName];
              }}
              cursor={{ fill: 'rgba(169, 181, 223, 0.5)' }}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
};