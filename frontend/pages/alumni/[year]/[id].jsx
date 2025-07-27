import { useRouter } from 'next/router';
import NavbarComponent from "../../../components/navbar";
import Bottom from "@components/footer";
import { Box } from "@mui/material";
import Link from "next/link";
import { useState, useEffect } from 'react';
import { getAlumniYears, getAlumniData, hasYearImagesDirectory } from "../../../lib/alumni";

// Generate all possible paths at build time
export async function getStaticPaths() {
    const years = getAlumniYears();
    const paths = [];

    // For each year, get all alumni and generate paths
    for (const year of years) {
        const alumniData = getAlumniData(year);
        if (alumniData) {
            // Create a path for each alumni member
            const yearPaths = alumniData.map(user => ({
                params: {
                    year,
                    id: user.email ? user.email.split('@')[0] : `user-${Math.random().toString(36).substring(2, 10)}`
                }
            }));
            paths.push(...yearPaths);
        }
    }

    return {
        paths,
        fallback: 'blocking' // Generate new pages if data changes
    };
}

// Get data for the specific alumni at build time
export async function getStaticProps({ params }) {
    const { year, id } = params;
    const alumniData = getAlumniData(year);
    const hasImagesDir = hasYearImagesDirectory(year);

    if (!alumniData) {
        return {
            notFound: true
        };
    }

    // Find the specific user
    const user = alumniData.find(u => u.email && u.email.split('@')[0] === id);

    if (!user) {
        return {
            notFound: true
        };
    }

    return {
        props: {
            year,
            user,
            hasImagesDir
        },
        revalidate: 3600 // Revalidate every hour
    };
}

