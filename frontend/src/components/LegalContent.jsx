import React from 'react';
import { motion } from 'framer-motion';

const LegalContent = ({ type, onClose }) => {
  const content = {
    about: {
      title: 'About Us',
      body: (
        <>
          <p>InternetSpeed.store is a modern, high-precision tool designed to provide users with accurate metrics of their network performance. Built with the latest web technologies, our goal is to offer a seamless and beautiful experience for testing download speed, upload speed, and latency.</p>
          <p>We use globally distributed test servers to ensure that your results are representative of your actual connection quality, regardless of where you are located.</p>
        </>
      )
    },
    privacy: {
      title: 'Privacy Policy',
      body: (
        <>
          <p>Your privacy is important to us. InternetSpeed.store does not collect personal identification information from its users.</p>
          <h3>Data Collection</h3>
          <p>We may collect non-personal information such as your IP address, ISP, and location to provide accurate speed test results and for analytical purposes to improve our service.</p>
          <h3>Cookies</h3>
          <p>We may use cookies to store your preferences (such as theme choice) and for third-party services like Google AdSense to serve relevant ads.</p>
          <h3>Third Party Services</h3>
          <p>This site may use third-party services like Google Analytics and Google AdSense. These services may collect information as described in their respective privacy policies.</p>
        </>
      )
    },
    terms: {
      title: 'Terms of Service',
      body: (
        <>
          <p>By using InternetSpeed.store, you agree to the following terms:</p>
          <ul>
            <li>The service is provided "as is" without any warranties.</li>
            <li>We are not responsible for any inaccuracies in the test results.</li>
            <li>You may not use this service for any automated or malicious purposes.</li>
          </ul>
        </>
      )
    }
  };

  const selected = content[type] || content.about;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="legal-modal-overlay"
      onClick={onClose}
    >
      <div className="legal-modal-content" onClick={e => e.stopPropagation()}>
        <div className="legal-modal-header">
          <h2>{selected.title}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="legal-modal-body">
          {selected.body}
        </div>
      </div>
    </motion.div>
  );
};

export default LegalContent;
