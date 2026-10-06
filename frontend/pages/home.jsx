import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import NavbarComponent from '@components/navbar';

const Home = () => {
  const [isSticky, setIsSticky] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsSticky(window.scrollY >= 100);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      if (cookie.includes("Authorization_YearBook")) {
        setAuthenticated(true);
        break;
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
              preload="metadata"
            ></video>
            <div className="content">
              <h1>SACC</h1>
              <p>Presents</p>
              <h3>Yearbook of 2022</h3>
              <Link
                href={authenticated ? "/yearbook?year=2k22" : "/api/login"}
                className="btn"
              >
                Access Here
              </Link>
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
        <p>&copy; Student Alumni Connect Cell 2026</p>
      </div>
    </section>
  );
};

export default Home;