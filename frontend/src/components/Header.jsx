import { motion } from 'framer-motion';

export default function Header() {
  return (
    <header className="header">
      <motion.div 
        className="header-logo"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="header-logo-icon" aria-hidden="true">
          <motion.span
            animate={{ 
              textShadow: ["0 0 10px rgba(0,242,255,0.5)", "0 0 20px rgba(0,242,255,0.8)", "0 0 10px rgba(0,242,255,0.5)"]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🌐
          </motion.span>
        </div>
        <h1>INTERNET SPEED</h1>
      </motion.div>
      <motion.p 
        className="header-subtitle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        ADVANCED NETWORK DIAGNOSTICS & THROUGHPUT ANALYSIS
      </motion.p>
    </header>
  );
}
