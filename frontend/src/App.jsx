import { useRef, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import ParticleBackground from './components/ParticleBackground';
import Header from './components/Header';
import Speedometer from './components/Speedometer';
import GoButton from './components/GoButton';
import ProgressBar from './components/ProgressBar';
import { useSpeedTest } from './hooks/useSpeedTest';
import StatusBar from './components/StatusBar';
import HelpMenu from './components/HelpMenu';
import Footer from './components/Footer';
import { useState, lazy, Suspense } from 'react';

// Lazy load non-critical components
const ResultsPanel = lazy(() => import('./components/ResultsPanel'));
const SpeedHistory = lazy(() => import('./components/SpeedHistory'));
const SpeedGraph = lazy(() => import('./components/SpeedGraph'));
const EstimatorPanel = lazy(() => import('./components/EstimatorPanel'));
const LegalContent = lazy(() => import('./components/LegalContent'));

const PHASE_LABELS = {
  idle: 'ready',
  finding_server: 'searching',
  downloading: 'download',
  uploading: 'upload',
  complete: 'finished',
  error: 'error',
};

function App() {
  const containerRef = useRef(null);
  const {
    phase,
    progress,
    results,
    error,
    server,
    liveSpeed,
    history,
    chartData,
    runTest,
    isTesting,
    clearHistory,
  } = useSpeedTest();

  const [legalType, setLegalType] = useState(null);

  const themeColor = useMemo(() => {
    switch (phase) {
      case 'downloading': return 'var(--download-color)';
      case 'uploading': return 'var(--upload-color)';
      case 'complete': return '#10b981'; // Success Green
      default: return 'var(--text-muted)';
    }
  }, [phase]);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const { left, top } = containerRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    containerRef.current.style.setProperty('--x', `${x}px`);
    containerRef.current.style.setProperty('--y', `${y}px`);
  };

  const displaySpeed = phase === 'complete' && results ? results.download : liveSpeed;
  const label = PHASE_LABELS[phase] || 'ready';

  return (
    <div 
      ref={containerRef} 
      onMouseMove={handleMouseMove}
      style={{ 
        minHeight: '100vh', 
        position: 'relative',
        '--active-theme': themeColor,
        transition: 'all 0.5s ease'
      }}
    >
      <ParticleBackground activeSpeed={displaySpeed} themeColor={themeColor} />
      <div className="ambient-glow" />



      <div className="app-container">
        <main>
          <div className="top-bar">
            <ThemeToggle />
            <HelpMenu />
          </div>
          
          <Header />

          <div className="speedometer-section">
            <Speedometer
              speed={displaySpeed}
              phase={phase}
              label={label}
            />

            {!isTesting && phase !== 'complete' && (
              <GoButton
                onClick={runTest}
                disabled={isTesting}
                isTesting={isTesting}
              />
            )}

            {isTesting && (
              <GoButton
                onClick={() => {}}
                disabled={true}
                isTesting={true}
              />
            )}

            <ProgressBar
              progress={progress}
              phase={phase}
              visible={isTesting || phase === 'complete'}
            />

              <Suspense fallback={null}>
              <SpeedGraph data={chartData} />
            </Suspense>

            {phase === 'complete' && (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <GoButton
                  onClick={runTest}
                  disabled={false}
                  isTesting={false}
                />
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              Speed test failed: {error}
            </div>
          )}

          <AnimatePresence>
            {phase === 'complete' && results && (
              <Suspense fallback={null}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <ResultsPanel
                    results={results}
                    server={server}
                    visible={true}
                  />
                  <EstimatorPanel 
                    results={results} 
                    visible={true} 
                  />
                </div>
              </Suspense>
            )}
          </AnimatePresence>

          <Suspense fallback={null}>
            <SpeedHistory history={history} onClear={clearHistory} />
          </Suspense>
        </main>

        <StatusBar />
        
        <Footer onOpenLegal={setLegalType} />
      </div>

      <AnimatePresence>
        {legalType && (
          <Suspense fallback={null}>
            <LegalContent 
              type={legalType} 
              onClose={() => setLegalType(null)} 
            />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
