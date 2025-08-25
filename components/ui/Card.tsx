

import React, { useState } from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  tooltip?: string;
}

const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);


export const KpiCard: React.FC<KpiCardProps> = ({ title, value, tooltip }) => {
    const [tooltipVisible, setTooltipVisible] = useState(false);

    return (
        <div className="bg-brand-bg border border-brand-border py-1 px-1 rounded-lg text-center relative">
            <div className="flex items-center justify-center space-x-1">
                 <h4 className="text-xs text-brand-text-secondary font-medium">{title}</h4>
                 {tooltip && (
                    <div className="relative" onMouseEnter={() => setTooltipVisible(true)} onMouseLeave={() => setTooltipVisible(false)}>
                        <InfoIcon className="text-brand-text-secondary cursor-pointer" />
                        {tooltipVisible && (
                            <div className="absolute bottom-full mb-2 w-48 bg-brand-surface text-white text-xs rounded py-1 px-2 z-10 border border-brand-border shadow-lg">
                                {tooltip}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <p className="text-sm md:text-base font-bold text-brand-text-main mt-0.5">{value}</p>
        </div>
    );
};