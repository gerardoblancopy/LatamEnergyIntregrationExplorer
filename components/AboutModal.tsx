

import React from 'react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-brand-surface border border-brand-border rounded-lg p-6 max-w-2xl w-full flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-brand-primary flex-shrink-0">About This Application</h2>
        
        <div className="flex-grow space-y-4 text-brand-text-secondary overflow-y-auto pr-2">
          <p>
            The <strong>LATAM Energy Integration Explorer</strong> is an interactive tool designed to visualize and analyze future scenarios for Latin America's energy sector. It is based on the research and data presented in the white paper: <em>"Integración energética y descarbonización en América Latina: La dinámica de la integración bajo el enfoque de corrientes múltiples"</em>.
          </p>
          <p>
            This application allows users to explore the impacts of different policy choices, technological pathways, and climate conditions on the region's energy security, economic costs, and decarbonization efforts.
          </p>
          
          <div>
            <h3 className="font-semibold text-brand-text-main mb-2">Key Metrics:</h3>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Geopolitical Cost:</strong> Represents the economic "premium" or cost incurred by a country for prioritizing energy sovereignty over potentially more efficient regional integration.</li>
              <li><strong>Loss by Trusting:</strong> The potential economic loss a country faces if it invests based on regional cooperation that ultimately fails to deliver, leaving it with an energy deficit.</li>
              <li><strong>Loss by Not Trusting:</strong> The opportunity cost a country incurs by over-investing in redundant national infrastructure instead of benefiting from a more cost-effective, integrated regional system.</li>
            </ul>
          </div>

          <p>
            All data is pre-calculated from a sophisticated optimization model detailed in the source paper. This web application serves as a visualization layer and does not run live simulations.
          </p>
          <p>
            This application is designed to provide insights into the complex dynamics of energy integration and decarbonization in Latin America. It serves as a valuable resource for policymakers, researchers, and stakeholders interested in the region's energy future.
          </p>
          <p>
            You can access and explore the application at: <a href="https://explorer.energia.la" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">https://explorer.energia.la</a>
          </p>
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