import React from 'react';

import { Box, CssBaseline } from "@mui/material";
import Bottom from "@components/footer";

import NavbarComponent from "../components/navbar";
import ParentBox from "../components/parent_box";

export default function Home() {  
  const COORDINATORS = [
    // {
    //   name: "Aviral Gupta",
    //   imgSrc: "/assets/images/Aviral.jpeg",
    //   InstaID: "./team",
    //   linkedinLink: "https://linkedin.com/in/avilol",
    //   githubLink: "https://github.com/avi1o1",
    //   position: "Coordinator",
    // },
    {
      name: "Harry Jain",
      imgSrc: "/assets/images/Harry_Jain_Events.jpg",
      InstaID: "https://www.instagram.com/harr_yj_ain",
      linkedinLink: "https://www.linkedin.com/in/harry-jain-3119aa322",
      githubLink: "https://github.com/JARVISONFIRE",
      position: "Member",
    },
  ];

  const DESIGN_AND_SOCIAL_MEDIA = [
    {
      name: "Shradha Kedia",
      imgSrc: "/assets/images/shraddah.jpg",
      InstaID: "./team",
      linkedinLink: "https://www.linkedin.com/in/shradha-kedia-b67906375/",
      githubLink: "./team",
      position: "Team Head",
    },
  ];

  const LOGISTICS = [
    {
      name: "Sahejreet Singh Sethi",
      imgSrc: "/assets/images/sahejreet.jpeg",
      InstaID: "https://www.instagram.com/sahej.sethii?igsh=b3g5eTVqY2NvZjlu",
      linkedinLink: "https://www.linkedin.com/in/sahejreet-singh-5a6821377?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      githubLink: "https://github.com/Sahej-sethi",
      position: "Team Head",
    }
  ]
  
  const OUTREACH = [
    {
      name: "Satyarth Gupta",
      imgSrc: "/assets/images/SACC_logo.png",
      InstaID: "www.instagram.com/satypatty",
      linkedinLink: "www.linkedin.com/in/satyarthgupta07",
      githubLink: "https://www.github.com/SatyarthGupta",
      position: "Team Head",
    },
    {
      name: "Chandralekhya Gopavarapu",
      imgSrc: "/assets/images/SACC_logo.png",
      InstaID: "https://www.instagram.com/gopavarapuramadevi?igsh=aWdlcXp4MGpoMHU0",
      linkedinLink: "https://www.linkedin.com/in/chandralekhya-gopavarapu-18400a372?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      githubLink: "https://github.com/chan-dralekhya",
      position: "Member",
    },  
  ];

  const TECH = [
    {
      name: "Avik Majumder",
      imgSrc: "/assets/images/avik.jpg",
      InstaID: "https://www.instagram.com/avikmjd",
      linkedinLink: "https://linkedin.com/in/avik-majumder-b2a235383",
      githubLink: "https://github.com/avikmjd2",
      position: "Team Head",
    },
  ];

  return (
    <section>
      <NavbarComponent isSticky={true} />

      <Box className="backdrop">
        <div className="title-container">
          <div className="title-content">
            <h1 className="title">Meet the Team!</h1>
            <p className="subtitle">The People Behind the Scenes</p>
          </div>
        </div>

        <ParentBox title="Coordinator" members={COORDINATORS} />
        <ParentBox title="Tech Team" members={TECH} />
        <ParentBox title="Design and Social Media Team" members={DESIGN_AND_SOCIAL_MEDIA} />
        <ParentBox title="Logistics Team" members={LOGISTICS} />
        <ParentBox title="Outreach Team" members={OUTREACH} />
      </Box>

      <div>
        <Bottom />
      </div>
    </section>
  );
}
