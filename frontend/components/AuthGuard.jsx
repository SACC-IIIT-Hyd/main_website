import React, { useState, useEffect } from "react";
import NavbarComponent from "./navbar";
import Bottom from "@components/footer";

/**
 * AuthGuard ensures that only users with the `Authorization_YearBook` cookie
 * (authenticated via IIIT-H CAS) can access protected routes.
 *
 * If unauthenticated, displays the standard CAS login prompt matching /yearbook.
 */
export default function AuthGuard({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const cookies = document.cookie.split(";");
    const isAuthorized = cookies.some((cookie) =>
      cookie.trim().includes("Authorization_YearBook")
    );
    setAuthenticated(isAuthorized);
    setChecking(false);
  }, []);

  if (checking) {
    return (
      <section style={{ background: "#18101A", minHeight: "100vh", color: "white" }}>
        <NavbarComponent isSticky={true} />
        <div style={{ minHeight: "calc(100vh - 120px)" }} />
        <Bottom />
      </section>
    );
  }

  if (!authenticated) {
    return (
      <section style={{ background: "#18101A", minHeight: "100vh", color: "white" }}>
        <NavbarComponent isSticky={true} />
        <section
          style={{
            minHeight: "calc(100vh - 160px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "40px 20px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h1 style={{ color: "#e0d7f7", fontSize: "28px", fontWeight: 700, marginBottom: "16px" }}>
              You are not authenticated to view this page.
            </h1>
          </div>
          <div
            style={{
              textAlign: "center",
              marginTop: "16px",
            }}
          >
            <h2>
              <a href="/api/login" className="btn">
                Login CAS
              </a>
            </h2>
          </div>
        </section>
        <Bottom />
      </section>
    );
  }

  return <>{children}</>;
}

