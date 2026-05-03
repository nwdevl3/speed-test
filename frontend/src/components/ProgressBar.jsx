export default function ProgressBar({ progress, phase, visible }) {
  if (!visible) return null;

  const phaseLabels = {
    finding_server: 'Finding server…',
    downloading: 'Testing download…',
    uploading: 'Testing upload…',
    complete: 'Completed',
  };

  const phaseIndex = {
    finding_server: 1,
    downloading: 2,
    uploading: 3,
    complete: 4,
  };

  const currentStep = phaseIndex[phase] || 0;

  return (
    <div className="progress-section">
      <p className={`status-text ${phase !== 'idle' ? 'active' : ''}`}>
        {phaseLabels[phase] || 'Click GO to start'}
      </p>

      <div className="phase-dots">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`phase-dot ${step < currentStep ? 'done' : ''} ${step === currentStep ? 'active' : ''}`}
          />
        ))}
      </div>

      <div className="progress-bar-wrapper">
        <div className="progress-bar-header">
          <span>{phaseLabels[phase] || 'Preparing test…'}</span>
          <span>{Math.round(progress * 100)}%</span>
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${Math.min(progress * 100, 100).toFixed(1)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
