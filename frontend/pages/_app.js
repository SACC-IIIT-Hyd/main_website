import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Global Styles
import '@styles/globals.scss';
import '@styles/global/pageStyles.scss';
import '@styles/navbar.scss';
import '@styles/footer.scss';
import '@styles/home.scss';
import '@styles/about.scss';
import '@styles/events.scss';
import '@styles/team.scss';
import '@styles/yearbooks.scss';
import '@styles/embla.css';
import '@styles/flipbook.css';
import '@styles/connect.scss';
import '@styles/ProfilePanel.scss';
import '@styles/CommunityAdminPanel.scss';
import '@styles/SuperAdminPanel.scss';


const getPageTitle = (path) => {
  switch (path) {
    case '/':
    case '/home':
      return 'Home | SACC';
    case '/about':
      return 'About | SACC';
    case '/team':
      return 'Team | SACC';
    case '/event':
      return 'Events | SACC';
    case '/yearbook':
    case '/yearbooks':
      return 'Yearbooks | SACC';
    case '/alumni':
      return 'Alumni | SACC';
    case '/connect':
      return 'Connect | SACC';
    default:
      return 'SACC';
  }
};

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const updateTitle = () => {
      const title = getPageTitle(router.pathname);
      console.log('Current path:', router.pathname);
      console.log('Setting title to:', title);
      document.title = title;
    };

    // Set title initially
    updateTitle();

    // Listen for route changes
    router.events.on('routeChangeComplete', updateTitle);

    return () => {
      router.events.off('routeChangeComplete', updateTitle);
    };
  }, [router.pathname, router.events]);

  return <Component {...pageProps} />;
}