import React from 'react';

/**
 * Authentication utility functions for client-side auth checks
 */

/**
 * Check if user is authenticated by looking for the Authorization_YearBook cookie
 * @returns {boolean} - true if authenticated, false otherwise
 */
export const isAuthenticated = () => {
    if (typeof document === 'undefined') {
        // Server-side rendering
        return false;
    }

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        if (cookie.trim().includes('Authorization_YearBook')) {
            const value = cookie.split('=')[1];
            return value && value.trim() !== '';
        }
    }
    return false;
};

/**
 * Redirect to CAS login with the current page as the next URL
 * @param {string} currentPath - Current page path to return to after login
 */
export const redirectToCASLogin = (currentPath = null) => {
    if (typeof window === 'undefined') {
        return;
    }

    const nextUrl = currentPath || window.location.pathname;
    const loginUrl = `/api/login?next=${encodeURIComponent(nextUrl)}`;
    window.location.href = loginUrl;
};

/**
 * Higher-order component that adds authentication protection to a page component
 * @param {React.Component} WrappedComponent - The component to protect
 * @param {Object} options - Configuration options
 * @param {boolean} options.requireAuth - Whether authentication is required (default: true)
 * @param {string} options.redirectPath - Path to redirect unauthorized users (default: CAS login)
 * @returns {React.Component} - Protected component
 */
export const withAuth = (WrappedComponent, options = {}) => {
    const { requireAuth = true } = options;

    return function AuthenticatedComponent(props) {
        const [authChecked, setAuthChecked] = React.useState(false);
        const [authenticated, setAuthenticated] = React.useState(false);

        React.useEffect(() => {
            if (requireAuth) {
                const userIsAuthenticated = isAuthenticated();
                setAuthenticated(userIsAuthenticated);

                if (!userIsAuthenticated) {
                    // Redirect to CAS login with current page as next URL
                    redirectToCASLogin();
                    return;
                }
            }
            setAuthChecked(true);
        }, []);

        // Show loading state while checking authentication
        if (requireAuth && !authChecked) {
            return (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    fontFamily: 'Montserrat, sans-serif'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <h2>Loading...</h2>
                        <p>Checking authentication...</p>
                    </div>
                </div>
            );
        }

        // If authentication is required but user is not authenticated, don't render
        if (requireAuth && !authenticated) {
            return null;
        }

        // Render the wrapped component
        return <WrappedComponent {...props} />;
    };
};

/**
 * React hook for authentication status
 * @returns {Object} - Authentication status and utility functions
 */
export const useAuth = () => {
    const [authenticated, setAuthenticated] = React.useState(false);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const checkAuth = () => {
            const userIsAuthenticated = isAuthenticated();
            setAuthenticated(userIsAuthenticated);
            setLoading(false);
        };

        checkAuth();

        // Listen for storage events to detect login/logout in other tabs
        const handleStorageChange = () => {
            checkAuth();
        };

        window.addEventListener('storage', handleStorageChange);

        // Check periodically in case cookies change
        const interval = setInterval(checkAuth, 5000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    return {
        authenticated,
        loading,
        login: redirectToCASLogin,
        logout: () => {
            document.cookie = 'Authorization_YearBook=; max-age=0; path=/;';
            setAuthenticated(false);
            window.location.href = '/';
        }
    };
};
