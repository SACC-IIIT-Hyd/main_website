import { useTheme } from "@mui/material";
import { Box, Grid } from "@mui/material";

import "@styles/global/pageStyles.scss";
import "@styles/yearbooks.scss";

import NavbarComponent from "../components/navbar";
import Bottom from "@components/footer";

const yearbookData = [
  { year: "2k21", previewImage: "/assets/yearbooks/2k21_preview.png" },
  { year: "2k20", previewImage: "/assets/yearbooks/2k20_preview.jpg" },
  { year: "2k19", previewImage: "/assets/yearbooks/2k19_preview.jpg" },
  { year: "2k15", previewImage: "/assets/yearbooks/2k15_preview.jpg" },
  { year: "2k14", previewImage: "/assets/yearbooks/2k14_preview.jpg" },
];

export default function Home() {
  const theme = useTheme();

  return (
    <section>
      <NavbarComponent isSticky />
      <Box className="backdrop">
        <div className="title-container">
          <div className="title-content">
            <h1 className="title">Yearbooks</h1>
            <p className="subtitle">Revisit the Memories!</p>
          </div>
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
