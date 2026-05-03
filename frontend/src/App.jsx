import { AnimatePresence } from 'framer-motion';
import ParticleBackground from './components/ParticleBackground';
import Header from './components/Header';
import Speedometer from './components/Speedometer';
import GoButton from './components/GoButton';
import ProgressBar from './components/ProgressBar';
import ResultsPanel from './components/ResultsPanel';
import NetworkInfo from './components/NetworkInfo';
import SpeedHistory from './components/SpeedHistory';
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
            <ResultsPanel
              results={results}
              server={server}
              visible={true}
            />
          )}
        </AnimatePresence>

        <NetworkInfo />

        <SpeedHistory history={history} onClear={clearHistory} />
      </div>
    </>
  );
}

export default App;
