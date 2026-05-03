import { useState, useCallback, useRef } from 'react';

const PHASES = ['idle', 'finding_server', 'downloading', 'uploading', 'complete', 'error'];

const HISTORY_KEY = 'speedtest_history';
const MAX_HISTORY = 5;

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entry) {
  const history = loadHistory();
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return history;
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

export function useSpeedTest() {
  const [phase, setPhase] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [server, setServer] = useState(null);
  const [liveSpeed, setLiveSpeed] = useState(0);
  const [history, setHistory] = useState(loadHistory);
  const intervalRef = useRef(null);

  const simulateProgress = useCallback(() => {
    const startTime = Date.now();
    const totalDuration = 22000; // ~22s expected
    let baseSpeed = 0;
    let currentSpeed = 0;

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const raw = Math.min(elapsed / totalDuration, 0.98);
      setProgress(raw);

      // Phase transitions
      if (elapsed > 2000 && elapsed < 2200) {
        setPhase('downloading');
      } else if (elapsed > 14000 && elapsed < 14200) {
        setPhase('uploading');
        baseSpeed = 0; // Reset for upload phase
      }

      // Realistic speed simulation
      if (elapsed < 2000) {
        // Finding server — low fluctuation
        currentSpeed = 2 + Math.random() * 5;
      } else if (elapsed < 14000) {
        // Download phase — ramp up then fluctuate
        const dlElapsed = elapsed - 2000;
        const rampUp = Math.min(dlElapsed / 2000, 1); // 2s ramp
        const target = 60 + Math.random() * 80;
        baseSpeed += (target - baseSpeed) * 0.03;
        const jitter = (Math.random() - 0.5) * 30;
        const spike = Math.random() > 0.95 ? (Math.random() * 60) : 0;
        currentSpeed = Math.max(5, baseSpeed * rampUp + jitter + spike);
      } else {
        // Upload phase — ramp up then fluctuate at lower speed
        const ulElapsed = elapsed - 14000;
        const rampUp = Math.min(ulElapsed / 1500, 1);
        const target = 30 + Math.random() * 50;
        baseSpeed += (target - baseSpeed) * 0.03;
        const jitter = (Math.random() - 0.5) * 20;
        currentSpeed = Math.max(3, baseSpeed * rampUp + jitter);
      }

      setLiveSpeed(Math.max(0, currentSpeed));
    }, 80);
  }, []);

  const stopSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const runTest = useCallback(async () => {
    setError(null);
    setResults(null);
    setServer(null);
    setProgress(0);
    setLiveSpeed(0);
    setPhase('finding_server');
    simulateProgress();

    try {
      const response = await fetch('/api/speedtest');
      const data = await response.json();
      stopSimulation();

      if (data.success) {
        setResults({
          download: data.download,
          upload: data.upload,
          ping: data.ping,
        });
        if (data.server) {
          setServer(data.server);
        }
        setProgress(1);
        setPhase('complete');
        setLiveSpeed(data.download);

        // Save to history
        const newHistory = saveHistory({
          download: data.download,
          upload: data.upload,
          ping: data.ping,
          timestamp: Date.now(),
        });
        setHistory(newHistory);
      } else {
        setPhase('error');
        setError(data.error || 'Speed test failed');
        setLiveSpeed(0);
      }
    } catch (err) {
      stopSimulation();
      setPhase('error');
      setError(err.message || 'Connection error');
      setLiveSpeed(0);
    }
  }, [simulateProgress, stopSimulation]);

  const reset = useCallback(() => {
    stopSimulation();
    setPhase('idle');
    setProgress(0);
    setResults(null);
    setError(null);
    setServer(null);
    setLiveSpeed(0);
  }, [stopSimulation]);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  return {
    phase,
    progress,
    results,
    error,
    server,
    liveSpeed,
    history,
    runTest,
    reset,
    clearHistory: handleClearHistory,
    isTesting: !['idle', 'complete', 'error'].includes(phase),
  };
}
