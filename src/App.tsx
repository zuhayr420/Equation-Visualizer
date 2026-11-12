import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { Layout } from './components/layout/Layout';
import { OverviewPage } from './pages/OverviewPage';
import { EquationStudioPage } from './pages/EquationStudioPage';
import { Graph2DPage } from './pages/Graph2DPage';
import { Visualisation3DPage } from './pages/Visualisation3DPage';
import { SolverPage } from './pages/SolverPage';
import { CalculusLabPage } from './pages/CalculusLabPage';
import { AITutorPage } from './pages/AITutorPage';
import { LibraryPage } from './pages/LibraryPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  const { activeSection, loadProjects, loadHistory } = useAppStore();

  useEffect(() => {
    loadProjects();
    loadHistory();
  }, [loadProjects, loadHistory]);

  const renderActivePage = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewPage />;
      case 'equation-studio':
        return <EquationStudioPage />;
      case '2d-graphs':
        return <Graph2DPage />;
      case '3d-visualisation':
        return <Visualisation3DPage />;
      case 'solver':
        return <SolverPage />;
      case 'calculus-lab':
        return <CalculusLabPage />;
      case 'ai-tutor':
        return <AITutorPage />;
      case 'library':
        return <LibraryPage />;
      case 'history':
        return <HistoryPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage />;
    }
  };

  return <Layout>{renderActivePage()}</Layout>;
}

export default App;
