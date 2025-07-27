import React, { useState, useEffect } from 'react';
import NavbarComponent from '../components/navbar';
import Bottom from '@components/footer';
import { Box, Typography, CssBaseline } from '@mui/material';
import '@styles/about.scss';
import GradualSpacing from '@lib/events_page/gradualSpacing';
import { motion } from 'framer-motion';
import Image from 'next/image';

// The title and underline 
const AboutTitle = ({ isMobile, onComplete }) => {
  const [underlineComplete, setUnderlineComplete] = useState(false);

  useEffect(() => {
    if (underlineComplete) {
      onComplete();
    }
  }, [underlineComplete, onComplete]);

  return (
    <div className="aboutTitle">
      {/* Title with Wavy Text */}
      <div className="title-and-full-stop">
        <GradualSpacing text="About" containerClassName='title-container' className='title-letters' onCompletion={() => setUnderlineVisible(true)} />
      </div>
      {/* Underline Animation */}
      <motion.div
        className="underline"
        initial={{ width: 0 }}
        animate={{ width: "10%" }}
        transition={{
          duration: 0.69,
          ease: "easeInOut",
        }}
        onAnimationComplete={() => setUnderlineComplete(true)}
      />
    </div>
  );
};

export default function AboutSACC() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [titleAnimationComplete, setTitleAnimationComplete] = useState(false);
  return (
    <>
      <CssBaseline />
      <NavbarComponent isSticky={true} />
      <Box className="about-container">
        <motion.div
          className="vertical-line"
          initial={{ height: 0 }}
          animate={{ height: '100%' }}
          transition={{ duration: 1 }}
        />
        <div className="about-content-cover">
          <AboutTitle isMobile={isMobile} onComplete={() => setTitleAnimationComplete(true)} />
          <motion.div
            className="logo-container"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            whileHover={{ scale: 1.2 }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'mirror',
              }}
            >
              <Image
                src="/assets/images/SACC_logo.png"
                alt="SACC Logo"
                width={250}
                height={250}
              />
            </motion.div>
          </motion.div>
          <motion.div
            className="background-image"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ duration: 1.5 }}
            style={{
              backgroundImage: 'url("/assets/images/x.jpg")',
            }}
          />
          <motion.div
            className="description-container"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <Typography
              variant="h6"
              component="p"
              className="aboutContent"
            >
              The Student Alumni Connect Cell (SACC) is the link that keeps IIIT H's student community
              and its alumni network closely connected. At its heart, SACC is all about building meaningful
              relationships and harnessing the power of shared experiences.It does this by organizing a
              wide range of activities, from insightful talks and candid discussions with alumni to creating
              yearbooks and blogs that capture the true spirit of campus life.
              <br></br>
              <br></br>
              SACC's mission is simple: to bridge the gap between students and alumni and provide a
              platform to seek guidance, explore opportunities, and connect with those who've walked the
              same path. Whether it's through career-focused events, nostalgic reflections, or casual chai
              sessions, SACC works to ensure that the bonds formed at IIIT last a lifetime. By bringing
              alumni and students together, SACC transforms connections into opportunities and
              memories into legacies..
            </Typography>
          </motion.div>
        </div>
      </Box>
      <Bottom />
    </>
  );
}