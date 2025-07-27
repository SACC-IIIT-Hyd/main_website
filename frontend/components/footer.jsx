import React from 'react';
import '@styles/footer.scss';
import { colors } from '@mui/material';

const Bottom = () => {
  return (
    <section>
      <div id='sacc'>
        <div className='footerContent'>
          <div className="about">
            <img src="/assets/images/saccLogo.png" alt="SACC Logo" className="aboutLogo" />
            <p className='aboutText'>
              <b>The Student Alumni Connect Cell</b>
              <br></br>
              of International Institute of
              <br></br>
              Information Technology, Hyderabad
            </p>
          </div>

          <div className="reach">
            <p className='reachHeading'>
              Reach Us
            </p>
            <p className='reachText'>
              SACC, IIIT Hyderabad
              <br></br>
              Gachibowli, Hyderabad
              <br></br>
              <a href="mailto: sacc@iiit.ac.in" style={{ "color": "white" }}>
                sacc@iiit.ac.in
              </a>
            </p>
          </div>
        </div>

        {/* Social Links */}
        <h2>Follow Us On Social Media</h2>
        <div className="social">
          <a href="https://www.instagram.com/alumnicell_iiith/" target="_blank">
            <img src="/assets/images/insta.png" alt="Instagram" className="social-icon" />
          </a>
          <a href="https://www.facebook.com/iiith.alumnicell" target="_blank">
            <img src="/assets/images/fb.png" alt="Facebook" className="social-icon" />
          </a>
          <a href="https://www.linkedin.com/company/alumni-cell-iiit-h/" target="_blank">
            <img src="/assets/images/linkedin.png" alt="LinkedIn" className="social-icon" />
          </a>
        </div>
      </div>

      {/* Copyright */}
      <div className="copyright">
        <p className='copyText'>
          © 2025 Student Alumni Connect Cell, IIIT Hyderabad
        </p>
      </div>
    </section>
  );
}

export default Bottom;