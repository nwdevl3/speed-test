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

  const abortControllerRef = useRef(null);
  const xhrRefs = useRef([]);

  const runTest = useCallback(async () => {
    if (phase !== 'idle' && phase !== 'complete' && phase !== 'error') return;

    setPhase('finding_server');
    setProgress(0);
    setResults(null);
    setError(null);
    setLiveSpeed(0);
    setServer({ name: 'Cloudflare Edge', location: 'Global' });

    abortControllerRef.current = new AbortController();
    xhrRefs.current = [];
    
    let finalDownload = 0;
    let finalUpload = 0;
    let finalPing = 0;

    try {
      // 1. PING TEST
      const pingStart = performance.now();
      await fetch('/api/network-info', { cache: 'no-cache', signal: abortControllerRef.current.signal });
      finalPing = performance.now() - pingStart;

      setProgress(0.1);
      
      // 2. DOWNLOAD TEST (Parallel connections to saturate bandwidth)
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
              if (now - lastUpdate > 100) {
                const elapsedSec = (now - dlStart) / 1000;
                if (elapsedSec > 0.1) {
                  const currentSpeed = (loadedBytes * 8 / 1000000) / elapsedSec;
                  setLiveSpeed(currentSpeed);
                  setProgress(0.1 + Math.min((elapsedSec / 8), 1) * 0.4); // max 8 sec
                }
                lastUpdate = now;
              }
              
              // End early if it takes more than 8 seconds to save bandwidth
              if ((now - dlStart) > 8000) break;
            }
          } catch (e) {
            // Ignore aborts
          }
        })());
      }
      
      // Wait for all downloads to finish or timeout
      await Promise.all(dlPromises);
      
      const dlElapsedSec = Math.max((performance.now() - dlStart) / 1000, 0.1);
      finalDownload = (loadedBytes * 8 / 1000000) / dlElapsedSec;
      setLiveSpeed(finalDownload);
      setProgress(0.5);

      // 3. UPLOAD TEST (Parallel connections)
      setPhase('uploading');
      setLiveSpeed(0);
      
      const upStart = performance.now();
      const uploadBytesPerConn = 5242880; // 5MB per connection
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
              if (now - upLastUpdate > 100) {
                const elapsedSec = (now - upStart) / 1000;
                if (elapsedSec > 0.1) {
                  const currentSpeed = (uploadedBytes * 8 / 1000000) / elapsedSec;
                  setLiveSpeed(currentSpeed);
                  setProgress(0.5 + Math.min((elapsedSec / 8), 1) * 0.4);
                }
                upLastUpdate = now;
              }
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
      finalUpload = (uploadedBytes * 8 / 1000000) / upElapsedSec;

      // 4. COMPLETE
      setProgress(1.0);
      setPhase('complete');
      
      const cleanDownload = isFinite(finalDownload) ? parseFloat(finalDownload.toFixed(2)) : 0;
      const cleanUpload = isFinite(finalUpload) ? parseFloat(finalUpload.toFixed(2)) : 0;
      const cleanPing = isFinite(finalPing) ? parseFloat(finalPing.toFixed(1)) : 0;
      
      setLiveSpeed(cleanDownload); // Show download on final dial

      const newResult = {
        download: cleanDownload,
        upload: cleanUpload,
        ping: cleanPing,
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
  }, []);

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
    cancelTest,
    isTesting: ['finding_server', 'downloading', 'uploading'].includes(phase),
    clearHistory: handleClearHistory
  };
}
