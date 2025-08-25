

import React from 'react';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';
import { RegionalData, RegionalKpiData, GenerationMix } from '../types';
import { KpiCard } from './ui/Card';

interface RegionalSummaryProps {
  regionalData: RegionalData;
  kpis: RegionalKpiData;
}

const COLORS: { [key in keyof GenerationMix]: string } = {
  Solar: '#A9B5DF', 
  Wind: '#7886C7',
  Nuclear: '#FFF2F2', 
  Hydroelectric: '#96a1d1',
  Coal: '#4e5691',
  Gas: '#cad0e6',
  Diesel: '#E5C593',
};


// Robust custom content renderer
const CustomizedContent: React.FC<any> = (props) => {
  const { x, y, width, height, name, value, totalValue } = props;

  if (!isFinite(x) || !isFinite(y) || !isFinite(width) || !isFinite(height) || width <= 0 || height <= 0 || !name) {
    return null;
  }
  
  const color = COLORS[name as keyof GenerationMix] || '#30363D';
  const PADDING = 2;
  const innerWidth = width - PADDING * 2;
  const innerHeight = height - PADDING * 2;

  if (innerWidth <= 0 || innerHeight <= 0) return null;

  const canShowText = innerWidth > 45 && innerHeight > 15;
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

const formatBillions = (num: number) => {
    return (num / 1000).toFixed(1);
}

export const RegionalSummary: React.FC<RegionalSummaryProps> = ({ regionalData, kpis }) => {
  const treemapData = Object.entries(regionalData.generationMix)
    .map(([name, value]) => ({ name, GWh: value }))
    .filter(item => item.GWh > 0)
    .sort((a, b) => b.GWh - a.GWh);

  const totalGwh = treemapData.reduce((acc, item) => acc + item.GWh, 0);

  const renderCustomizedContent = React.useCallback((props: any) => {
    return <CustomizedContent {...props} totalValue={totalGwh} />;
  }, [totalGwh]);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-base font-semibold mb-2 text-brand-text-main">Regional Summary</h2>
      <div className="grid grid-cols-2 gap-1 mb-2">
        <KpiCard title="Total Cost" value={`$${formatBillions(kpis.totalCost)}B`} />
        <KpiCard title="Investment" value={`$${formatBillions(kpis.totalInvestment)}B`} />
        <KpiCard title="Emissions" value={`${kpis.totalEmissions.toFixed(1)} MtCO₂`} />
        <KpiCard title="Geopolitical Cost" value={`$${formatBillions(kpis.geopoliticalCost)}B`} />
      </div>
      <div className="h-[300px]">
         <h3 className="text-md font-semibold text-brand-text-secondary mb-1 text-center">Regional Generation Mix (GWh)</h3>
         <ResponsiveContainer width="100%" height="92%">
            <Treemap
              data={treemapData}
              dataKey="GWh"
              content={renderCustomizedContent as any}
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