import React, { useState, useEffect, useRef } from 'react';
import MemberBox from './member_box';
import { Box, Typography, Grid } from '@mui/material';

type MemberBoxProps = {
  name: string;
  imgSrc: string;
  InstaID: string;
  linkedinLink: string;
  githubLink: string;
  position: string;
};

type ParentBoxProps = {
  title: string;
  members: MemberBoxProps[];
};

const ParentBox: React.FC<ParentBoxProps> = ({ title, members }) => {
  const [titleVisible, setTitleVisible] = useState(false);
  const [gridVisible, setGridVisible] = useState(false);
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  const titleRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Title observer to trigger animation when title is visible
  useEffect(() => {
    const titleObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTitleVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (titleRef.current) {
      titleObserver.observe(titleRef.current);
    }

    return () => {
      if (titleRef.current) {
        titleObserver.unobserve(titleRef.current);
      }
    };
  }, []);

  // Grid observer to trigger animation when grid is visible
  useEffect(() => {
    const gridObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setGridVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (gridRef.current) {
      gridObserver.observe(gridRef.current);
    }

    return () => {
      if (gridRef.current) {
        gridObserver.unobserve(gridRef.current);
      }
    };
  }, []);

  // Item observer to trigger visibility for each grid item
  useEffect(() => {
    const itemObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !visibleItems.includes(Number(entry.target.id))) {
          setVisibleItems((prev) => [...prev, Number(entry.target.id)]);
        }
      });
    }, { threshold: 0.1 });

    const items = gridRef.current?.querySelectorAll('.grid-item');
    items?.forEach((item) => itemObserver.observe(item));

    return () => {
      items?.forEach((item) => itemObserver.unobserve(item));
    };
  }, [visibleItems]);

  return (
    <Box
      sx={{
        width: "100%",
        boxSizing: "border-box",
        px: { xs: 3, sm: 6, md: 8, lg: 12 },
        pt: 2,
        pb: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Title Section */}
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          marginBottom: { xs: 3, sm: 4, md: 5 },
          marginTop: { xs: 5, sm: 6, md: 7 },
          pt: 2,
          pb: 2,
        }}
      >
        <Typography
          ref={titleRef}
          variant="h1"
          sx={{
            fontSize: { xs: '2.5rem', sm: '2.75rem', md: '3.25rem' },
            color: 'rgba(248, 114, 114, 1)',
            fontWeight: 'bold',
            fontFamily: '"Noto Sans", serif',
            textAlign: 'center',
            position: 'relative',
            opacity: titleVisible ? 1 : 0,
            transform: titleVisible ? 'translateY(0)' : 'translateY(-30px)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            letterSpacing: '1px',
            textShadow: '0px 4px 12px rgba(248, 114, 114, 0.3)',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: titleVisible ? '60%' : '0%',
              height: '4px',
              background: 'linear-gradient(90deg, transparent, white, transparent)',
              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
              borderRadius: '2px',
              boxShadow: '0px 2px 8px rgba(255, 255, 255, 0.3)',
            },
          }}
        >
          {title}
        </Typography>
      </Box>

      {/* Grid Section */}
      <div ref={gridRef} style={{ width: '100%' }}>
      <Grid
        container
        justifyContent="center"
        alignItems="stretch"
        spacing={{ xs: 2, sm: 3, md: 3.5, lg: 4 }}
        sx={{
          opacity: gridVisible ? 1 : 0,
          transform: gridVisible ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.9s cubic-bezier(0.4, 0, 0.2, 1)",
          padding: { xs: "1rem 0", sm: "1.5rem 0", md: "2rem 0" },
        }}
      >
        {members.slice(0, 100).map((member, index) => (
          <Grid
            item
            xs={12}
            sm={12}
            md={6}
            lg={4}
            xl={3}
            key={index}
            className="grid-item"
            id={String(index)}
            sx={{
              display: "flex",
              flexDirection: "column",
              opacity: visibleItems.includes(index) ? 1 : 0,
              transform: visibleItems.includes(index) 
                ? "translateY(0) scale(1)" 
                : "translateY(40px) scale(0.95)",
              transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.08}s`,
              willChange: "transform, opacity",
            }}
          >
            <MemberBox
              name={member.name}
              imgSrc={member.imgSrc}
              InstaID={member.InstaID}
              linkedinLink={member.linkedinLink}
              githubLink={member.githubLink}
              position={member.position}
            />
          </Grid>
        ))}
      </Grid>

      </div>
    </Box>
  );
};

export default ParentBox;
