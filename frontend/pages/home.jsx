import React, { useState, useEffect } from 'react';
import NavbarComponent from '@components/navbar';

import '@styles/home.scss';

const Home = () => {
  const [isSticky, setIsSticky] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const changeBackground = () => {
    if (window.scrollY < 100) {
      setIsSticky(false);
    } else {
      setIsSticky(true);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", changeBackground);
    return () => {-
      window.removeEventListener("scroll", changeBackground);
    };
  }, []);

  useEffect(() => {
    console.log("isSticky:", isSticky);
  }, [isSticky]);

  useEffect(() => {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      if (cookie.includes("Authorization_YearBook")) {
        setAuthenticated(true);
      }
    }
  }, []);

  return (
    <section>
      <NavbarComponent isSticky={isSticky} />
      <section id="main">
        <section className="showcase">
          <div className="video-container">
            <video
              src="./assets/Yearbook_portal_full.mp4"
              autoPlay
              muted
              loop
              playsInline
            ></video>
            <div className="content">
              <h1>SACC</h1>
              <p>Presents</p>
              <h3>Yearbook of 2021</h3>
              <a
                href={authenticated ? "/yearbooks" : "/api/login"}
                className="btn"
              >
                Access Here
              </a>
            </div>
          </div>
        </section>
      </section>
      <div className="bottom-circle"></div>
      <div className="footer-content">
        <div className="social-links">
          <a href="https://www.facebook.com/iiith.alumnicell" target="_blank" rel="noopener noreferrer">
            <img src="/assets/images/fb.png" alt="Facebook" />
          </a>
          <a href="https://www.instagram.com/alumnicell_iiith/" target="_blank" rel="noopener noreferrer">
            <img src="/assets/images/insta.png" alt="Instagram" />
          </a>
          <a href="https://www.linkedin.com/company/alumni-cell-iiit-h/" target="_blank" rel="noopener noreferrer">
            <img src="/assets/images/linkedin.png" alt="LinkedIn" />
          </a>
        </div>
        <p>&copy; Student Alumni Connect Cell 2025</p>
      </div>
    </section>
  );
};

export default Home;