// ../config/auth.js
export const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error_msg', "That Stuff doesn't Belong To You, Until you are Logged In.");
    res.redirect('/login');
};
