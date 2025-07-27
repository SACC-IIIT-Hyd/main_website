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
    {
      href: authenticated ? '/yearbooks' : '/api/login',
      label: 'Yearbooks'
    }
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
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="nav-link"
              >
                {item.label}
              </a>
            ))}
            {authenticated && (
              <button
                onClick={handleLogout}
                className="logout-btn mobile-logout"
              >
                Logout
              </button>
            )}
            {!authenticated && (
              <a
                href="/api/login"
                className="login-link mobile-login"
              >
                Login
              </a>
            )}
          </div>
        </div>

        <div className="navbar-auth">
          {authenticated ? (
            <button
              onClick={handleLogout}
              className="logout-btn desktop-logout"
            >
              Logout
            </button>
          ) : (
            <a
              href="/api/login"
              className="login-link desktop-login"
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