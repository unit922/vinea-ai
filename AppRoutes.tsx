import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicLayout from './components/PublicLayout';
import Home from './pages/Home';
import Intelligence from './pages/Intelligence';
import Academy from './pages/Academy';
import Corporate from './pages/Corporate';
import Pricing from './pages/Pricing';
import Platform from './pages/Platform';
import MewsProposal from './pages/MewsProposal';

interface AppRoutesProps {
  onEnterDemo: () => void;
  onStartOnboarding: () => void;
  onLogin: () => void;
}

const AppRoutes: React.FC<AppRoutesProps> = ({ onEnterDemo, onStartOnboarding, onLogin }) => {
  return (
    <PublicLayout onEnterDemo={onEnterDemo} onStartOnboarding={onStartOnboarding} onLogin={onLogin}>
      <Routes>
        <Route path="/" element={<Home onEnterDemo={onEnterDemo} onStartOnboarding={onStartOnboarding} onLogin={onLogin} />} />
        <Route path="/intelligence" element={<Intelligence onEnterDemo={onEnterDemo} onStartOnboarding={onStartOnboarding} />} />
        <Route path="/academy" element={<Academy onEnterDemo={onEnterDemo} onStartOnboarding={onStartOnboarding} />} />
        <Route path="/corporate" element={<Corporate />} />
        <Route path="/pricing" element={<Pricing onEnterDemo={onEnterDemo} onStartOnboarding={onStartOnboarding} />} />
        <Route path="/platform" element={<Platform onEnterDemo={onEnterDemo} onStartOnboarding={onStartOnboarding} />} />
        <Route path="/partners/mews" element={<MewsProposal />} />
        {/* Fallback to Home */}
        <Route path="*" element={<Home onEnterDemo={onEnterDemo} onStartOnboarding={onStartOnboarding} onLogin={onLogin} />} />
      </Routes>
    </PublicLayout>
  );
};

export default AppRoutes;
