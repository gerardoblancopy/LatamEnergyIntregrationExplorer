
import React, { useMemo } from 'react';
import {
    createInvestmentChartSvg,
    createInvestmentTableHtml,
    generateExecutiveSummary,
    generateInvestmentAnalysis,
    generateInvestmentMixAnalysis,
    generateRegionalComparison,
    generateStrategicOutlook
} from '../services/aiService';
import { ScenarioConfig, Country, CountryKpiData, CountryInvestmentData, RegionalKpiData, GenerationMix } from '../types';

export interface ReportData {
  country: Country;
  config: ScenarioConfig;
  countryKpis: CountryKpiData;
  countryInvestment: CountryInvestmentData;
  regionalInvestment: CountryInvestmentData;
  regionalKpis: RegionalKpiData;
  countryGenerationMix: GenerationMix;
}

interface ReportModalProps {
  onClose: () => void;
  data: ReportData;
}

const AILogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12.83,3.06C12.56,3.06 12.33,3.17 12.17,3.35L10.15,5.64C10,5.82 10,6.08 10.15,6.26L11.29,7.56C11.44,7.73 11.7,7.73 11.85,7.56L13.88,5.27C14.03,5.09 14.03,4.83 13.88,4.65L12.83,3.06M17.44,4.21C17.38,4.21 17.32,4.21 17.26,4.22L14.73,4.94C14.47,5 14.3,5.25 14.35,5.52L14.9,7.91C14.96,8.17 15.2,8.35 15.47,8.31L17.93,7.56C18.2,7.5 18.35,7.25 18.31,6.98L17.76,4.59C17.71,4.37 17.58,4.21 17.44,4.21M6.56,4.21C6.42,4.21 6.29,4.37 6.24,4.59L5.69,6.98C5.65,7.25 5.8,7.5 6.07,7.56L8.53,8.31C8.8,8.35 9.04,8.17 9.1,7.91L9.65,5.52C9.7,5.25 9.53,5 9.27,4.94L6.74,4.22C6.68,4.21 6.62,4.21 6.56,4.21M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M19.94,11.5C19.94,11.5 20,11.5 20,11.5A2.5,2.5 0 0,0 17.5,9L17.44,9.03C16.5,8.73 15.41,8.91 14.7,9.6L14.56,9.75C14.85,10.28 15,10.89 15,11.5C15,12.75 14.15,13.82 13,14.28V15.58C14.12,16.11 15.06,17.15 15.06,18.44V19.85C16.71,19.85 18.06,18.5 18.06,16.85V14.5C19.13,14.5 20,13.6 20,12.5C20,12.14 19.97,11.81 19.94,11.5M4,12.5C4,13.6 4.87,14.5 5.94,14.5V16.85C5.94,18.5 7.29,19.85 8.94,19.85V18.44C8.94,17.15 9.88,16.11 11,15.58V14.28C9.85,13.82 9,12.75 9,11.5C9,10.89 9.15,10.28 9.44,9.75L9.3,9.6C8.59,8.91 7.5,8.73 6.56,9.03L6.5,9C4,9 4,11.5 4,11.5V12.5Z" />
    </svg>
);

const Section: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
    <div>
        <h2 className="text-xl font-semibold text-brand-primary border-b border-brand-border pb-2 mt-6 mb-3">{title}</h2>
        <div dangerouslySetInnerHTML={{ __html: children as string }} />
    </div>
);


export const ReportModal: React.FC<ReportModalProps> = ({ onClose, data }) => {
    
    const executiveSummary = useMemo(() => generateExecutiveSummary(data), [data]);
    const investmentAnalysis = useMemo(() => generateInvestmentAnalysis(data), [data]);
    const investmentMixAnalysis = useMemo(() => generateInvestmentMixAnalysis(data), [data]);
    const regionalComparison = useMemo(() => generateRegionalComparison(data), [data]);
    const strategicOutlook = useMemo(() => generateStrategicOutlook(data), [data]);

    const investmentChartHtml = useMemo(() => createInvestmentChartSvg(data.countryInvestment), [data.countryInvestment]);
    const investmentTableHtml = useMemo(() => createInvestmentTableHtml(data.country.name, data.countryInvestment, data.regionalInvestment), [data]);
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-brand-surface border border-brand-border rounded-lg p-6 max-w-4xl w-full flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-brand-primary flex items-center gap-x-2">
                        <AILogo className="h-6 w-6" />
                        Scenario Analysis: {data.country.name}
                    </h2>
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-white transition-colors text-2xl font-bold">&times;</button>
                </div>
                
                <div id="ai-report-container" className="flex-grow overflow-y-auto pr-2 min-h-0">
                     <style>
                        {`
                        #ai-report-container{font-family:'Montserrat',sans-serif;color:#d1d5db;line-height:1.6;font-size:14px}
                        #ai-report-container h2{font-size:1.25rem;font-weight:600;color:#A9B5DF;border-bottom:1px solid #3f3f46;padding-bottom:0.5rem;margin-top:1.5rem;margin-bottom:1rem}
                        #ai-report-container h3{font-size:1rem;font-weight:600;color:#FFF2F2;margin-top:1.2rem;margin-bottom:0.8rem}
                        #ai-report-container p,#ai-report-container ul{margin-bottom:1rem}
                        #ai-report-container strong{color:#FFF2F2;font-weight:500}
                        #ai-report-container ul{list-style-position:inside;padding-left:0.5rem}
                        #ai-report-container li{margin-bottom:0.5rem}
                        #ai-report-container .table-container{overflow-x:auto}
                        #ai-report-container table{width:100%;border-collapse:collapse;margin-top:1rem;margin-bottom:1rem;font-size:13px}
                        #ai-report-container th,#ai-report-container td{border:1px solid #3f3f46;padding:0.6rem 0.8rem;text-align:left}
                        #ai-report-container th{background-color:#3f3f46;color:#FFFFFF;font-weight:600}
                        #ai-report-container tr:nth-child(even){background-color:#1f1f23}
                        #ai-report-container svg{max-width:100%;height:auto;display:block;margin:0 auto;}
                        `}
                    </style>
                    <Section title="Executive Summary">{executiveSummary}</Section>
                    
                    <h2>Investment Mix Overview ({data.config.year})</h2>
                    <div dangerouslySetInnerHTML={{ __html: investmentChartHtml }} />
                    <div dangerouslySetInnerHTML={{ __html: investmentMixAnalysis}} />
                    
                    <Section title="Investment Portfolio Analysis">{investmentAnalysis}</Section>

                    <h2>Regional Investment Comparison</h2>
                    <div dangerouslySetInnerHTML={{ __html: investmentTableHtml }} />
                    <div dangerouslySetInnerHTML={{ __html: regionalComparison}} />
                    
                    <Section title="Strategic Outlook">{strategicOutlook}</Section>
                </div>

                <div className="mt-6 text-right flex-shrink-0">
                  <button onClick={onClose} className="px-4 py-2 bg-brand-primary text-brand-bg rounded-md hover:bg-brand-secondary transition-colors font-semibold">
                    Close
                  </button>
                </div>
            </div>
        </div>
    );
};
