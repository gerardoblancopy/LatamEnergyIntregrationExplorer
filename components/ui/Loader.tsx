

import React from 'react';

export const Loader: React.FC = () => (
  <div className="absolute inset-0 bg-brand-surface bg-opacity-50 flex items-center justify-center z-10">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-primary"></div>
  </div>
);