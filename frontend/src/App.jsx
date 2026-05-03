import { AnimatePresence } from 'framer-motion';
import ParticleBackground from './components/ParticleBackground';
import Header from './components/Header';
import Speedometer from './components/Speedometer';
import GoButton from './components/GoButton';
import ProgressBar from './components/ProgressBar';
import ResultsPanel from './components/ResultsPanel';
import NetworkInfo from './components/NetworkInfo';
import SpeedHistory from './components/SpeedHistory';
import ThemeToggle from './components/ThemeToggle';
import SpeedGraph from './components/SpeedGraph';
import EstimatorPanel from './components/EstimatorPanel';
import { useSpeedTest } from './hooks/useSpeedTest';

const PHASE_LABELS = {
  idle: 'ready',
  finding_server: 'searching',
  downloading: 'download',
  uploading: 'upload',
  complete: 'download',
  error: 'error',
};

function App() {
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

  const displaySpeed = phase === 'complete' && results ? results.download : liveSpeed;
  const label = PHASE_LABELS[phase] || 'ready';

  return (
    <>
      <ParticleBackground />
      <div className="ambient-glow" />

      <div className="app-container">
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem' }}>
          <ThemeToggle />
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

          <SpeedGraph data={chartData} />

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
          )}
        </AnimatePresence>

        <NetworkInfo />

        <SpeedHistory history={history} onClear={clearHistory} />
      </div>
    </>
  );
}

export default App;
