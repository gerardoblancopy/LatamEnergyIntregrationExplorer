
import { GenerationMix, CountryInvestmentData } from '../types';
import { ReportData } from "../components/ReportModal";

export const INVESTMENT_COLORS: { [key in keyof CountryInvestmentData]: string } = {
    Solar: '#A9B5DF', 
    Wind: '#7886C7',
    BESS: '#FFF2F2',
    Gas: '#cad0e6',
    Diesel: '#E5C593',
    Coal: '#4e5691',
};
const investmentOrder: (keyof CountryInvestmentData)[] = ['Solar', 'Wind', 'BESS', 'Gas', 'Diesel', 'Coal'];

export function createInvestmentChartSvg(investmentData: CountryInvestmentData): string {
    const data = investmentOrder
        .map(key => ({ name: key, value: investmentData[key] || 0 }))
        .filter(d => d.value > 0);

    if (data.length === 0) return '<p class="text-center text-brand-text-secondary italic">No new investment data available for this scenario.</p>';

    const totalInvestment = data.reduce((acc, item) => acc + item.value, 0);
    const maxVal = Math.max(...data.map(d => d.value));
    const chartHeight = data.length * 40;
    const width = 500;
    const barHeight = 25;
    const labelWidth = 100;
    const chartWidth = width - labelWidth - 150; // Adjusted for value labels

    const bars = data.map((d, i) => {
        const barWidth = d.value > 0 ? (d.value / maxVal) * chartWidth : 0;
        const y = i * 40;
        const color = INVESTMENT_COLORS[d.name as keyof CountryInvestmentData] || '#ccc';
        return `
            <g transform="translate(0, ${y})">
                <text x="${labelWidth - 10}" y="${barHeight / 2}" dy="0.35em" fill="#d1d5db" text-anchor="end" font-size="14">${d.name}</text>
                <rect x="${labelWidth}" y="0" width="${barWidth}" height="${barHeight}" fill="${color}" rx="3"></rect>
                <text x="${labelWidth + barWidth + 10}" y="${barHeight / 2}" dy="0.35em" fill="#FFF2F2" font-size="14" font-weight="500">
                    ${d.value.toLocaleString(undefined, {maximumFractionDigits:0})} MW (${(d.value / totalInvestment * 100).toFixed(1)}%)
                </text>
            </g>
        `;
    }).join('');

    return `
        <svg width="100%" viewBox="0 0 ${width} ${chartHeight}" style="max-width:100%; height:auto; display:block; margin: 1rem auto;">
            ${bars}
        </svg>
    `;
}

export function createInvestmentTableHtml(countryName: string, countryInvestment: CountryInvestmentData, regionalInvestment: CountryInvestmentData): string {
    const totalCountryInv = Object.values(countryInvestment).reduce((s, v) => s + v, 0);
    const totalRegionalInv = Object.values(regionalInvestment).reduce((s, v) => s + v, 0);

    const rows = investmentOrder
        .filter(key => (countryInvestment[key] || 0) > 0 || (regionalInvestment[key] || 0) > 0)
        .map(key => {
            const countryValue = countryInvestment[key] || 0;
            const regionalValue = regionalInvestment[key] || 0;
            const countryPct = totalCountryInv > 0 ? ((countryValue / totalCountryInv) * 100).toFixed(1) : '0.0';
            const regionalPct = totalRegionalInv > 0 ? ((regionalValue / totalRegionalInv) * 100).toFixed(1) : '0.0';

            return `
                <tr>
                    <td style="display: flex; align-items: center; gap: 8px;">
                        <span style="display: inline-block; width: 12px; height: 12px; border-radius: 2px; background-color: ${INVESTMENT_COLORS[key] || '#ccc'};"></span>
                        ${key}
                    </td>
                    <td>${countryValue.toLocaleString(undefined, {maximumFractionDigits:0})}MW</td>
                    <td>${countryPct}%</td>
                    <td>${regionalValue.toLocaleString(undefined, {maximumFractionDigits:0})}MW</td>
                    <td>${regionalPct}%</td>
                </tr>
            `;
        }).join('');

    return `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Technology</th>
                        <th>${countryName} Inv. (MW)</th>
                        <th>${countryName} Share (%)</th>
                        <th>Regional Inv. (MW)</th>
                        <th>Regional Share (%)</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

export const generateExecutiveSummary = (data: ReportData): string => {
    const { country, config, countryInvestment, regionalKpis } = data;
    const totalInvestment = Object.values(countryInvestment).reduce((a, b) => a + b, 0);
    const investments = Object.entries(countryInvestment).filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]);
    
    let summary = `<p>In the <strong>${config.year} ${config.transmission}</strong> scenario, ${country.name}'s energy strategy is characterized by a significant investment of <strong>${totalInvestment.toLocaleString(undefined, {maximumFractionDigits:0})} MW</strong>. `;

    if (investments.length > 0) {
        const topInvestment = investments[0][0];
        const isRenewableFocused = ['Solar', 'Wind', 'BESS'].includes(topInvestment);
        summary += `The investment portfolio is heavily skewed towards <strong>${topInvestment}</strong>, highlighting a clear focus on ${isRenewableFocused ? 'decarbonization and the energy transition.' : 'securing stable, conventional power sources.'}</p>`;
    } else {
        summary += `This scenario does not involve new generation or storage investments, suggesting a reliance on existing capacity and potentially energy imports.</p>`;
    }

    summary += `<p>This approach is set against a regional backdrop of a total investment of <strong>${(regionalKpis.totalInvestment / 1000).toFixed(1)} GW</strong>. The country's decisions align with the scenario's parameters, which factor in a '${config.demand}' demand growth and a policy of '${config.sovereignty === 'WithSovereignty' ? 'energy sovereignty' : 'regional integration'}'.</p>`;
    
    return summary;
};

