import { motion } from 'framer-motion';

export default function GoButton({ onClick, disabled, isTesting }) {
  return (
    <div className="go-button-wrapper">
      <motion.button
        className={`go-button ${isTesting ? 'testing' : ''}`}
        onClick={onClick}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.08 } : {}}
        whileTap={!disabled ? { scale: 0.96 } : {}}
        id="go-button"
      >
        {isTesting ? '...' : 'GO'}
      </motion.button>
    </div>
  );
}
