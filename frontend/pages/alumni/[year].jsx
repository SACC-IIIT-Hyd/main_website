import NavbarComponent from "../../components/navbar";
import AuthGuard from "../../components/AuthGuard";
import { Box, Grid, CircularProgress, useMediaQuery, useTheme } from "@mui/material";
import Bottom from "@components/footer";
import Link from "next/link";
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { getAlumniYears, getAlumniData, hasYearImagesDirectory } from "../../lib/alumni";

// Get all years at build time to determine which pages to generate
export async function getStaticPaths() {
    const years = getAlumniYears();

    const paths = years.map(year => ({
        params: { year }
    }));

    return {
        paths,
        fallback: 'blocking' // Generate new pages if new JSON files are added
    };
}

// Get the data for the specific year at build time
export async function getStaticProps({ params }) {
    const { year } = params;
    const alumniData = getAlumniData(year);
    const hasImagesDir = hasYearImagesDirectory(year);

    // If no data found for this year, return 404
    if (!alumniData) {
        return {
            notFound: true
        };
    }

    return {
        props: {
            year,
            alumniData,
            hasImagesDir
        },
        // Revalidate every hour to pick up changes
        revalidate: 3600
    };
}

export default function BatchPage({ year, alumniData, hasImagesDir }) {
    const theme = useTheme();
    const isXs = useMediaQuery(theme.breakpoints.down("sm"));
    const [search, setSearch] = useState("");
    const [visibleCount, setVisibleCount] = useState(24);

    // Shuffle alumni only on client to avoid hydration mismatch
    const [shuffledAlumni, setShuffledAlumni] = useState(alumniData);
    useEffect(() => {
        const arr = [...alumniData];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        setShuffledAlumni(arr);
    }, [alumniData]);

    // Filter alumni by search
    const filteredAlumni = useMemo(() => {
        if (!search) return shuffledAlumni;
        return shuffledAlumni.filter(user =>
            user.name?.toLowerCase().includes(search.toLowerCase()) ||
            user.branch?.toLowerCase().includes(search.toLowerCase()) ||
            user.email?.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, shuffledAlumni]);

    // Reset visible count when search query changes
    useEffect(() => {
        setVisibleCount(24);
    }, [search]);

    const observerRef = useRef(null);
    const filteredAlumniRef = useRef(filteredAlumni);
    filteredAlumniRef.current = filteredAlumni;

    // Callback ref attaches observer immediately when sentinel mounts in the DOM
    const sentinelCallback = useCallback((node) => {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }
        if (!node) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    setVisibleCount((prev) => {
                        const max = filteredAlumniRef.current.length;
                        return prev < max ? Math.min(prev + 24, max) : prev;
                    });
                }
            },
            { rootMargin: "600px" }
        );
        observerRef.current.observe(node);
    }, []);

    // Window scroll fallback to ensure continuous loading across all viewport conditions
    useEffect(() => {
        const handleScroll = () => {
            const scrollBottom = window.innerHeight + window.scrollY;
            const threshold = document.documentElement.scrollHeight - 800;
            if (scrollBottom >= threshold) {
                setVisibleCount((prev) => {
                    const max = filteredAlumniRef.current.length;
                    return prev < max ? Math.min(prev + 24, max) : prev;
                });
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const visibleAlumni = useMemo(() => {
        return filteredAlumni.slice(0, visibleCount);
    }, [filteredAlumni, visibleCount]);

    return (
        <AuthGuard>
            <section style={{ background: '#18101A', minHeight: '100vh', color: 'white', paddingTop: isXs ? 60 : 72 }}>
                <NavbarComponent isSticky={true} />
                <Box className="backdrop" >
                    <div className="yearbook-container" style={{ paddingBottom: 8 }}>
                        <div className="text-content" style={{ marginTop: isXs ? -10 : -45 }}>
                            <h1 className="title">Batch of {year}</h1>
                            <p className="subtitle">Meet the {year} Alumni!</p>
                        </div>
                    </div>
                    {/* Search Bar */}
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 32px 0' }}>
                        <input
                            type="text"
                            placeholder="Search by name, branch, or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                padding: '18px 22px',
                                borderRadius: 12,
                                border: '1.5px solid #2a1533',
                                fontSize: 18,
                                width: isXs ? '90%' : 420,
                                outline: 'none',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                background: '#1f121A',
                                color: '#e0d7f7',
                                marginBottom: isXs ? 18 : 24,
                            }}
                        />
                    </div>
                    {/* Flexbox alumni grid */}
                    <div
                        className="yearbooksFlexGrid"
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            alignItems: 'stretch',
                            gap: isXs ? 18 : 24 ,
                            maxWidth: 1600,
                            margin: '0 auto',
                            width: '100%'
                        }}
                    >
                        {visibleAlumni.map((user, index) => (
                            <div
                                key={user.email || `user-${index}`}
                                style={{
                                    flex: `1 1 ${isXs ? '100%' : '260px'}`,
                                    maxWidth: 340,
                                    minWidth: isXs ? '90%' : 260,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'stretch',
                                    marginBottom: isXs ? 18 : 24
                                }}
                            >
                                <Link
                                    href={`/alumni/${year}/${user.email ? user.email.split('@')[0] : `user-${index}`}`}
                                    style={{
                                        textDecoration: 'none',
                                        width: '100%',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        color: 'inherit'
                                    }}
                                >
                                    <div className="alumniCard" style={{
                                        cursor: 'pointer',
                                        width: '100%',
                                        maxWidth: 340,
                                        maxHeight: 380,
                                        background: '#1f121A',
                                        borderRadius: 18,
                                        boxShadow: '0 4px 24px rgba(60,0,80,0.18)',
                                        padding: 28,
                                        margin: '0 auto',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        transition: 'all 0.3s ease',
                                        border: '1.5px solid #2a1533',
                                        color: '#e0d7f7'
                                    }}>
                                        <div style={{
                                            width: 140,
                                            height: 140,
                                            background: '#2a1533',
                                            borderRadius: '50%',
                                            overflow: 'hidden',
                                            marginBottom: 18,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 2px 12px rgba(0,0,0,0.10)'
                                        }}>
                                            {user.pfp ? (
                                                <img
                                                    src={user.pfp.startsWith('/') ? user.pfp : hasImagesDir ? `/assets/images/${year}/${user.pfp.replace('images/', '')}` : `/assets/images/${user.pfp}`}
                                                    alt={user.name}
                                                    loading="lazy"
                                                    decoding="async"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div style={{ fontSize: 60, color: '#e0d7f7' }}>
                                                    {user.name?.charAt(0) || '?'}
                                                </div>
                                            )}
                                        </div>
                                        <h3 style={{ margin: 0, color: '#e0d7f7', fontWeight: 700, fontSize: 22, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                                            {user.name}
                                        </h3>
                                        {user.branch && <p style={{ margin: '4px 0 0 0', color: '#bba6d6', fontSize: 16, textAlign: 'center' }}>{user.branch}</p>}
                                    </div>
                                </Link>
                            </div>
                        ))}
                        {visibleCount < filteredAlumni.length && (
                            <div
                                ref={sentinelCallback}
                                onClick={() => {
                                    setVisibleCount((prev) => Math.min(prev + 24, filteredAlumni.length));
                                }}
                                style={{
                                    width: '100%',
                                    padding: '36px 0',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                }}
                            >
                                <CircularProgress size={30} thickness={4} sx={{ color: '#d8b4e2' }} />
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ color: '#e0d7f7', fontSize: '15px', fontWeight: 600 }}>
                                        Loading more alumni...
                                    </span>
                                    <p style={{ margin: '4px 0 0 0', color: '#bba6d6', fontSize: '13px' }}>
                                        Showing {visibleAlumni.length} of {filteredAlumni.length} alumni (click to load more)
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </Box>
                <Bottom />
            </section>
        </AuthGuard>
    );
}