export const generateInvestmentAnalysis = (data: ReportData): string => {
    const { countryInvestment, countryGenerationMix } = data;
    const investments = Object.entries(countryInvestment).filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]);
    
    if (investments.length === 0) {
        return `<p>In this scenario, there is no new investment in generation or storage capacity for this country. The strategy likely relies on existing assets, demand management, or energy trading to meet its needs.</p>`;
    }

    const topInvestment = investments[0];
    const otherInvestments = investments.slice(1);

    let analysis = `<p>The investment portfolio is led by a major allocation of <strong>${topInvestment[1].toLocaleString(undefined, {maximumFractionDigits:0})} MW</strong> towards <strong>${topInvestment[0]}</strong>. This indicates that ${topInvestment[0]} is considered the cornerstone of the country's future energy system under these specific scenario conditions.</p>`;

    if (otherInvestments.length > 0) {
        analysis += `<h3>Other Key Investments</h3><p>Beyond the primary focus on ${topInvestment[0]}, the portfolio is diversified with other strategic investments:</p><ul>`;
        otherInvestments.forEach(([tech, value]) => {
            analysis += `<li><strong>${tech}:</strong> An investment of ${value.toLocaleString(undefined, {maximumFractionDigits:0})} MW is allocated to support ${tech} capacity, likely to ensure grid stability, meet peak demand, or complement the primary generation sources.</li>`;
        });
        analysis += `</ul>`;
    }
    
    const hasInitialCoal = (countryGenerationMix.Coal || 0) > 0;
    const hasNewCoalInvestment = (countryInvestment.Coal || 0) > 0;

    if (!hasNewCoalInvestment) {
        if(hasInitialCoal) {
            analysis += `<p>Notably, this scenario sees a complete divestment from new <strong>Coal</strong> projects, signaling a strategic pivot away from this carbon-intensive fuel source.</p>`;
        } else {
            analysis += `<p>Notably, the country continues its policy of avoiding investment in new <strong>Coal</strong> projects, reinforcing its commitment to cleaner energy pathways in this scenario.</p>`;
        }
    }

    return analysis;
};

export const generateInvestmentMixAnalysis = (data: ReportData): string => {
    const { countryInvestment } = data;
    const totalInvestment = Object.values(countryInvestment).reduce((a,b) => a+b, 0);

    if (totalInvestment === 0) {
        return `<p>There is no new generation investment to analyze for this country in this scenario.</p>`
    }

    const renewableInvestment = (countryInvestment.Solar || 0) + (countryInvestment.Wind || 0);
    const renewablePercentage = (renewableInvestment / totalInvestment) * 100;

    let analysis = `<p>The investment chart illustrates a clear strategic direction. `
    if (renewablePercentage > 60) {
        analysis += `A significant majority of capital, approximately <strong>${renewablePercentage.toFixed(0)}%</strong>, is directed towards renewable sources like Solar and Wind. This aggressive push towards green energy underscores a policy of decarbonization.`
    } else if (renewablePercentage > 30) {
        analysis += `A balanced approach is evident, with roughly <strong>${renewablePercentage.toFixed(0)}%</strong> of investment in renewable sources. This is complemented by significant funding for storage (BESS) and flexible generation (Gas) to ensure grid reliability.`
    } else {
        analysis += `The investment strategy appears to prioritize grid stability and on-demand power, with a smaller portion, around <strong>${renewablePercentage.toFixed(0)}%</strong>, allocated to intermittent renewables.`
    }
    analysis += `</p>`;
    return analysis;
}

