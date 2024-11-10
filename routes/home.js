import express from 'express';
const router = express.Router();
import Ticket from '../models/tickets.js';

//home page
router.get('/',(req,res)=>{
    res.render('home',{title:'ShowTime-home',cssFile: 'home.css'});
});
router.get('/shows',async(req,res)=>{
    try{
        const allTickets = await Ticket.find();
        if(allTickets){
            res.render('home-shows',{title:'Explore-shows',cssFile:'home-shows.css',T:allTickets});
        }else{
            res.render('home-shows',{title:'Explore shows',cssFile:'home-shows.css'});
        }
    }catch (err){
        console.error(err);
        res.status(502).send('Internal Server Error');
    }
});

export default router;