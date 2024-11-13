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
});

router.get('/order/:id',async (req,res)=>{
   try{
    const ticketId = req.params.id;
    const ticket = await Ticket.findById(ticketId);
    if(ticket != null){
        res.render('orderSumm',{
            layout:"buyLayout.ejs",
            Title:ticket.showName,
            details:ticket,
        });
    }else{
        res.status(404).send('Page Not fount');
    }

   }catch(err){
    res.status(502).send('Service Unavailable');
    console.log(err);
   }
});

router.post('/checkout/payment',(req,res)=>{
    console.log(req.body.totalAmount);
})

export default router;