export const generateRegionalComparison = (data: ReportData): string => {
    const { country, countryInvestment, regionalInvestment } = data;
    const totalCountryInv = Object.values(countryInvestment).reduce((s, v) => s + v, 0);
    const totalRegionalInv = Object.values(regionalInvestment).reduce((s, v) => s + v, 0);

    if (totalCountryInv === 0) {
        return `<p>${country.name} makes no new investments in this scenario, while the region invests heavily in a diverse portfolio, indicating a divergent path where ${country.name} may become more reliant on its neighbors or existing infrastructure.</p>`;
    }

    const countrySolarPct = totalCountryInv > 0 ? (countryInvestment.Solar || 0) / totalCountryInv : 0;
    const regionalSolarPct = totalRegionalInv > 0 ? (regionalInvestment.Solar || 0) / totalRegionalInv : 0;
    const diff = (countrySolarPct - regionalSolarPct) * 100;
    
    let comparison = `<p>Compared to the regional average, ${country.name}'s investment strategy shows notable differences. `;

    if (Math.abs(diff) < 10) {
        comparison += `For instance, its allocation to <strong>Solar</strong> is closely aligned with the regional trend. `;
    } else if (diff > 0) {
        comparison += `For instance, it places a much stronger emphasis on <strong>Solar</strong>, dedicating <strong>${(countrySolarPct * 100).toFixed(1)}%</strong> of its portfolio compared to the region's <strong>${(regionalSolarPct * 100).toFixed(1)}%</strong>. `;
    } else {
        comparison += `For instance, it invests significantly less in <strong>Solar</strong>, allocating only <strong>${(countrySolarPct * 100).toFixed(1)}%</strong> of its budget compared to the regional average of <strong>${(regionalSolarPct * 100).toFixed(1)}%</strong>. `;
    }
    comparison += `This suggests a unique national strategy, potentially driven by local resource availability or specific policy goals.</p>`;

    return comparison;
}

export const generateStrategicOutlook = (data: ReportData): string => {
    const { countryKpis, config } = data;
    const { lossToTrust, lossToNotTrust, energyBalance } = countryKpis;
    
    let outlook = `<h3>Energy Security and Trade</h3>`;
    if (energyBalance.imports > energyBalance.exports) {
        outlook += `<p>${data.country.name} positions itself as a net energy <strong>importer</strong> in this scenario, relying on its neighbors for <strong>${(energyBalance.imports - energyBalance.exports).toLocaleString(undefined, {maximumFractionDigits:0})} GWh</strong>. This enhances energy diversity but introduces a dependency on regional stability.</p>`;
    } else if (energyBalance.exports > energyBalance.imports) {
        outlook += `<p>${data.country.name} emerges as a key energy <strong>exporter</strong>, supplying <strong>${(energyBalance.exports - energyBalance.imports).toLocaleString(undefined, {maximumFractionDigits:0})} GWh</strong> to the region. This strategy can generate revenue but requires robust infrastructure and stable regional markets.</p>`;
    } else {
        outlook += `<p>${data.country.name} maintains a balanced energy trade profile, with imports and exports roughly equal. This suggests a strategy focused on self-sufficiency and using trade for grid balancing rather than as a primary source or revenue stream.</p>`;
    }

    
    if (config.transmission === 'Isolated') {
        outlook += `<h3>Geopolitical Risk Analysis</h3>`;
        outlook += `<p>In an 'Isolated' system scenario, the concepts of 'Loss by Trusting' and 'Loss by Not Trusting' are less relevant, as the foundational assumption is national self-reliance. The primary focus is on ensuring sufficient domestic capacity to meet all demands without relying on international cooperation.</p>`;
    } else {
        outlook += `<h3>Geopolitical Risk Analysis</h3>`;
        if (lossToTrust > lossToNotTrust) {
            outlook += `<p>The greater "Loss by Trusting" (<strong>${lossToTrust.toFixed(0)}M</strong>) compared to "Loss by Not Trusting" (<strong>${lossToNotTrust.toFixed(0)}M</strong>) suggests that the country has a higher risk by cooperating and will tend not to trust the integration process.</p>`;
        } else {
            outlook += `<p>The greater "Loss by Not Trusting" (<strong>${lossToNotTrust.toFixed(0)}M</strong>) compared to "Loss by Trusting" (<strong>${lossToTrust.toFixed(0)}M</strong>) suggests that the country will tend to trust and would benefit from leading the integration process.</p>`;
        }
    }
    
    return outlook;
}
