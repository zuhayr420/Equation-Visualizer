import React from 'react';
import { ThreeDStudio } from '../components/visualisation3d/ThreeDStudio';

export const Visualisation3DPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <ThreeDStudio />
    </div>
  );
};
