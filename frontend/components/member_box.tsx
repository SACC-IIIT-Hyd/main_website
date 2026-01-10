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
        width: "100%",
        maxWidth: "350px",
        height: "100%",
        margin: "0 auto",
        background: "linear-gradient(135deg, rgba(63, 43, 53, 0.95) 0%, rgba(45, 29, 40, 0.95) 100%)",
        color: "#EFDFC2",
        padding: "1.5rem",
        // minWidth: "260px", // Removed minWidth to allow card to shrink if needed
        borderRadius: "20px",
        boxSizing: "border-box",
        border: "1px solid rgba(185, 166, 178, 0.2)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.5), inset 0px 1px 0px rgba(255, 255, 255, 0.05)",
        
        "&:hover": {
          transform: "translateY(-6px) scale(1.02)",
          boxShadow: `
            0px 20px 40px rgba(248, 114, 114, 0.25),
            0px 0px 40px rgba(185, 166, 178, 0.15),
            inset 0px 1px 0px rgba(255, 255, 255, 0.1)
          `,
        },
      }}
    >
      {/* Image Container */}
      <Box
        sx={{
          width: "100%",
          maxWidth: "300px",
          height: "auto",
          aspectRatio: "1/1",
          position: "relative",
          overflow: "hidden",
          borderRadius: "16px",
          marginBottom: "1.5rem",
          marginLeft: "auto",
          marginRight: "auto",
          border: "2px solid rgba(248, 114, 114, 0.3)",
          boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.6), inset 0px 2px 4px rgba(255, 255, 255, 0.05)",
          backgroundColor: "#2a1a24",
          flexShrink: 0,
        }}
      >
        <Box
          component="img"
          src={imgSrc}
          alt={name}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            display: "block",
            transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </Box>

      {/* Member Name */}
      <Typography
        variant="h2"
        align="center"
        sx={{
          fontSize: "1.5rem",
          fontWeight: "700",
          lineHeight: 1.3,
          marginBottom: "0.5rem",
          color: "#EFDFC2",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          width: "100%",
        }}
      >
        {name}
      </Typography>

      {/* Position */}
      <Typography
        variant="h3"
        align="center"
        sx={{
          fontSize: "1rem",
          marginBottom: "1.5rem",
          color: "#b9a6b2",
          fontWeight: 500,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
        }}
      >
        {position}
      </Typography>
      {/* Social Icons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          "& a": {
            color: "#b9a6b2",
            backgroundColor: "rgba(185, 166, 178, 0.1)",
            borderRadius: "50%",
            padding: "0.6rem",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            border: "1px solid rgba(185, 166, 178, 0.2)",
            "&:hover": {
              color: "#F87272",
              backgroundColor: "rgba(248, 114, 114, 0.15)",
              borderColor: "rgba(248, 114, 114, 0.5)",
              transform: "translateY(-3px) scale(1.15)",
              boxShadow: "0px 6px 16px rgba(248, 114, 114, 0.3)",
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