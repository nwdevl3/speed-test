import React from 'react';

const Footer = ({ onOpenLegal }) => {
  return (
    <footer className="app-footer">
      <div className="footer-links">
        <button onClick={() => onOpenLegal('faq')}>FAQ</button>
        <button onClick={() => onOpenLegal('about')}>About Us</button>
        <button onClick={() => onOpenLegal('privacy')}>Privacy Policy</button>
        <button onClick={() => onOpenLegal('terms')}>Terms of Service</button>
      </div>
      <p className="copyright">
        &copy; {new Date().getFullYear()} InternetSpeed.store. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
