import Event from "../models/events.js";
import Ticket from "../models/tickets.js";
import Tasks from "../models/tasks.js";
import express from "express";
import mongoose from 'mongoose';
import { ensureAuthenticated } from "../config/auth.js";

const router = express.Router();

// Route for dashboard home

router.get("/home", ensureAuthenticated, async (req, res) => {
    try {
        let e = [];
        let userId = req.user._id;
        const currentDate = new Date();
        await Event.find({ user: userId, date: { $gte: currentDate } })
            .then(events => {
                e = events;
            })
            .catch(err => {
                console.error('Error fetching events:', err);
            });
        res.render("dashboard", {
            layout: "dashboard-layout.ejs",
            cssFile: "dashboard.css",
            user: req.user,
            E: e,
            eventLength: e.length,
        });

    } catch (error) {
        if (error) {
            console.log(error);
            res.send("Service Unavailable (502)");
        }
    }
});

//route for the events section

router.get("/AllEvents", ensureAuthenticated, async (req, res) => {
    try {
        let e = [];
        let userId = req.user._id;
        await Event.find({ user: userId })
            .then(events => {
                e = events;
            })
            .catch(err => {
                console.error('Error fetching events:', err);
            });
        res.render("dash-events", {
            layout: "dashboard-layout.ejs",
            cssFile: "dashboard.css",
            E: e,
        });

    } catch (error) {
        if (error) {
            console.log(error);
            res.send("Internal Server Error , 502");
            res.render('/login');
        }
    }
});

// route for viewing an event  

router.get('/AllEvents/:id', ensureAuthenticated, async (req, res) => {
    try {
        const eventId = req.params.id;
        await Event.findById(eventId)
            .then(async event => {
                const allTasks = await fetchTasks(eventId);
                res.render('viewEvent', {
                    layout: "dashboard-layout.ejs",
                    cssFile: "dashboard.css",
                    E: event,
                    T:allTasks,
                });
            })
            .catch(er => {
                res.send("Event doesn't Exist Anymore");
            })
    }
    catch (err) {
        if (err) {
            console.log(error);
            res.send("Internal Server Error , 502");
            res.render('AllEvents');
        }
    }
});

// route for logout 
router.get("/logOut", ensureAuthenticated, (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).send(err);
        }
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.render("/dashboard/", { layout: "layout.ejs", cssFile: "home.css", title: 'ShowTime-HOME' });
        });
    });
});

// deleting event
router.get('/allEvents/delete/:id', ensureAuthenticated, async (req, res) => {
    const event = req.params.id;
    const e = await Event.findById(event);
    if(e && e.publish == true){
        await Ticket.deleteOne({eId: event});
    }
    await Event.deleteOne({ _id: event });
    await Tasks.deleteMany({eId:event});
    req.flash('success_msg', 'Event Deleted Successfully');
    res.redirect('/dashboard/AllEvents');
});

//new Event for user
router.get("/newEvent", ensureAuthenticated, (req, res) => {
    res.render("new-Event", {
        layout: "layout.ejs",
        cssFile: "newEvent.css",
        title: "Create New Event",
        user: req.user,
    });
});

// post request for new Event

router.post("/newEvent",ensureAuthenticated, async (req, res) => {
    try {
        const { title, date, city, venue, access } = req.body;
        const user = req.user._id;
        const newEvent = new Event({
            title,
            date,
            user,
            city,
            venue,
            access,
        });
        await newEvent.save();
        req.flash('success_msg','New Event Created');
        res.redirect("/dashboard/AllEvents");
    } catch (error) {
        console.log("error in creating event", error);
        res.status(500).send("server Errro");
    }
});


//route for marketing page

router.get('/marketing', ensureAuthenticated, async (req, res) => {
    try {
        let e = [];
        await Event.find({ access: 'Public' })
            .then(events => {
                e = events;
            })
            .catch(err => {
                console.error('Error fetching events:', err);
            });
        res.render("dash-marketing", {
            layout: "dashboard-layout.ejs",
            cssFile: "dashboard.css",
            E: e,
        });

    } catch (error) {
        if (error) {
            console.log(error);
            res.send("Internal Server Error , 502");
        }
    }
});

//route for ticket form in market section

router.get('/marketing/:id',ensureAuthenticated, (req, res) => {
    const eventId = req.params.id;
    res.render("ticketForm", {
        layout: "layout.ejs",
        cssFile: "newEvent.css",
        title: "Publish your Event",
        eventId: eventId,
    });
});

//router for publishing ticket in market section

router.post('/marketing',ensureAuthenticated,async (req, res) => {
    const { Limit, Price, Validity, eventId } = req.body;
    try {
        const newTicket = new Ticket({
            limit: Limit,
            price: Price,
            validity: Validity,
            eId: eventId,
        });
        await newTicket.save();
        await Event.updateOne({_id:eventId},{$set:{publish:true}});
        req.flash('success_msg','Ticket Published.')
        res.redirect('/dashboard/marketing');

    }
    catch(err) {
        console.log(err);
        res.status(500).send('Server Error');
    }
});

//router for storing tasks in database

router.post('/allEvents/task/:id',ensureAuthenticated, async (req,res)=>{
        let eventID = req.params.id;
        const todo = req.body.task;
        try {
            await Event.findById(eventID)
                .then(async event => {
                    const newTask = new Tasks({
                        task:todo,
                        eId:eventID
                    });
                    await newTask.save();
                    res.redirect(`/dashboard/allEvents/${eventID}`);
                })
                .catch(er => {
                    res.send("Event doesn't Exist Anymore");
                })
        }
        catch (err) {
            if (err) {
                console.log(error);
                res.send("Internal Server Error , 502");
                res.render('AllEvents');
            }
        }
});

// router for deleting a task 

router.get('/allEvents/del/:id/:eId',ensureAuthenticated,async (req,res)=>{
    const eventId = req.params['eId'];
    const taskId = req.params['id'];
    await Tasks.deleteOne({"_id":taskId});
   req.flash('warn_msg','Task Removed');
    res.redirect(`/dashboard/AllEvents/${eventId}`);
});



//function for fetching tasks 

async function fetchTasks(eventid){
    try{
        const all =  await Tasks.find({eId:eventid});
        return all || [];
    }
    catch(err){
        return [];
    }
}


export default router;
