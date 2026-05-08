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
    },
    faq: {
      title: 'Frequently Asked Questions',
      body: (
        <div className="faq-container">
          <div className="faq-item">
            <h3>What is a good internet speed?</h3>
            <p>For most households, 25 Mbps is sufficient for basic streaming and browsing. However, for 4K streaming and online gaming, 100 Mbps or higher is recommended.</p>
          </div>
          <div className="faq-item">
            <h3>What does "Ping" mean?</h3>
            <p>Ping (or Latency) measures how fast a small packet of data travels from your device to the server and back. Lower is better, especially for gaming and video calls.</p>
          </div>
          <div className="faq-item">
            <h3>What is Jitter?</h3>
            <p>Jitter is the variation in your ping over time. High jitter can cause "stuttering" in video calls or online games.</p>
          </div>
          <div className="faq-item">
            <h3>Why is my speed lower than my plan?</h3>
            <p>Several factors can affect speed: your router's distance, background apps, the number of connected devices, and whether you are using Wi-Fi instead of an Ethernet cable.</p>
          </div>
          <div className="faq-item">
            <h3>How can I improve my speed?</h3>
            <p>Try restarting your router, moving closer to the Wi-Fi access point, or using a wired Ethernet connection for the best possible results.</p>
          </div>
        </div>
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
