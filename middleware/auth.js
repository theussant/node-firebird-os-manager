/**
 * Authentication Middleware
 * --------------------------------------------------------------------------
 * Protects private routes by verifying if a valid user session exists.
 * Skips authentication for public assets (images, css) and auth-related routes.
 */

module.exports = (req, res, next) => {
    // Define paths that do not require authentication
    // You can add public folders here (e.g., /css, /js, /public)
    const publicPaths = ['/auth', '/images', '/styles', '/css', '/js', '/favicon.ico'];

    // Check if the current URL starts with any public path
    const isPublicPath = publicPaths.some(path => req.originalUrl.startsWith(path));

    if (isPublicPath) {
        return next();
    }

    // Verify User Session
    if (req.session && req.session.user) {
        return next(); // User is authenticated, proceed.
    }

    // Unauthorized: Redirect to Login
    return res.redirect('/auth/login');
};