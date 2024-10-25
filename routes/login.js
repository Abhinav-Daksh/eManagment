import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/Users.js';
import Passport  from 'passport';

const router = express.Router();

// Render home login page
router.get('/', (req, res) => {
    res.render('login', { title: 'showTime-Login', cssFile: 'login.css' });
});

// Render register page
router.get('/register', (req, res) => {
    res.render('register', { title: 'showTime-Register', cssFile: 'register.css' });
});

// Register handle
router.post('/register', async (req, res) => {
    const { name, email, password, password2 } = req.body;
    let errors = [];

    // Check if any field is empty
    if (!name || !email || !password || !password2) {
        errors.push({ msg: "Please fill all fields" });
    }

    // Check if password is not equal to confirm password
    if (password !== password2) {
        errors.push({ msg: "Confirm password should be the same as Password" });
    }

    // Check if password is at least 6 characters long
    if (password.length < 6 && password.length > 0) {
        errors.push({ msg: "Password should be at least 6 characters" });
    }

    // Check if there are any errors
    if (errors.length > 0) {
        errors.forEach(error => req.flash('error_msg', error.msg));
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
        // Check if user already exists
        const user = await User.findOne({ email });
        if (user) {
            errors.push({ msg: 'Email already registered, try to login' });
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

        // Hash password
        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(newUser.password, salt);

        // Save the user
        await newUser.save();
        req.flash('success_msg','You are Now Registered, Can Login..');
        res.redirect('/login');

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});


//login handle 
router.post('/',(req,res,next)=>{
    Passport.authenticate('local',{
        successRedirect :'/dashboard/home',
        failureRedirect:'/login',
        failureFlash:true
    })(req,res,next);                                                                                                                                     
});

export default router;
