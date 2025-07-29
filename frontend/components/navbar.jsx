"use client";
import React, { useState, useEffect } from "react";
import "@styles/navbar.scss";

const NavbarComponent = ({ isSticky = false }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      if (cookie.includes("Authorization_YearBook")) {
        setAuthenticated(true);
        break;
      }
    }
  }, []);

  const handleLogout = () => {
    document.cookie = "Authorization_YearBook=; max-age=0; path=/;";
    setAuthenticated(false);
    window.location.href = "/";
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/event', label: 'Events' },
    { href: '/team', label: 'Team' },
    { href: '/yearbooks', label: 'Yearbooks' },
    { href: '/alumni', label: 'Alumni' },
    { href: '/connect', label: 'Connect' }
  ];

  return (
    <nav className={`header-nav ${isSticky ? "sticky" : ""}`}>
      <div className="navbar-container">
        <a href="/" className="navbar-brand">
          <img
            src="/assets/images/collegeLogo.png"
            alt="Logo"
            className="logo"
          />
        </a>

        <button
          className="navbar-toggler"
          onClick={toggleMenu}
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>

        <div className={`navbar-collapse ${isMenuOpen ? 'show' : ''}`}>
          <div className="navbar-nav">
            {navItems.map((item, idx) => (
              <a
                key={item.href}
                href={item.href}
                className="nav-link"
                target={item.label === 'Alumni' ? '_blank' : undefined}
                rel={item.label === 'Alumni' ? 'noopener noreferrer' : undefined}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="navbar-auth">
          {authenticated ? (
            <button
              onClick={handleLogout}
              className="logout-btn"
            >
              Logout
            </button>
          ) : (
            <a
              href="/api/login"
              className="login-link"
            >
              Login
            </a>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavbarComponent;