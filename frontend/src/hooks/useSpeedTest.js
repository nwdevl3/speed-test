import { useState, useCallback, useRef } from 'react';

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

export function useSpeedTest() {
  const [phase, setPhase] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [server, setServer] = useState(null);
  const [liveSpeed, setLiveSpeed] = useState(0);
  const [history, setHistory] = useState(loadHistory);
  const [chartData, setChartData] = useState([]); // Stores { time, download, upload }

  const abortControllerRef = useRef(null);
  const xhrRefs = useRef([]);

  const runTest = useCallback(async () => {
    if (phase !== 'idle' && phase !== 'complete' && phase !== 'error') return;

    setPhase('finding_server');
    setProgress(0);
    setResults(null);
    setError(null);
    setLiveSpeed(0);
    setChartData([]);
    setServer({ name: 'Cloudflare Edge', location: 'Global' });

    abortControllerRef.current = new AbortController();
    xhrRefs.current = [];
    
    let finalDownload = 0;
    let finalUpload = 0;
    let finalPing = 0;
    let finalJitter = 0;
    
    const newChartData = [];

    try {
      // 1. PING & JITTER TEST (10 pings)
      const pings = [];
      for (let i = 0; i < 10; i++) {
        const pingStart = performance.now();
        await fetch('/api/network-info', { cache: 'no-cache', signal: abortControllerRef.current.signal });
        pings.push(performance.now() - pingStart);
      }
      
      finalPing = pings.reduce((a, b) => a + b, 0) / pings.length;
      
      // Calculate Jitter (average absolute difference between consecutive pings)
      let jitterSum = 0;
      for (let i = 1; i < pings.length; i++) {
        jitterSum += Math.abs(pings[i] - pings[i - 1]);
      }
      finalJitter = pings.length > 1 ? jitterSum / (pings.length - 1) : 0;

      setProgress(0.1);
      
      // 2. DOWNLOAD TEST (Parallel connections)
      setPhase('downloading');
      const dlStart = performance.now();
      let loadedBytes = 0;
      const numConnections = 4;
      const dlPromises = [];
      
      let lastUpdate = performance.now();

      for (let i = 0; i < numConnections; i++) {
        dlPromises.push((async () => {
          try {
            const res = await fetch(`https://speed.cloudflare.com/__down?bytes=26214400&c=${i}`, {
              cache: 'no-cache',
              signal: abortControllerRef.current.signal
            });
            const reader = res.body.getReader();
            let isDone = false;
            while (!isDone) {
              const { value, done } = await reader.read();
              isDone = done;
              if (value) loadedBytes += value.length;

              const now = performance.now();
              const elapsedSec = (now - dlStart) / 1000;
              
              if (now - lastUpdate > 100) {
                if (elapsedSec > 0.1) {
                  const currentSpeed = (loadedBytes * 8 / 1000000) / elapsedSec;
                  setLiveSpeed(currentSpeed);
                  setProgress(0.1 + Math.min((elapsedSec / 8), 1) * 0.4);
                  newChartData.push({ time: elapsedSec.toFixed(1), download: currentSpeed, upload: null });
                  setChartData([...newChartData]);
                }
                lastUpdate = now;
              }
              
              if (elapsedSec > 8) break;
            }
          } catch (e) {
            // Ignore aborts
          }
        })());
      }
      
      await Promise.all(dlPromises);
      
      const dlElapsedSec = Math.max((performance.now() - dlStart) / 1000, 0.1);
      finalDownload = (loadedBytes * 8 / 1000000) / Math.min(dlElapsedSec, 8);
      setLiveSpeed(finalDownload);
      setProgress(0.5);

      // 3. UPLOAD TEST (Parallel connections)
      setPhase('uploading');
      setLiveSpeed(0);
      
      const upStart = performance.now();
      const uploadBytesPerConn = 52428800; // 50MB payload
      const dummyData = new Uint8Array(uploadBytesPerConn);
      const blob = new Blob([dummyData], { type: 'application/octet-stream' });
      
      let uploadedBytes = 0;
      let upLastUpdate = performance.now();
      const upPromises = [];

      for (let i = 0; i < numConnections; i++) {
        upPromises.push(new Promise((resolve) => {
          const xhr = new XMLHttpRequest();
          xhrRefs.current.push(xhr);
          
          let lastLoaded = 0;
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const diff = e.loaded - lastLoaded;
              lastLoaded = e.loaded;
              uploadedBytes += diff;

              const now = performance.now();
              const elapsedSec = (now - upStart) / 1000;
              
              if (now - upLastUpdate > 100) {
                if (elapsedSec > 0.1) {
                  const currentSpeed = (uploadedBytes * 8 / 1000000) / elapsedSec;
                  setLiveSpeed(currentSpeed);
                  setProgress(0.5 + Math.min((elapsedSec / 8), 1) * 0.4);
                  
                  // Add chart data point (offsetting time to start after download)
                  const totalTime = (8 + elapsedSec).toFixed(1);
                  newChartData.push({ time: totalTime, download: null, upload: currentSpeed });
                  setChartData([...newChartData]);
                }
                upLastUpdate = now;
              }
              
              if (elapsedSec > 8) xhr.abort();
            }
          };
          
          xhr.onload = () => resolve();
          xhr.onerror = () => resolve();
          xhr.onabort = () => resolve();
          
          xhr.open('POST', '/api/speedtest/upload', true);
          xhr.send(blob);
        }));
      }

      await Promise.all(upPromises);

      const upElapsedSec = Math.max((performance.now() - upStart) / 1000, 0.1);
      finalUpload = (uploadedBytes * 8 / 1000000) / Math.min(upElapsedSec, 8);

      // 4. COMPLETE
      setProgress(1.0);
      setPhase('complete');
      
      const cleanDownload = isFinite(finalDownload) ? parseFloat(finalDownload.toFixed(2)) : 0;
      const cleanUpload = isFinite(finalUpload) ? parseFloat(finalUpload.toFixed(2)) : 0;
      const cleanPing = isFinite(finalPing) ? parseFloat(finalPing.toFixed(1)) : 0;
      const cleanJitter = isFinite(finalJitter) ? parseFloat(finalJitter.toFixed(1)) : 0;
      
      setLiveSpeed(cleanDownload);

      const newResult = {
        download: cleanDownload,
        upload: cleanUpload,
        ping: cleanPing,
        jitter: cleanJitter,
        timestamp: new Date().toISOString()
      };
      
      setResults(newResult);
      setHistory(saveHistory(newResult));

    } catch (err) {
      if (err.name !== 'AbortError' && err.message !== 'Aborted') {
        setError(err.message || 'Network error occurred');
        setPhase('error');
      }
    }
  }, [phase]);

  const cancelTest = useCallback(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    xhrRefs.current.forEach(xhr => xhr.abort());
    setPhase('idle');
    setProgress(0);
    setLiveSpeed(0);
    setChartData([]);
  }, []);

  const handleClearHistory = useCallback(() => {
    localStorage.removeItem(HISTORY_KEY);
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
    chartData,
    runTest,
    cancelTest,
    isTesting: ['finding_server', 'downloading', 'uploading'].includes(phase),
    clearHistory: handleClearHistory
  };
}
