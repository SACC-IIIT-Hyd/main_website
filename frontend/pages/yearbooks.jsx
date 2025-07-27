import NavbarComponent from "../components/navbar";
import { Box, Grid } from "@mui/material";
import "@styles/yearbooks.scss";
import Bottom from "@components/footer";
import { useMediaQuery, useTheme } from "@mui/material";

const yearbookData = [
  { year: "2k21", previewImage: "/assets/yearbooks/2k21_preview.png" },
  { year: "2k20", previewImage: "/assets/yearbooks/2k20_preview.jpg" },
  { year: "2k19", previewImage: "/assets/yearbooks/2k19_preview.jpg" },
  { year: "2k15", previewImage: "/assets/yearbooks/2k15_preview.jpg" },
  { year: "2k14", previewImage: "/assets/yearbooks/2k14_preview.jpg" },
];

export default function Home() {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <section>
      <NavbarComponent isSticky />
      <Box className="backdrop">
        <div className="yearbook-container">
          <div className="text-content">
            <h1 className="title">Yearbooks</h1>
            <p className="subtitle">Revisit the Memories!</p>
          </div>
          {/* <img
            className="image"
            src="/assets/images/fly.webp"
            alt="Butterfly"
          /> */}
        </div>

        <Grid
          container
          spacing={9}
          justifyContent="center"
          alignItems="center"
          className="yearbooksGrid"
        >
          {yearbookData.map((yearbook, index) => (
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
                href={`/yearbook?year=${yearbook.year}`}
                className="yearbookPreview"
                style={{
                  backgroundImage: `url(${yearbook.previewImage})`,
                }}
              >
                <Box className="yearbookLabel">
                  <h4>Batch of</h4>
                  <h2>{yearbook.year}</h2>
                </Box>
              </a>
            </Grid>
          ))}
        </Grid>
      </Box>
      <Bottom />
    </section>
  );
}
