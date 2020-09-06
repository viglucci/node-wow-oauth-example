/**
 * Middleware 'gate' that will redirect to `/` if the request/user
 * is not authenticated.
 */
module.exports = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/');
    }
    next();
};
