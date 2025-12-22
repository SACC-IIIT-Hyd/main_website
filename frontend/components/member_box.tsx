import React, { useMemo } from "react";
import {
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";

import LinkedInIcon from "@mui/icons-material/LinkedIn";
import GitHubIcon from "@mui/icons-material/GitHub";
import { InstagramLogoIcon } from "@radix-ui/react-icons";

type MemberBoxProps = {
  name: string;
  imgSrc: string;
  InstaID: string;
  linkedinLink: string;
  githubLink: string;
  position: string;
};

const MemberBox: React.FC<MemberBoxProps> = ({
  name,
  imgSrc,
  InstaID,
  linkedinLink,
  githubLink,
  position,
}) => {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      sx={{
        flex: "1 1 auto",
        margin: { xs: "1rem", sm: "1.5rem", md: "2rem" }, // Reduced margin for mobile
        backgroundColor: "#eee",
        color: "#373737",
        padding: "1.5rem",
        borderRadius: "13px",
        boxSizing: "border-box",
        transition: "background-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease",
        height: "100%", // Ensures it fills the parent grid height
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          transform: "scale(1.03)",
          backgroundColor: "#bbb",
          boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.15)",
        },
      }}
    >
      {/* Image Container */}
      <Box
        sx={{
          width: "100%",
          paddingTop: "100%",
          position: "relative",
          overflow: "hidden",
          borderRadius: "8px",
          marginBottom: "2vh",
        }}
      >
        <img
          src={imgSrc}
          alt={name}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </Box>

      {/* Member Name - FIXED AUTOMATIC RESIZING */}
      <Typography
        variant="h2"
        align="center"
        sx={{
          // This automatically scales font between 1rem and 1.5rem based on container width
          fontSize: "clamp(1rem, 2.5vw, 1.5rem)", 
          fontWeight: "bold",
          lineHeight: 1.1,
          marginBottom: "0.5rem",
          width: "100%",
          
          // Allow long names to wrap to 2 lines if needed
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          wordWrap: "break-word",
          minHeight: "2.2em", // Keeps boxes aligned even if one has 1 line and other has 2
        }}
      >
        {name}
      </Typography>

      {/* Position */}
      <Typography
        variant="h3"
        align="center"
        sx={{
          fontSize: isPhone ? "0.9rem" : "1.1rem",
          marginBottom: "auto", // Pushes social icons to the bottom
          color: "#555",
        }}
      >
        {position}
      </Typography>

      {/* Social Icons */}
      <Box
        sx={{
          textAlign: "center",
          marginTop: "1rem",
          "& a": {
            color: "#3a4052",
            "&:hover": {
              color: "#6699ee",
            },
          },
        }}
      >
        <IconButton href={githubLink} color="inherit" size="small">
          <GitHubIcon fontSize="small" />
        </IconButton>
        <IconButton href={InstaID} color="inherit" size="small">
          <InstagramLogoIcon />
        </IconButton>
        <IconButton href={linkedinLink} color="inherit" size="small">
          <LinkedInIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default MemberBox;