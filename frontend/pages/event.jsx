import '@styles/events.scss';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Bottom from '@components/footer';
import Typewriter from '@lib/events_page/TypeWriter';
import GradualSpacing from '@lib/events_page/gradualSpacing';
import NavbarComponent from '@components/navbar';
import { motion } from 'framer-motion';
import { Box, CssBaseline, Container } from '@mui/material';
import Head from 'next/head';

const eventsData = [
    {
        id: 1,
        name: 'Opportunities Awareness Talk',
        image: '/assets/images/events/oat.jpg',
        description: "The Opportunity Awareness Talks (OAT) aims to introduce IIIT students to diverse career paths beyond the institute's core focus on Computer Science and Electronics. Featuring distinguished alumni from various fields, each session delves into niche topics, offering insights on breaking into and excelling in those domains. Through engaging discussions and direct interaction with speakers, OAT helps students explore potential career paths and stay informed about industry trends."
    },
    {
        id: 2,
        name: 'Chai pe Charcha',
        image: '/assets/images/events/cpc.jpg',
        description: 'Chai Pe Charcha is a candid and engaging platform, bringing the IIIT family together for meaningful discussions over a cup of tea. Alumni from diverse backgrounds share their journeys, expertise and insights, covering topics from career guidance and industry trends to personal anecdotes and mentorship. Featuring interactive sessions, it fosters connections, encourages open dialogue and helps students navigate college challenges while preparing for life beyond.'
    },
    {
        id: 3,
        name: 'Alumni Unfiltered',
        image: '/assets/images/events/au.jpg',
        description: 'Alumni Unfiltered is a casual and dynamic talk session held during induction week, where freshers connect with alumni to seek guidance and hear stories from their college days and life experiences. This engaging platform allows open discussions on topics ranging from academics to college life, humorously addressing common rookie mistakes, emphasizing time management, and providing clarity on misconceptions. The session offers freshers valuable insights and a glimpse into the journey ahead, fostering a meaningful connection with the alumni.'
    },
    {
        id: 4,
        name: 'Yearbook & Farewell',
        image: '/assets/images/events/yb.jpg',
        description: "SACC is involved in the farewell ceremony for the graduating batch, where they receive their yearbooks and other mementos. The Yearbook is a cherished keepsake for each graduating batch, capturing their unique journey through testimonials, inside jokes, comments, fun captions, and pictures. From the excitement of orientation to the milestone of graduation, the Yearbook allows students to relive their college days, celebrating unforgettable moments and lifelong bonds formed at IIIT."
    },
    {
        id: 5,
        name: 'Convocation',
        image: '/assets/images/events/conv.jpg',
        description: "The Convocation ceremony is a grand event that marks the culmination of the academic journey for students at IIIT Hyderabad. SACC plays a crucial role in organizing the event, ensuring a seamless and memorable experience for the graduating batch. From managing logistics and coordinating with the administration to planning the ceremony and overseeing the proceedings, SACC ensures that the Convocation is a fitting tribute to the hard work and dedication of the students."
    },
    {
        id: 6,
        name: 'College Karawan',
        image: '/assets/images/events/kw.jpg',
        description: 'College Karwaan is an online compendium, curated by the SACC, that celebrates the journey of students at IIIT Hyderabad. Narrated by graduating students, these articles capture the highs, lows and defining moments of college life—from the nervous excitement of the first year to the challenges of final-year placements. Serving as a repository of priceless memories, College Karwaan preserves the legacy of those who have walked through the hallowed halls of IIIT Hyderabad.'
    },
    {
        id: 7,
        name: 'Vision Talks (proposal)',
        image: '/assets/images/events/vt.jpg',
        description: 'An annual event that coincides with the Foundation Day of the Institute, where prominent alumni from different fields are invited to deliver talks and share their insights and experiences with the students'
    }
];

function splitStringUsingRegex(inputString) {
    const characters = [];
    const regex = /[\s\S]/gu;

    let match;
    while ((match = regex.exec(inputString)) !== null) {
        characters.push(match[0]);
    }

    return characters;
}

