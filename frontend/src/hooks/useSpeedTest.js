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
  const xhrRef = useRef(null);

  const runTest = useCallback(async () => {
    if (phase !== 'idle' && phase !== 'complete' && phase !== 'error') return;

    setPhase('finding_server');
    setProgress(0);
    setResults(null);
    setError(null);
    setLiveSpeed(0);
    setServer({ name: 'Cloudflare / Render', location: 'Global' });

    abortControllerRef.current = new AbortController();
    
    let finalDownload = 0;
    let finalUpload = 0;
    let finalPing = 0;

    try {
      // 1. PING TEST
      const pingStart = performance.now();
      await fetch('/api/network-info', { cache: 'no-cache', signal: abortControllerRef.current.signal });
      finalPing = performance.now() - pingStart;

      setProgress(0.1);
      
      // 2. DOWNLOAD TEST
      setPhase('downloading');
      const dlStart = performance.now();
      let loadedBytes = 0;
      
      // Fetch 25MB of random data from Cloudflare's edge network for realistic CDNs speeds
      const dlResponse = await fetch('https://speed.cloudflare.com/__down?bytes=26214400', {
        cache: 'no-cache',
        signal: abortControllerRef.current.signal
      });
      
      const reader = dlResponse.body.getReader();
      let isDone = false;
      let lastUpdate = performance.now();
      
      while (!isDone) {
        const { value, done } = await reader.read();
        isDone = done;
        if (value) loadedBytes += value.length;
        
        const now = performance.now();
        if (now - lastUpdate > 100) {
          const elapsedSec = (now - dlStart) / 1000;
          if (elapsedSec > 0) {
            const currentSpeed = (loadedBytes * 8 / 1000000) / elapsedSec;
            setLiveSpeed(currentSpeed);
            setProgress(0.1 + (loadedBytes / 26214400) * 0.4);
          }
          lastUpdate = now;
        }
      }
      
      const dlElapsedSec = (performance.now() - dlStart) / 1000;
      finalDownload = (loadedBytes * 8 / 1000000) / dlElapsedSec;
      setLiveSpeed(finalDownload);
      setProgress(0.5);

      // 3. UPLOAD TEST
      setPhase('uploading');
      setLiveSpeed(0);
      
      const uploadBytes = 10485760; // 10MB
      const dummyData = new Uint8Array(uploadBytes);
      const blob = new Blob([dummyData], { type: 'application/octet-stream' });
      
      finalUpload = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        const upStart = performance.now();
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const now = performance.now();
            const elapsedSec = (now - upStart) / 1000;
            if (elapsedSec > 0.1) {
              const currentSpeed = (e.loaded * 8 / 1000000) / Math.max(elapsedSec, 0.1);
              setLiveSpeed(currentSpeed);
              setProgress(0.5 + (e.loaded / uploadBytes) * 0.4);
            }
          }
        };
        
        xhr.onload = () => {
          const upElapsedSec = (performance.now() - upStart) / 1000;
          resolve((uploadBytes * 8 / 1000000) / upElapsedSec);
        };
        
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.onabort = () => reject(new Error('Aborted'));
        
        xhr.open('POST', 'https://speed.cloudflare.com/__up', true);
        xhr.send(blob);
      });

      // 4. COMPLETE
      setProgress(1.0);
      setPhase('complete');
      setLiveSpeed(finalDownload); // Show download on final dial

      const newResult = {
        download: finalDownload.toFixed(2),
        upload: finalUpload.toFixed(2),
        ping: finalPing.toFixed(1),
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
    if (xhrRef.current) xhrRef.current.abort();
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
