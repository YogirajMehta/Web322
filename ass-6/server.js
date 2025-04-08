const express = require('express');
const path = require('path'); 
const projectData = require("./modules/projects");

const authData = require('./modules/auth-service');
const clientSessions = require("client-sessions");
const HTTP_PORT = process.env.PORT || 3000;

const app = express();

app.use(express.static(__dirname+'/public')); 
app.set('views', path.join(__dirname, 'views')); 
app.set('view engine', 'ejs'); 

app.use(express.urlencoded({ extended: true }));

const { getAllSectors, addProject } = require("./modules/projects");

app.use(clientSessions({
    cookieName: "session",
    secret: process.env.SESSION_SECRET || "defaultSecretKey", // Vercel should use env var for secret
    duration: 24 * 60 * 60 * 1000,
    activeDuration: 1000 * 60 * 5
}));

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

projectData.initialize()
    .then(authData.initialize)
    .then(() => {
        app.listen(HTTP_PORT, () => {
            console.log(`Server running on port ${HTTP_PORT}`);
        });
    })
    .catch((err) => {
        console.log(`Unable to start server: ${err}`);
    });

function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}

app.get('/', (req, res) => {
    res.render('home', { page: '/' }); 
});

app.get('/about', (req, res) => {
    res.render('about', { page: '/about' }); 
});

// Add routes as in your provided server.js...

// Your routes remain the same, ensure they are in place ("/", "/solutions/projects", etc.)

// Custom 404 error route
app.use((req, res) => {
    res.status(404).render("404", { message: "Page not found." });
});
module.exports = app;