const EventsTitle = ({ isMobile, onComplete }) => {
    const [underlineComplete, setUnderlineComplete] = useState(false);
    const [underlineVisible, setUnderlineVisible] = useState(false);

    useEffect(() => {
        if (underlineComplete) {
            onComplete();
        }
    }, [underlineComplete, onComplete]);

    return (
        <div className="events-title">
            <div className="title-and-full-stop">
                <GradualSpacing
                    text="Events"
                    containerClassName='title-container'
                    className='title-letters'
                    onCompletion={() => setUnderlineVisible(true)}
                />
            </div>
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

const EventsGrid = ({ isMobile, titleAnimationComplete }) => {
    const [activeEvent, setActiveEvent] = useState(null);
    const [cardHeights, setCardHeights] = useState({});
    const cardRefs = useRef({});
    const mutationObserversRef = useRef({});

    const updateCardHeight = useCallback((eventId) => {
        const largeCardRef = cardRefs.current[`large-${eventId}`];
        const smallCardRef = cardRefs.current[`small-${eventId}`];

        if (largeCardRef && smallCardRef) {
            // Use scrollHeight to account for content changes
            const largeCardHeight = largeCardRef.scrollHeight;

            // Set small card height to match large card
            smallCardRef.style.height = `${largeCardHeight}px`;

            // Update state to trigger re-render if needed
            setCardHeights(prev => ({
                ...prev,
                [eventId]: largeCardHeight
            }));
        }
    }, []);

    useEffect(() => {
        // Setup MutationObservers for each large card
        eventsData.forEach(event => {
            const largeCardRef = cardRefs.current[`large-${event.id}`];

            if (largeCardRef) {
                // Remove any existing observer
                if (mutationObserversRef.current[event.id]) {
                    mutationObserversRef.current[event.id].disconnect();
                }

                // Create new MutationObserver
                const observer = new MutationObserver(() => {
                    updateCardHeight(event.id);
                });

                // Configure observer to watch for changes in the entire subtree
                observer.observe(largeCardRef, {
                    childList: true,
                    subtree: true,
                    characterData: true
                });

                // Store reference to observer
                mutationObserversRef.current[event.id] = observer;
            }
        });

        // Initial height update
        if (titleAnimationComplete) {
            eventsData.forEach(event => updateCardHeight(event.id));
        }

        // Cleanup observers
        return () => {
            Object.values(mutationObserversRef.current).forEach(observer => observer.disconnect());
        };
    }, [titleAnimationComplete, updateCardHeight]);

    // Resize listener
    useEffect(() => {
        const handleResize = () => {
            eventsData.forEach(event => updateCardHeight(event.id));
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [updateCardHeight]);

    const toggleEventDetails = (id) => {
        setActiveEvent(activeEvent === id ? null : id);

        // Ensure height updates after toggle
        setTimeout(() => {
            updateCardHeight(id);
        }, 50);
    };

    // Animation Controls
    const LETTER_DELAY = 0.037;
    const staggerDelay = 0.002;

    const charRevealVariants = {
        hidden: { opacity: 0 },
        reveal: { opacity: 1 },
    };

    return (
        <Container maxWidth={false} className="event-grid">
            {titleAnimationComplete && eventsData.map((event) => (
                <motion.div
                    key={event.id}
                    className={`event-row ${isMobile ? 'mobile' : 'desktop'} ${event.id % 2 === 0 ? 'normal' : 'reversed'} e${event.id}`}
                    onClick={() => toggleEventDetails(event.id)}
                    initial={{ scaleX: 0, transformOrigin: event.id % 2 === 0 ? 'right' : 'left' }}
                    whileInView={{ scaleX: 1 }}
                    transition={{ duration: 0.1, ease: "easeInOut" }}
                    viewport={{ once: true }}
                    style={{
                        minHeight: activeEvent === event.id ? `${cardHeights[event.id] || 250}px` : '250px',
                        transition: 'min-height 0.5s ease-in-out'
                    }}
                >
                    <>
                        {/* LARGE DIV */}
                        <motion.Box
                            ref={el => cardRefs.current[`large-${event.id}`] = el}
                            className={`large-card ${activeEvent === event.id ? 'active' : ''} ${isMobile ? 'mobile' : 'desktop'}`}
                        >
                            {activeEvent === event.id ? (
                                <motion.div
                                    className="event-description"
                                    initial="hidden"
                                    whileInView="reveal"
                                    transition={{ staggerChildren: staggerDelay }}
                                    style={{ height: 'auto', minHeight: '100%' }}
                                >
                                    {isMobile ?
                                        <Typewriter text={event.name} delay={LETTER_DELAY} className='large-card-title' /> :
                                        null
                                    }
                                    {splitStringUsingRegex(event.description).map((char, i) => (
                                        <motion.span
                                            key={i}
                                            transition={{ duration: 0.5 }}
                                            variants={charRevealVariants}
                                            className={`large-card-text ${isMobile ? 'mobile' : 'desktop'}`}
                                        >
                                            {char}
                                        </motion.span>
                                    ))}
                                </motion.div>
                            ) : (
                                //Large div not active : Event Name
                                <h2 className="large-card-title">{event.name}</h2>
                            )}
                        </motion.Box>

                        {/* SMALL DIV */}
                        <motion.Box
                            ref={el => cardRefs.current[`small-${event.id}`] = el}
                            className={`small-card ${activeEvent === event.id ? 'active' : ''} ${isMobile ? 'mobile' : 'desktop'}`}
                            style={{
                                backgroundImage: `url(${event.image})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                position: 'relative',
                                height: activeEvent === event.id ? 'auto' : 'inherit'
                            }}
                        >
                            {/* Purple overlay when active */}
                            {activeEvent === event.id && (
                                <div className="image-overlay">
                                    <Typewriter text={event.name} delay={LETTER_DELAY} className='small-card-text' />
                                </div>
                            )}
                        </motion.Box>
                    </>
                </motion.div>
            ))}
        </Container>
    );
}

export default function Events() {
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
            <section>
                {/* Navbar */}
                <NavbarComponent isSticky={true} />

                <Box
                    /* Push content below navbar */
                    sx={{
                        backgroundColor: '#1D141A',
                        paddingTop: '10vh',
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'18\' viewBox=\'0 0 100 18\'%3E%3Cpath fill=\'%23b9a6b2\' fill-opacity=\'0.07\' d=\'M61.82 18c3.47-1.45 6.86-3.78 11.3-7.34C78 6.76 80.34 5.1 83.87 3.42 88.56 1.16 93.75 0 100 0v6.16C98.76 6.05 97.43 6 96 6c-9.59 0-14.23 2.23-23.13 9.34-1.28 1.03-2.39 1.9-3.4 2.66h-7.65zm-23.64 0H22.52c-1-.76-2.1-1.63-3.4-2.66C11.57 9.3 7.08 6.78 0 6.16V0c6.25 0 11.44 1.16 16.14 3.42 3.53 1.7 5.87 3.35 10.73 7.24 4.45 3.56 7.84 5.9 11.31 7.34zM61.82 0h7.66a39.57 39.57 0 0 1-7.34 4.58C57.44 6.84 52.25 8 46 8S34.56 6.84 29.86 4.58A39.57 39.57 0 0 1 22.52 0h15.66C41.65 1.44 45.21 2 50 2c4.8 0 8.35-.56 11.82-2z\'%3E%3C/path%3E%3C/svg%3E")'
                    }}
                >
                    {/* Page Content */}
                    <CssBaseline />
                    {/* Title */}
                    <EventsTitle isMobile={isMobile} onComplete={() => setTitleAnimationComplete(true)} />
                    <EventsGrid isMobile={isMobile} titleAnimationComplete={titleAnimationComplete} />
                </Box>

                {/* Footer */}
                <Bottom />
            </section>
        </>
    );
}