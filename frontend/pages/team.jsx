import React from 'react';

import { Box, CssBaseline } from "@mui/material";
import Bottom from "@components/footer";

import "@styles/global/pageStyles.scss";

import NavbarComponent from "../components/navbar";
import ParentBox from "../components/parent_box";

export default function Home() {  
  const COORDINATORS = [
    {
      name: "Aviral Gupta",
      imgSrc: "/assets/images/Aviral.jpeg",
      InstaID: "./team",
      linkedinLink: "https://linkedin.com/in/avilol",
      githubLink: "https://github.com/avi1o1",
      position: "Coordinator",
    },
  ];

  const DESIGN_AND_SOCIAL_MEDIA = [
    {
      name: "Shradha Kedia",
      imgSrc: "/assets/images/shraddah.jpg",
      InstaID: "./team",
      linkedinLink: "https://www.linkedin.com/in/shradha-kedia-b67906375/",
      githubLink: "./team",
      position: "Member",
    },
    {
      name: "Vaibhavi Kolipaka",
      imgSrc: "/assets/images/vaibhavi.jpg",
      InstaID: "vaibooooo",
      linkedinLink: "./team",
      githubLink: "./team",
      position: "Member",
    },
  ];

  const LOGISTICS = [
    {
      name: "Harry Jain",
      imgSrc: "/assets/images/Harry_Jain_Events.jpg",
      InstaID: "https://www.instagram.com/harr_yj_ain",
      linkedinLink: "https://www.linkedin.com/in/harry-jain-3119aa322",
      githubLink: "https://github.com/JARVISONFIRE",
      position: "Member",
    },
    {
      name: "Kartik Gupta",
      imgSrc: "/assets/images/Kartik Gupta_Admin and Finance.jpg",
      InstaID: "https://www.instagram.com/i_m_kg.640?igsh=MXE3ejBtbzhsdDh0aw==",
      linkedinLink: "https://www.linkedin.com/in/kartik-gupta-9a1511316?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      githubLink: "https://github.com/Imking640",
      position: "Member",
    },
    {
      name: "Krishna Kaundinya Peddibhotla",
      imgSrc: "/assets/images/SACC_logo.png",
      InstaID: "https://www.instagram.com/kr1shna2006/",
      linkedinLink: "https://www.linkedin.com/in/krishna-kaundinya-peddibhotla-8b2365358/",
      githubLink: "https://github.com/Kaundinya-P",
      position: "Member",
    },
    {
      name: "Sahejreet Singh Sethi",
      imgSrc: "/assets/images/sahejreet.jpeg",
      InstaID: "https://www.instagram.com/sahej.sethii?igsh=b3g5eTVqY2NvZjlu",
      linkedinLink: "https://www.linkedin.com/in/sahejreet-singh-5a6821377?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      githubLink: "https://github.com/Sahej-sethi",
      position: "Member",
    }
  ]
  
  const OUTREACH = [
    {
      name: "Anushka Saini",
      imgSrc: "/assets/images/SACC_logo.png",
      InstaID: "https://www.instagram.com/",
      linkedinLink: "https://www.linkedin.com/",
      githubLink: "https://github.com",
      position: "Member",
    },
    {
      name: "Chandralekhya Gopavarapu",
      imgSrc: "/assets/images/SACC_logo.png",
      InstaID: "https://www.instagram.com/gopavarapuramadevi?igsh=aWdlcXp4MGpoMHU0",
      linkedinLink: "https://www.linkedin.com/in/chandralekhya-gopavarapu-18400a372?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      githubLink: "https://github.com/chan-dralekhya",
      position: "Member",
    },  
    {
      name: "Ishant Mahajan",
      imgSrc: "/assets/images/IshantMC.jpeg",
      InstaID: "Ishantmahajan06",
      linkedinLink: "https://www.linkedin.com/in/ishant-mahajan-60694729b/",
      githubLink: "https://gitHub.com/IshantMahajan",
      position: "Member",
    },
    {
      name: "Madhav Singla",
      imgSrc: "/assets/images/madhav.jpg",
      InstaID: "https://www.instagram.com/madhavsingla75?igsh=MXIza3VxNm10YXU3cw%3D%3D&utm_source=qr",
      linkedinLink: "https://www.linkedin.com/in/madhav-singla-ece?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app",
      githubLink: "https://github.com/madhav-singla7",
      position: "Member",
    },
    {
      name: "Priyanshi Gupta",
      imgSrc: "/assets/images/Priyanshi_Gupta_Outreach.jpg",
      InstaID: "https://www.instagram.com/priyanshigupta.098/",
      linkedinLink: "https://www.linkedin.com/in/priyanshigupta098/",
      githubLink: "https://github.com/priyanshi123098",
      position: "Member",
    },
    {
      name: "Satyarth Gupta",
      imgSrc: "/assets/images/SACC_logo.png",
      InstaID: "www.instagram.com/satypatty",
      linkedinLink: "www.linkedin.com/in/satyarthgupta07",
      githubLink: "https://www.github.com/SatyarthGupta",
      position: "Member",
    },
  ];

  const TECH = [
    {
      name: "Aniket Goel",
      imgSrc: "/assets/images/aniket.jpg",
      InstaID: "https://www.instagram.com/aniket_goel23?igsh=MXJ3cmJuZzcwZGMwcg==",
      linkedinLink: "https://www.linkedin.com/in/aniket-goel-41b96a1b2?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      githubLink: "https://github.com/voidp1xel",
      position: "Member",
    },
    {
      name: "Avik Majumder",
      imgSrc: "/assets/images/avik.jpeg",
      InstaID: "https://www.instagram.com/avikmjd",
      linkedinLink: "https://linkedin.com/in/avik-majumder-b2a235383",
      githubLink: "https://github.com/avikmjd2",
      position: "Member",
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