export default function UserPage({ year, user, hasImagesDir }) {
    const router = useRouter();
    const [showAllTestimonials, setShowAllTestimonials] = useState(false);
    const [testimonialWriters, setTestimonialWriters] = useState({});

    useEffect(() => {
        // Fetch all alumni data for this year to find the profile pictures of testimonial writers
        async function fetchTestimonialWriters() {
            try {
                const response = await fetch(`/alumni_${year}.json`);
                if (response.ok) {
                    const alumniData = await response.json();

                    // Create a map of writer names to their profile pictures
                    const writers = {};
                    alumniData.forEach(alumni => {
                        if (alumni.name) {
                            writers[alumni.name] = {
                                pfp: alumni.pfp || null,
                                email: alumni.email || null
                            };
                        }
                    });

                    setTestimonialWriters(writers);
                }
            } catch (error) {
                console.error("Error fetching testimonial writers:", error);
            }
        }

        if (user.testimonials && user.testimonials.length > 0) {
            fetchTestimonialWriters();
        }
    }, [year, user.testimonials]);

    const hasMoreTestimonials = user.testimonials && user.testimonials.length > 3;
    const displayedTestimonials = showAllTestimonials
        ? user.testimonials
        : user.testimonials?.slice(0, 3);

    return (
        <section style={{ background: '#18101A', minHeight: '100vh', color: 'white' }}>
            <NavbarComponent isSticky={true} />
            <Box className="backdrop" style={{ backgroundColor: '#201824', color: 'white', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 120, paddingBottom: 40, paddingInline: '5%', border: '1.5px solid #32243a' }}>
                <Link href={`/alumni/${year}`} style={{
                    color: '#e0d7f7',
                    marginBottom: 32,
                    alignSelf: 'flex-start',
                    fontWeight: 600,
                    fontSize: 17,
                    textDecoration: 'none',
                    backgroundColor: '#1f121A',
                    padding: '12px 22px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.18)',
                    border: '1.5px solid #2a1533',
                    marginLeft: 0
                }}>
                    <span style={{ marginRight: '10px', fontSize: '20px' }}>←</span> Back to Batch
                </Link>

                {/* Personal Details Card */}
                <div style={{
                    background: '#1f121A',
                    borderRadius: 22,
                    padding: '48px',
                    boxShadow: '0 6px 32px rgba(60,0,80,0.22)',
                    width: '100%',
                    maxWidth: 1200,
                    textAlign: 'center',
                    border: '1.5px solid #3a1c4a',
                    wordBreak: 'break-word',
                    margin: '0 auto 32px auto',
                    color: '#e0d7f7'
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 28
                    }}>
                        <div style={{
                            width: 200,
                            height: 200,
                            background: '#1f121A',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
                            margin: '0 auto'
                        }}>
                            {user.pfp ? (
                                <img
                                    src={user.pfp.startsWith('/') ? user.pfp : hasImagesDir ? `/assets/images/${year}/${user.pfp.replace('images/', '')}` : `/assets/images/${user.pfp}`}
                                    alt={user.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <div style={{ fontSize: 80, color: '#e0d7f7' }}>
                                    {user.name?.charAt(0) || '?'}
                                </div>
                            )}
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <h1 style={{ margin: 0, color: '#e0d7f7', fontWeight: 800, fontSize: 36, wordBreak: 'break-word', letterSpacing: 0.5 }}>{user.name}</h1>
                            <p style={{ color: '#bba6d6', margin: '4px 0 12px 0', fontSize: 22, fontWeight: 500 }}>{user.branch}</p>
                            {user.tagline && <p style={{ color: '#e0d7f7', margin: '0 0 12px 0', fontSize: 18, fontStyle: 'italic' }}>&ldquo;{user.tagline}&rdquo;</p>}

                            <div style={{ color: '#bba6d6', marginBottom: 10, fontSize: 16 }}>
                                {user.nickname && <span style={{ marginRight: 18 }}>Nickname: <b style={{ color: '#e0d7f7' }}>{user.nickname}</b></span>}
                                {user.dob && <span>DOB: <b style={{ color: '#e0d7f7' }}>{user.dob}</b></span>}
                            </div>
                            <div style={{ margin: '18px 0', display: 'flex', gap: 24, justifyContent: 'center' }}>
                                {user.instagram && (
                                    <a
                                        href={`https://instagram.com/${user.instagram}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ textDecoration: 'none' }}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="28"
                                            height="28"
                                            viewBox="0 0 24 24"
                                            fill="#E4405F"
                                        >
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                        </svg>
                                    </a>
                                )}
                                {user.linkedin && (
                                    <a
                                        href={user.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ textDecoration: 'none' }}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="28"
                                            height="28"
                                            viewBox="0 0 24 24"
                                            fill="#0077B5"
                                        >
                                            <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.15 1.45-2.15 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.91 1.65-1.85 3.4-1.85 3.64 0 4.31 2.4 4.31 5.51v6.23zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.02H3.55V9h3.57v11.45zM22.23 0H1.77C.79 0 0 .78 0 1.75v20.5C0 23.21.79 24 1.77 24h20.45c.97 0 1.78-.79 1.78-1.75V1.75C24 .78 23.2 0 22.23 0z" />
                                        </svg>
                                    </a>
                                )}
                            </div>

                        </div>
                    </div>
                </div>

                {/* Journal Entries */}
                {user.journal && user.journal.length > 0 && (
                    <div style={{
                        background: '#1f121A',
                        borderRadius: 22,
                        padding: '38px',
                        boxShadow: '0 6px 32px rgba(60,0,80,0.22)',
                        width: '100%',
                        maxWidth: 1200,
                        border: '1.5px solid #3a1c4a',
                        margin: '0 auto 32px auto',
                    }}>
                        <h2 style={{ color: '#e0d7f7', marginTop: 0, textAlign: 'center', marginBottom: 28 }}>Journal Entries</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                            {user.journal.map((entry, idx) => (
                                <div key={idx} style={{ borderBottom: idx !== user.journal.length - 1 ? '1px solid #32243a' : 'none', paddingBottom: idx !== user.journal.length - 1 ? 32 : 0 }}>
                                    <h3 style={{ color: '#e0d7f7', margin: '0 0 12px 0', fontWeight: 600 }}>{entry.question}</h3>
                                    <p style={{ margin: 0, color: '#bba6d6', fontSize: 17, lineHeight: 1.5 }}>{entry.answer}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Testimonials */}
                {user.testimonials && user.testimonials.length > 0 && (
                    <div style={{
                        background: '#1f121A',
                        borderRadius: 22,
                        padding: '38px',
                        boxShadow: '0 6px 32px rgba(60,0,80,0.22)',
                        width: '100%',
                        maxWidth: 1200,
                        border: '1.5px solid #3a1c4a',
                        margin: '0 auto 32px auto',
                    }}>
                        <h2 style={{ color: '#e0d7f7', marginTop: 0, textAlign: 'center', marginBottom: 28 }}>Testimonials</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                            {displayedTestimonials && displayedTestimonials.map((testimonial, idx) => {
                                const writerInfo = testimonialWriters[testimonial.from] || {};

                                const profileHref = writerInfo.email ? `/alumni/${year}/${writerInfo.email.split('@')[0]}` : null;

                                return (
                                    <div key={idx} style={{ borderBottom: idx !== displayedTestimonials.length - 1 ? '1px solid #32243a' : 'none', paddingBottom: idx !== displayedTestimonials.length - 1 ? 32 : 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                                            {profileHref ? (
                                                <Link href={profileHref} passHref style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                                                    <div style={{ width: 45, height: 45, borderRadius: '50%', background: '#2a1533', marginRight: 16, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                                                        {writerInfo.pfp ? (
                                                            <img
                                                                src={writerInfo.pfp.startsWith('/') ? writerInfo.pfp : hasImagesDir ? `/assets/images/${year}/${writerInfo.pfp.replace('images/', '')}` : `/assets/images/${writerInfo.pfp}`}
                                                                alt={testimonial.from}
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#e0d7f7' }}>
                                                                {testimonial.from?.charAt(0) || '?'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <h4 style={{ margin: 0, color: '#e0d7f7', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>{testimonial.from}</h4>
                                                </Link>
                                            ) : (
                                                <>
                                                    <div style={{ width: 45, height: 45, borderRadius: '50%', background: '#2a1533', marginRight: 16, overflow: 'hidden' }}>
                                                        {writerInfo.pfp ? (
                                                            <img
                                                                src={writerInfo.pfp.startsWith('/') ? writerInfo.pfp : hasImagesDir ? `/assets/images/${year}/${writerInfo.pfp.replace('images/', '')}` : `/assets/images/${writerInfo.pfp}`}
                                                                alt={testimonial.from}
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#e0d7f7' }}>
                                                                {testimonial.from?.charAt(0) || '?'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <h4 style={{ margin: 0, color: '#e0d7f7', fontWeight: 600 }}>{testimonial.from}</h4>
                                                </>
                                            )}
                                            <div>
                                                {testimonial.relation && <p style={{ margin: '2px 0 0 0', color: '#bba6d6', fontSize: 14 }}>{testimonial.relation}</p>}
                                            </div>
                                        </div>
                                        <p style={{ margin: 0, color: '#bba6d6', fontSize: 17, lineHeight: 1.5, fontStyle: 'italic' }}>&ldquo;{testimonial.text}&rdquo;</p>
                                    </div>
                                );
                            })}
                            {hasMoreTestimonials && (
                                <button
                                    onClick={() => setShowAllTestimonials(!showAllTestimonials)}
                                    style={{
                                        background: '#23172b',
                                        border: '1.5px solid #2a1533',
                                        padding: '12px 22px',
                                        borderRadius: 10,
                                        color: '#e0d7f7',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontSize: 16,
                                        marginTop: 12,
                                        alignSelf: 'center',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {showAllTestimonials ? 'Show Less' : 'Show More Testimonials'}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </Box>
            <Bottom />
        </section>
    );
}
