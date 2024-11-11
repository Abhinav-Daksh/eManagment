import express from 'express';
const router = express.Router();
import Ticket from '../models/tickets.js';
router.use(express.json());
//home page
router.get('/',(req,res)=>{
    res.render('home',{title:'ShowTime-home',cssFile: 'home.css'});
});
router.get('/shows',async(req,res)=>{
    try{
        const allTickets = await Ticket.find();
        if(allTickets){
            res.render('home-shows',{title:'Explore-shows',cssFile:'home-shows.css',head:'All Shows',T:allTickets});
        }else{
            res.render('home-shows',{title:'Explore shows',cssFile:'home-shows.css'});
        }
    }catch (err){
        console.error(err);
        res.status(502).send('Internal Server Error');
    }
});
router.post('/find-show',async(req,res)=>{
    try{
        const {searchValue} = req.body;
        const searchedShows = await Ticket.find({showName:
            {$regex: new RegExp(searchValue, 'i')}
        });
        res.render('home-shows',{title:'Explore-shows',cssFile:'home-shows.css',head:`Searched results for '${searchValue}'`,T:searchedShows});
    }
    catch(err){
        console.log(err);
        res.status(502).send('Internal Server Error');
    }
    

})

export default router;