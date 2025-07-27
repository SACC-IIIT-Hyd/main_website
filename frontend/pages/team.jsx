import ParentBox from "../components/parent_box";
import NavbarComponent from "../components/navbar";
import { Box, CssBaseline } from "@mui/material";
import Bottom from "@components/footer";
import React from 'react';

// const ameyimg = "/assets/images/amey.png";

export default function Home() {
  const coordinators = [
    {
      name: "Kunal Angadi",
      imgSrc: "/assets/images/20240630_181834.jpg",
      InstaID: "https://instagram.com/angadi__kunal",
      linkedinLink: "https://www.linkedin.com/in/kunal-angadi",
      githubLink: "https://www.github.com/kunalangadi123",
      position: "Co-ordinator",
    },
    {
      name: "Aviral Gupta",
      imgSrc: "/assets/images/Aviral.jpeg",
      InstaID: "./team",
      linkedinLink: "https://www.linkedin.com/in/avilol/",
      githubLink: "https://github.com/avi1o1",
      position: "Vice coordinator",
    },
  ];

  const Events = [
    {
      name: "Aviral Gupta",
      imgSrc: "/assets/images/Aviral.jpeg",
      InstaID: "./team",
      linkedinLink: "https://www.linkedin.com/in/avilol/",
      githubLink: "https://github.com/avi1o1",
      position: "Head",
    },
    {
      name: "Arushi Tandon",
      imgSrc: "/assets/images/Arushi-Tandon_Events.png",
      InstaID: "https://instagram.com/_itstandon_",
      linkedinLink: "https://www.linkedin.com/in/arushi-tandon-5139982a0",
      githubLink: "",
      position: "Member",
    },
    {
      name: "Harry Jain",
      imgSrc: "/assets/images/Harry_Jain_Events.jpg",
      InstaID: "https://instagram.com/harr_yj_ain",
      linkedinLink: "https://www.linkedin.com/in/harry-jain-3119aa322",
      githubLink: "https://github.com/JARVISONFIRE",
      position: "Member",
    },
    {
      name: "Konda Rithvika",
      imgSrc: "/assets/images/SACC_logo.png",
      InstaID: "https://instagram.com/rithvikakonda_20",
      linkedinLink: "https://www.linkedin.com/in/konda-rithvika-431a86342",
      githubLink: "https://github.com/rithvikakonda",
      position: "member",
    },
    {
      name: "Nikhita Ravi",
      imgSrc: "/assets/images/Nikhita_Anjani_Ravi-Events.jpg",
      InstaID: "https://instagram.com/nikhitarvi",
      linkedinLink:
        "https://www.linkedin.com/in/nikhita-anjani-ravi-94907531b?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      githubLink: "https://www.github.com/n7khita-r",
      position: "Member",
    },
    {
      name: "Radheshyam",
      imgSrc: "/assets/images/Radheshyam_events.jpg",
      InstaID: "https://instagram.com/radheshyammodampuri",
      linkedinLink:
        "https://www.linkedin.com/in/radheshyam-modampuri-9508a3286?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      githubLink: "https://github.com/radheshyam2006",
      position: "Member",
    },
  ];

  const Outreach = [
    {
      name: "Priyanshi Gupta",
      imgSrc: "/assets/images/Priyanshi_Gupta_Outreach.jpg",
      InstaID: "https://instagram.com/priyanshigupta.098",
      linkedinLink: "www.linkedin.com/in/priyanshi-g-912479302",
      githubLink: "https://github.com/priyanshi123098",
      position: "Head",
    },
    {
      name: "Akshat Gupta",
      imgSrc: "/assets/images/Akshat_Gupta_Outreach.jpg",
      InstaID: "https://instagram.com/gakshat4",
      linkedinLink:
        "https://www.linkedin.com/in/iiith-akshat-gupta?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      githubLink: "https://github.com/gakshat365",
      position: "Member",
    },
    {
      name: "Akshitha V",
      imgSrc: "/assets/images/Akshitha_Gayatri_Outreach.jpg",
      InstaID: "https://instagram.com/worldofakshitha",
      linkedinLink:
        "https://www.linkedin.com/in/akshitha-gayatri-velugubantla-718909295?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      githubLink: "https://github.com/akshitha-gayatri",
      position: "Member",
    },
    {
      name: "Anushka Saini",
      imgSrc: "/assets/images/Anushka Saini_Outreach.jpg",
      InstaID: "https://instagram.com/anushka100706",
      linkedinLink: "https://www.linkedin.com/in/anushka-saini-/",
      githubLink: "https://www.github.com/RimAnu204",
      position: "Member",
    },
    {
      name: "Grandhi Sai",
      imgSrc: "/assets/images/Nitin_Outreach.jpg",
      InstaID: "https://instagram.com/nitinrs773.ins",
      linkedinLink:
        "https://www.linkedin.com/in/nitin-grandhi-9048a6237?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      githubLink: "https://www.github.com/ntini773",
      position: "Member",
    },
    {
      name: "Naman Singhal",
      imgSrc: "/assets/images/Naman Singhal Corporate_.jpg ",
      InstaID: "https://www.instagram.com/the_neemon",
      linkedinLink: "https://www.linkedin.com/in/naman-singhal-4a2aaa321/",
      githubLink: "https://github.com/the-neemon",
      position: "Member",
    },
    {
      name: "Nikhilesh Nallavelli",
      imgSrc: "/assets/images/Nikhilesh Nallavelli outreach_.jpg",
      InstaID: "https://instagram.com/nikhileshnallavelli",
      linkedinLink:
        "https://www.linkedin.com/in/nikhilesh-nallavelli-b9072a313/",
      githubLink: "https://github.com/NikhileshNallavelli",
      position: "Member",
    },
    {
      name: "Pasumarthy Deepak",
      imgSrc: "/assets/images/deepak_outreach_.jpg",
      InstaID: "https://instagram.com/hunter_deepak18",
      linkedinLink:
        "https://www.linkedin.com/in/sai-deepak-1482a8286?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      githubLink: "https://github.com/deepu1965",
      position: "Member",
    },
    {
      name: "Poojitha J",
      imgSrc: "/assets/images/Poojitha J_Outreach.jpeg",
      InstaID: "https://instagram.com/siri_376_pj",
      linkedinLink: "https://www.linkedin.com/in/poojitha-j-1273501b7",
      githubLink: "https://github.com/poojitha376",
      position: "Member",
    },
    {
      name: "Shravani K",
      imgSrc: "/assets/images/SACC_logo.png",
      InstaID: "https://instagram.com/shravaniik",
      linkedinLink: "https://www.linkedin.com/in/shravani-kalmali/",
      githubLink: "https://www.github.com/shravanikalmali",
      position: "Member",
    },
  ];

  const Tech = [
    {
      name: "Kriti Gupta",
      imgSrc: "/assets/images/Kriti_Gupta_TechTeam.jpg",
      InstaID: "https://www.instagram.com/kriti.gupta22",
      linkedinLink: "https://www.linkedin.com/in/kriti-gupta-b88019287/",
      githubLink: "https://github.com/Kriti1908",
      position: "Head",
    },
    {
      name: "Chekka Yogeswari",
      imgSrc: "/assets/images/Chekka Yogeswari_Tech.jpg",
      InstaID: "./team",
      linkedinLink:
        "https://www.linkedin.com/in/chekka-yogeswari?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      githubLink: "https://github.com/yogeswari05",
      position: "Member",
    },
    {
      name: "Karthik Malavathula",
      imgSrc: "/assets/images/KarthikVenkat_Tech.jpg",
      InstaID: "./team",
      linkedinLink:
      "https://www.linkedin.com/in/karthik-venkat-malavathula-7057722a2?utm_source=e&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      githubLink: "https://github.com/karthikvmala",
      position: "Member",
    },
    {
      name: " Nikhilesh",
      imgSrc: "/assets/images/Nikhilesh_Tech.jpg",
      InstaID: "https://instagram.com/nikhilesh4115_t",
      linkedinLink:
      "https://www.linkedin.com/in/tiruveedula-nikhilesh-8238b52a7?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      githubLink: "https://github.com/nikhilesh4",
      position: "Member",
    },
    {
      name: "Saarthak Sabharwal",
      imgSrc: "/assets/images/Saarthak_Sabharwal_Tech.jpg",
      InstaID: "www.instagram.com/5__guesswhat__7",
      linkedinLink: "https://www.linkedin.com/in/saarthak-sabharwal/",
      githubLink: "https://github.com/saarthak5",
      position: "Member",
    },
    {
      name: "Sriyansh Suryadevara",
      imgSrc: "/assets/images/Sriyansh_Suryadevara_Teach.jpg",
      InstaID: "https://www.instagram.com/sriyansh_surya",
      linkedinLink: "www.linkedin.com/in/sriyansh-suryadevara-a98025314",
      githubLink: "https://github.com/SANS-Surya-o",
      position: "Member",
    },
  ];

  const Content = [
    {
      name: "Shlok Sand",
      imgSrc: "/assets/images/SACC_logo.png",
      InstaID: "./team",
      linkedinLink: "https://www.linkedin.com/in/shlok-sand-5a9a51280",
      githubLink: "./team",
      position: "Head",
    },
    {
      name: "Ishaan Romil",
      imgSrc: "/assets/images/Ishaan_Romil_Content.jpg",
      InstaID: "https://instagram.com/ishaan_romil",
      linkedinLink: "https://www.linkedin.com/in/ishaan-romil/",
      githubLink: "https://github.com/Fane1824",
      position: "Member",
    },
    {
      name: "Kanishka Jepal",
      imgSrc: "/assets/images/Kanishka_Jepal_content.jpg",
      InstaID: "https://instagram.com/kanishkajepal",
      linkedinLink: "./team",
      githubLink: "./team",
      position: "Member",
    },
    {
      name: "Pritika Sinharay",
      imgSrc: "/assets/images/SACC_logo.png",
      InstaID: "./team",
      linkedinLink: "./team",
      githubLink: "./team",
      position: "Member",
    },
  ];

  const Social = [
    {
      name: "Kushagra Trivedi",
      imgSrc: "/assets/images/KushagraTrivedi_SocialMedia.png",
      InstaID: "https://instagram.com/kushagratrivedi2005",
      linkedinLink: "https://www.linkedin.com/in/kushagratrivedi/",
      githubLink: "https://github.com/kushagratrivedi2005",
      position: "Head",
    },
    {
      name: "Nidhish Jain",
      imgSrc: "/assets/images/nidhish_jain_social.jpg",
      InstaID: "https://instagram.com/nidhish_jain_",
      linkedinLink: "https://www.linkedin.com/in/nidhish-jain-43ab52280",
      githubLink: "https://github.com/Nidhishj",
      position: "Member",
    },
    {
      name: "Nilanjana De",
      imgSrc: "/assets/images/NilanjanaDe_SocialMediaTeam.jpg",
      InstaID: "https://instagram.com/nilanjana.de_",
      linkedinLink:
        "https://www.linkedin.com/in/nilanjana-de-29082b291?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      githubLink: "https://github.com/Jam-shop",
      position: "Member",
    },
  ];

  const Video = [
    {
      name: "Kushagra Trivedi",
      imgSrc: "/assets/images/KushagraTrivedi_SocialMedia.png",
      InstaID: "https://instagram.com/kushagratrivedi2005",
      linkedinLink:
        "https://www.linkedin.com/in/kushagratrivedi?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      githubLink: "https://github.com/kushagratrivedi2005",
      position: "Head",
    },
    {
      name: "Hemang Joshi",
      imgSrc: "/assets/images/IMG_20241007_121811_361.webp",
      InstaID: "https://www.instagram.com/karma.skz",
      linkedinLink: "https://www.linkedin.com/in/hemang-joshi-80b805314/",
      githubLink: "https://www.github.com/karma-skz",
      position: "Member",
    },
    {
      name: "Mohith Tondepu",
      imgSrc: "/assets/images/Mohith Tondepu_Videography Team.jpg",
      InstaID: "https://instagram.com/mohith_176",
      linkedinLink:
        "https://www.linkedin.com/in/mohith-tondepu-26960b2a9?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      githubLink: "https://github.com/mohith176",
      position: "Member",
    },
  ];

  const Design = [
    {
      name: "Deekshitha",
      imgSrc: "/assets/images/Deekshitha.jpg",
      InstaID: "./team",
      linkedinLink:
        "./team",
      githubLink: "./team",
      position: "Head",
    },
    {
      name: "Kavuri Vivek Hruday",
      imgSrc: "/assets/images/Vivek Hruday_Design Team.jpg",
      InstaID: "https://instagram.com/vivekhruday005",
      linkedinLink:
        "https://www.linkedin.com/in/vivek-hruday-kavuri-81736b2b1?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      githubLink: "https://github.com/vivekhruday05",
      position: "Member",
    },
    {
      name: "Rohan Kumar",
      imgSrc: "/assets/images/Ro.png",
      InstaID: "https://instagram.com/rohansingh1010",
      linkedinLink: "https://www.linkedin.com/in/rohan-kumar-a625632ba/",
      githubLink: "https://github.com/rohan2023101003",
      position: "Member",
    },
    {
      name: "Venya Velmurugan",
      imgSrc: "/assets/images/Venya Velmurugan _ Design.jpg",
      InstaID: "https://instagram.com/venya.vel",
      linkedinLink: "https://www.linkedin.com/in/venya-velmurugan-4b0712342",
      githubLink: "https://github.com/ivv12",
      position: "Member",
    },
  ];

  const Admin = [
    {
      name: "Ayush Sabhasad",
      imgSrc: "/assets/images/Ayush Sabhasad Admin team.jpg",
      InstaID: "./team",
      linkedinLink: "./team",
      githubLink: "./team",
      position: "Head",
    },
    {
      name: "Aryan Chaudhary",
      imgSrc: "/assets/images/SACC_logo.png",
      InstaID: "https://instagram.com/not.aryanchaudhary",
      linkedinLink:
        "https://www.linkedin.com/in/aryan-chaudhary-45396a282?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      githubLink: "https://github.com/Aryan3it",
      position: "Member",
    },
    {
      name: "Kartik Gupta",
      imgSrc: "/assets/images/Kartik Gupta_Admin and Finance.jpg",
      InstaID: "https://instagram.com/i_m_kg.640",
      linkedinLink: "https://www.linkedin.com/in/kartik-gupta-9a1511316/",
      githubLink: "https://github.com/Imking640",
      position: "Member",
    },
    {
      name: "Shaurya Kochar",
      imgSrc: "/assets/images/SACC_logo.png",
      InstaID: "https://instagram.com/shauryakochar",
      linkedinLink:
        "https://www.linkedin.com/in/shaurya-kochar-12577b1a8?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      githubLink: "https://github.com/ShauryaKochar",
      position: "Member",
    },
    {
      name: "Shreyash Lohare",
      imgSrc: "/assets/images/Shreyash-Lohare_Admin_and_Finance.jpg",
      InstaID: "https://www.instagram.com/shreyash_lohare",
      linkedinLink: "https://www.linkedin.com/in/shreyash-lohare-178aa6314/",
      githubLink: "https://github.com/shreyash-lohare",
      position: "Member",
    },
  ];

  const Advisory = [
    {
      name: "Adtiya Pansari",
      imgSrc: "/assets/images/Aditya Jain Pansari Advisory.jpg",
      InstaID: "https://www.instagram.com/aj_pansari",
      linkedinLink: "https://www.linkedin.com/in/adityajainpansari/",
      githubLink: "https://github.com/AdityaJainPansari",
      position: "",
    },
    {
      name: "Rohan Gupta",
      imgSrc: "/assets/images/Rohan.jpeg",
      InstaID: "https://www.instagram.com",
      linkedinLink: "https://www.linkedin.com",
      githubLink: "https://github.com",
      position: "",
    },
  ];

  return (
    <section>
      <NavbarComponent isSticky={true} />

      <Box
        sx={{
          backgroundColor: "#1D141A",
          color: "white",
          minHeight: "60vh",
          marginTop: "55px",
        }}
      >
        <CssBaseline />
        <Box sx={{ height: "37px" }} />
        <ParentBox title="Co-ordinators" members={coordinators} />
        <ParentBox title="Admin and Finance Team" members={Admin} />
        <ParentBox title="Content Writing Team" members={Content} />
        <ParentBox title="Design Team" members={Design} />
        <ParentBox title="Events Team" members={Events} />
        <ParentBox title="Social Media Team" members={Social} />
        <ParentBox title="Tech Team" members={Tech} />
        <ParentBox title="Outreach Team" members={Outreach} />
        <ParentBox title="Videography Team" members={Video} />
        <ParentBox title="Advisory" members={Advisory} />
      </Box>

      <div>
        <Bottom />
      </div>
    </section>
  );
}
