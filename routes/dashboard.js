import express from "express";
import mongoose from "mongoose";
import Event from "../models/events.js";
import Ticket from "../models/tickets.js";
import Tasks from "../models/tasks.js";
import { ensureAuthenticated } from "../config/auth.js";

const router = express.Router();

// Helper function to fetch tasks
async function fetchTasks(eventId) {
    try {
        return await Tasks.find({ eId: eventId }) || [];
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
    }
}

// Route: Dashboard Home
router.get("/home", ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id;
        const currentDate = new Date();
        const events = await Event.find({ user: userId, date: { $gte: currentDate } });

        res.render("dashboard", {
            layout: "dashboard-layout.ejs",
            cssFile: "dashboard.css",
            user: req.user,
            E: events,
            eventLength: events.length,
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(502).send("Service Unavailable");
    }
});

// Route: All Events
router.get("/AllEvents", ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id;
        const events = await Event.find({ user: userId });
        
        res.render("dash-events", {
            layout: "dashboard-layout.ejs",
            cssFile: "dashboard.css",
            E: events,
        });
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(502).send("Internal Server Error");
    }
});

// Route: View a Single Event
router.get("/AllEvents/:id", ensureAuthenticated, async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId);
        
        if (!event) {
            return res.status(404).send("Event doesn't exist anymore");
        }

        const tasks = await fetchTasks(eventId);

        res.render("viewEvent", {
            layout: "dashboard-layout.ejs",
            cssFile: "dashboard.css",
            E: event,
            T: tasks,
        });
    } catch (error) {
        console.error("Error fetching event:", error);
        res.status(502).send("Internal Server Error");
    }
});

// Route: Logout
router.get("/logOut", ensureAuthenticated, (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).send("Error logging out");
        req.session.destroy((sessionErr) => {
            if (sessionErr) return res.status(500).send("Error clearing session");
            res.redirect("/login");
        });
    });
});

// Route: Delete Event
router.get("/allEvents/delete/:id", ensureAuthenticated, async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId);

        if (!event) {
            req.flash("error_msg", "Event not found");
            return res.redirect("/dashboard/AllEvents");
        }

        if (event.publish) {
            await Ticket.deleteOne({ eId: eventId });
        }
        
        await Event.deleteOne({ _id: eventId });
        await Tasks.deleteMany({ eId: eventId });

        req.flash("success_msg", "Event deleted successfully");
        res.redirect("/dashboard/AllEvents");
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(502).send("Internal Server Error");
    }
});

// Route: New Event Form
router.get("/newEvent", ensureAuthenticated, (req, res) => {
    res.render("new-Event", {
        layout: "layout.ejs",
        cssFile: "newEvent.css",
        title: "Create New Event",
        user: req.user,
    });
});

// Route: Create New Event
router.post("/newEvent", ensureAuthenticated, async (req, res) => {
    try {
        const { title, date, city, venue, access } = req.body;
        const userId = req.user._id;
        
        const newEvent = new Event({ title, date, user: userId, city, venue, access });
        await newEvent.save();

        req.flash("success_msg", "New event created successfully");
        res.redirect("/dashboard/AllEvents");
    } catch (error) {
        console.error("Error creating new event:", error);
        res.status(500).send("Server Error");
    }
});

// Route: Marketing Page
router.get("/marketing", ensureAuthenticated, async (req, res) => {
    try {
        const events = await Event.find({ access: "Public" });
        
        res.render("dash-marketing", {
            layout: "dashboard-layout.ejs",
            cssFile: "dashboard.css",
            E: events,
        });
    } catch (error) {
        console.error("Error fetching marketing events:", error);
        res.status(502).send("Internal Server Error");
    }
});

// Route: Ticket Form for Event Publishing
router.get("/marketing/:id", ensureAuthenticated, (req, res) => {
    const eventId = req.params.id;
    res.render("ticketForm", {
        layout: "layout.ejs",
        cssFile: "newEvent.css",
        title: "Publish your Event",
        eventId,
    });
});

// Route: Publish Ticket
router.post("/marketing", ensureAuthenticated, async (req, res) => {
    try {
        const { Limit, Price, Validity, eventId } = req.body;

        const newTicket = new Ticket({ limit: Limit, price: Price, validity: Validity, eId: eventId });
        await newTicket.save();
        
        await Event.updateOne({ _id: eventId }, { $set: { publish: true } });
        
        req.flash("success_msg", "Ticket published successfully");
        res.redirect("/dashboard/marketing");
    } catch (error) {
        console.error("Error publishing ticket:", error);
        res.status(500).send("Server Error");
    }
});

// Route: Add Task to Event
router.post("/allEvents/task/:id", ensureAuthenticated, async (req, res) => {
    try {
        const eventId = req.params.id;
        const { task } = req.body;

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).send("Event doesn't exist anymore");
        }

        const newTask = new Tasks({ task, eId: eventId });
        await newTask.save();

        res.redirect(`/dashboard/AllEvents/${eventId}`);
    } catch (error) {
        console.error("Error adding task:", error);
        res.status(502).send("Internal Server Error");
    }
});

// Route: Delete Task
router.get("/allEvents/del/:id/:eId", ensureAuthenticated, async (req, res) => {
    try {
        const { id: taskId, eId: eventId } = req.params;
        
        await Tasks.deleteOne({ _id: taskId });
        req.flash("warn_msg", "Task removed successfully");

        res.redirect(`/dashboard/AllEvents/${eventId}`);
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(502).send("Internal Server Error");
    }
});

export default router;
