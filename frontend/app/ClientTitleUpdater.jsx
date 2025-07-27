'use client';

import { useEffect } from 'react';

const getPageTitle = (path) => {
  switch (path) {
    case '':
    case '/':
    case '/home':
    case 'home':
      return 'Home | SACC';
    case '/about':
    case 'about':
      return 'About | SACC';
    case '/team':
    case 'team':
      return 'Team | SACC';
    case '/event':
    case 'event':
      return 'Events | SACC';
    case '/yearbook':
    case 'yearbook':
    case '/yearbooks':
    case 'yearbooks':
      return 'Yearbooks | SACC';
    case 'alumni':
    case '/alumni':
      return 'Alumni | SACC';
    default:
      return 'SACC';
  }
};

const ClientTitleUpdater = () => {
  useEffect(() => {
    let expectedTitle = '';

    const updateTitle = () => {
      const path = window.location.pathname;
      const title = getPageTitle(path);
      expectedTitle = title;
      console.log('Current path:', path);
      console.log('Setting title to:', title);
      document.title = title;
    };

    // Set title initially
    updateTitle();

    // Listen for navigation changes
    const handleNavigation = () => {
      setTimeout(updateTitle, 0);
    };

    // Listen for both popstate (back/forward) and pushstate/replacestate
    window.addEventListener('popstate', handleNavigation);
    
    // Override pushState and replaceState to catch programmatic navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleNavigation();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleNavigation();
    };

    // Monitor title changes and override them
    const titleObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.target.tagName === 'TITLE') {
          if (document.title !== expectedTitle) {
            console.log('Title was changed from', expectedTitle, 'to', document.title, '- overriding!');
            setTimeout(() => {
              document.title = expectedTitle;
            }, 0);
          }
        }
      });
    });

    // Watch for title element changes
    const titleElement = document.querySelector('title');
    if (titleElement) {
      titleObserver.observe(titleElement, { 
        childList: true, 
        characterData: true, 
        subtree: true 
      });
    }

    // Also watch the head for new title elements being added
    titleObserver.observe(document.head, { childList: true });

    // Additional safeguard - periodic check
    const intervalId = setInterval(() => {
      if (document.title !== expectedTitle) {
        console.log('Periodic check: Title was', document.title, 'should be', expectedTitle);
        document.title = expectedTitle;
      }
    }, 100);

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      titleObserver.disconnect();
      clearInterval(intervalId);
    };
  }, []);

  return null;
};

export default ClientTitleUpdater;