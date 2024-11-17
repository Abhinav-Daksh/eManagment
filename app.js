import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import expressLayots from 'express-ejs-layouts';
import mongoose from 'mongoose'; 
import routeHome from './routes/home.js';
import routeLogin from './routes/login.js';
import routeDashboard from './routes/dashboard.js';
import flash from 'connect-flash';
import MongoStore from 'connect-mongo';
import session from 'express-session';
import Razorpay from 'razorpay';
const app = express();
import passport from 'passport';

import configPass from './config/passport.js';
configPass(passport);

// //razorpay 
// const razorpay = new Razorpay({
//   key_id:process.env.razorpayKeyId,
//   key_secret:process.env.razorpayKeySecret,
// });

//db config 
const mongoUri = process.env.mongoURI;

//connect mongo
mongoose.connect(mongoUri)
.then(()=> console.log('Database connected'))
.catch(err => console.log(err));

//ejs
app.use(expressLayots);
app.set('view engine','ejs');
app.set('layout','layout');
app.use(express.static('public'));

//Body parse
app.use(express.urlencoded({extended:false}));



app.use(session({
  secret: 'secret',
  resave: false, // Prevents resaving the session if nothing changed
  saveUninitialized: false, // Avoid creating sessions for unauthenticated users
  store: MongoStore.create({ mongoUrl: mongoUri }), // Ensure sessions are stored in MongoDB
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Set to true only in production (HTTPS)
    httpOnly: true, // Prevents client-side access to cookies
    maxAge: 24 * 60 * 60 * 1000, // 1 day expiration
  }
}));


app.use(passport.initialize());
app.use(passport.session());
 
//connect flash
app.use(flash());

//Global Variables
 app.use((req,res,next)=>{
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.warn_msg = req.flash('warn_msg');
  next();
 });



//routes 

app.use('/',routeHome);
app.use('/login',routeLogin);
app.use('/dashboard',routeDashboard);


//server starter
const PORT = process.env.PORT || 1818;
app.listen(PORT , ()=>{
    console.log('server started on ',PORT);
});