

import React from 'react';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';
import { Country, CountryData, CountryKpiData, GenerationMix } from '../types';
import { KpiCard } from './ui/Card';

// Define a simple SVG icon for the report button
const ReportIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h-1.5a3.375 3.375 0 01-3.375-3.375V9.75m12 .75l-3 3m0 0l3 3m0-3h7.5" />
    </svg>
);

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
          <ReportIcon className="w-4 h-4" />
          Generate Report
        </button>
             </div>
             <div className="grid grid-cols-2 gap-1 mb-2">
                <KpiCard title="Loss by Trusting" value={`${formatNumber(kpis.lossToTrust)}M`} tooltip="Economic loss from relying on an integrated system that may not materialize." />
                <KpiCard title="Loss by Not Trusting" value={`${formatNumber(kpis.lossToNotTrust)}M`} tooltip="Economic loss from maintaining a redundant, isolated system." />
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
          <ReportIcon className="w-4 h-4" />
          Generate Report
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-1 mb-2">
        <KpiCard title="Loss by Trusting" value={`${formatNumber(kpis.lossToTrust)}M`} tooltip="Economic loss from relying on an integrated system that may not materialize." />
        <KpiCard title="Loss by Not Trusting" value={`${formatNumber(kpis.lossToNotTrust)}M`} tooltip="Economic loss from maintaining a redundant, isolated system." />
        <KpiCard title="Imports" value={`${formatNumber(kpis.energyBalance.imports)} GWh`} />
        <KpiCard title="Exports" value={`${formatNumber(kpis.energyBalance.exports)} GWh`} />
      </div>

      <div className="h-[300px]">
        <h3 className="text-md font-semibold text-brand-text-secondary mb-1 text-center">Generation Mix (GWh)</h3>
        <ResponsiveContainer width="100%" height="92%">
          <Treemap
            data={treemapData}
            dataKey="GWh"
            content={<CustomizedContent totalValue={totalGwh} />}
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