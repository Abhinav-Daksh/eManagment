import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/Users.js';
import passport from 'passport';

const router = express.Router();

// Route: Render login page
router.get('/', (req, res) => {
    res.render('login', { title: 'showTime-Login', cssFile: 'login.css' });
});

// Route: Render registration page
router.get('/register', (req, res) => {
    res.render('register', { title: 'showTime-Register', cssFile: 'register.css' });
});

// Route: Register new user
router.post('/register', async (req, res) => {
    const { name, email, password, password2 } = req.body;
    let errors = [];

    // Validation checks
    if (!name || !email || !password || !password2) {
        errors.push({ msg: "Please fill all fields" });
    }
    if (password !== password2) {
        errors.push({ msg: "Confirm password should match the password" });
    }
    if (password.length < 6) {
        errors.push({ msg: "Password should be at least 6 characters" });
    }

    if (errors.length > 0) {
        return res.render('register', { 
            title: 'showTime-Register', 
            cssFile: 'register.css', 
            errors, 
            name, 
            email, 
            password, 
            password2 
        });
    }

    try {
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            errors.push({ msg: 'Email is already registered. Please login instead.' });
            return res.render('register', { 
                title: 'showTime-Register', 
                cssFile: 'register.css', 
                errors, 
                name, 
                email, 
                password, 
                password2 
            });
        }

        // Create a new user instance
        const newUser = new User({
            name,
            email,
            password
        });

        // Hash password and save user
        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(password, salt);
        await newUser.save();

        req.flash('success_msg', 'You are now registered and can log in');
        res.redirect('/login');
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).send('Server Error');
    }
});

// Route: Login handle
router.post('/verify', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard/home',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next);
});

export default router;
