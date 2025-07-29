import NavbarComponent from "../components/navbar";
import { Box, Grid } from "@mui/material";
import "@styles/yearbooks.scss";
import Bottom from "@components/footer";
import { getAlumniYears } from "../lib/alumni";
import { useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useState } from "react";

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
    const [alumniData, setAlumniData] = useState([]);

    useEffect(() => {
        const data = alumniYears.map((year) => {
            let previewImage;
            switch (year) {
                case "2021":
                    previewImage = "/assets/yearbooks/2k21_preview.png";
                    break;
                case "2020":
                    previewImage = "/assets/yearbooks/2k20_preview.jpg";
                    break;
                case "2019":
                    previewImage = "/assets/yearbooks/2k19_preview.jpg";
                    break;
                case "2015":
                    previewImage = "/assets/yearbooks/2k15_preview.jpg";
                    break;
                case "2014":
                    previewImage = "/assets/yearbooks/2k14_preview.jpg";
                    break;
                default:
                    previewImage = `/assets/yearbooks/${year}_preview.jpg`;
            }
            return { year, previewImage };
        });
        setAlumniData(data);
    }, [alumniYears]);

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
                    {alumniData.length > 0 ? (
                        alumniData.map((alumni, index) => (
                            <Grid
                                item
                                key={index}
                                xs={18}
                                sm={6}
                                md={4.15}
                                lg={4}
                                display="flex"
                                justifyContent="center"
                                alignItems="center"
                                className="yearbookContainer"
                            >
                                <a
                                    href={`/alumni/${alumni.year}`}
                                    className="yearbookPreview"
                                    style={{
                                        backgroundImage: `url(${alumni.previewImage})`,
                                    }}
                                >
                                    <Box className="yearbookLabel">
                                        <h4>Batch of</h4>
                                        <h2>{alumni.year}</h2>
                                    </Box>
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