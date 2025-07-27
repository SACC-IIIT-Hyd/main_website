import NavbarComponent from "../components/navbar";
import { Box, Grid } from "@mui/material";
import "@styles/yearbooks.scss";
import Bottom from "@components/footer";
import { getAlumniYears } from "../lib/alumni";
import { useMediaQuery, useTheme } from "@mui/material";

// Get all alumni years at build time
export async function getStaticProps() {
    const years = getAlumniYears();

    return {
        props: {
            alumniYears: years
        },
        // Revalidate every hour to pick up new alumni files
        revalidate: 3600
    };
}

export default function Alumni({ alumniYears }) {
    const theme = useTheme();
    const isXs = useMediaQuery(theme.breakpoints.down("sm"));

    return (
        <section>
            <NavbarComponent isSticky={true} />
            <Box className="backdrop">
                <div className="yearbook-container">
                    <div className="text-content">
                        <h1 className="title">Alumni</h1>
                        <p className="subtitle">Meet Our Alumni Batches!</p>
                    </div>
                </div>

                <Grid
                    container
                    spacing={9}
                    justifyContent="center"
                    alignItems="center"
                    className="yearbooksGrid"
                >
                    {alumniYears.length > 0 ? (
                        alumniYears.map((year, index) => (
                            <Grid
                                item
                                key={index}
                                xs={8}
                                sm={4}
                                md={3}
                                lg={2.5}
                                display="flex"
                                justifyContent="center"
                                alignItems="center"
                                className="yearbookContainer"
                            >
                                <a
                                    href={`/alumni/${year}`}
                                    className="alumniPreview"
                                >
                                    <Box className="alumniLabel">
                                        <h2>{year}</h2>
                                    </Box>
                                    <div className="alumni-pattern-overlay"></div>
                                </a>
                            </Grid>
                        ))
                    ) : (
                        <div className="no-alumni-message">
                            <h3>No alumni batches found</h3>
                        </div>
                    )}
                </Grid>
            </Box>
            <Bottom />
        </section>
    );
} 