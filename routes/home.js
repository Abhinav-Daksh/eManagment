import express from 'express';
const router = express.Router();
import {ensureAuthenticated } from '../config/auth.js';

//home page
router.get('/',(req,res)=>{
    res.render('home',{title:'ShowTime-home',cssFile: 'home.css'});
});
router.get('/shows',(req,res)=>{
    res.render('home-shows',{title:'Explore shows',cssFile:'home-shows.css'});
})

export default router;