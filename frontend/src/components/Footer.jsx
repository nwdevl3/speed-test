import React from 'react';

const Footer = ({ onOpenLegal }) => {
  return (
    <footer className="app-footer">
      <div className="footer-links">
        <a href="#faq" onClick={(e) => { e.preventDefault(); onOpenLegal('faq'); }}>FAQ</a>
        <a href="#about" onClick={(e) => { e.preventDefault(); onOpenLegal('about'); }}>About Us</a>
        <a href="#privacy" onClick={(e) => { e.preventDefault(); onOpenLegal('privacy'); }}>Privacy Policy</a>
        <a href="#terms" onClick={(e) => { e.preventDefault(); onOpenLegal('terms'); }}>Terms of Service</a>
      </div>
      <p className="copyright">
        &copy; {new Date().getFullYear()} InternetSpeed.store. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
