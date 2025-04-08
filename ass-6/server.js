/********************************************************************************
* WEB322 – Assignment 04
*
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
*
* https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
*
* Name: Yogiraj Mehta Student ID: 162867238  Date: 10-03-2025
*
********************************************************************************/

const express = require('express');
const path = require('path'); // Import path module to handle file paths
const projectData = require("./modules/projects");

const authData = require('./modules/auth-service');

const clientSessions = require("client-sessions");
const mongoose = require('mongoose');
const HTTP_PORT = process.env.PORT || 3000;

const app = express();

// Serve static files from the 'public' folder
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
const { getAllSectors, addProject } = require("./modules/projects");

app.use(clientSessions({
    cookieName: "session", // The name of the session object
    secret: "mySuperSecretKey123", // Secret key to encrypt session data
    duration: 24 * 60 * 60 * 1000, // 24 hours (how long session lasts)
    activeDuration: 1000 * 60 * 5 // Extend session by 5 minutes on activity
}));

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// Initialize database connection
async function initializeDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Database connected successfully!');
        await authData.initialize(); // Initialize authentication data (models)
    } catch (error) {
        console.error('Error connecting to the database:', error);
        throw error; // Throw error to halt the server start
    }
}

// Ensure user is logged in before accessing certain routes
function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}

// Start the server once database is initialized
initializeDatabase()
    .then(() => {
        app.listen(HTTP_PORT, () => {
            console.log(`Server running on port ${HTTP_PORT}`);
        });
    })
    .catch((err) => {
        console.error("Unable to start server:", err);
    });

// Routes
app.get('/', (req, res) => res.render('home', { page: '/' }));

app.get('/about', (req, res) => res.render('about', { page: '/about' }));

app.get('/solutions/projects', async (req, res) => {
    const sector = req.query.sector;
    if (sector) {
        try {
            const projects = await projectData.getProjectsBySector(sector);
            res.render('projects', { projects: projects });
        } catch (error) {
            res.status(404).render('404', { message: `No projects found for sector: ${sector}` });
        }
    } else {
        try {
            const projects = await projectData.getAllProjects();
            if (projects.length === 0) {
                return res.status(404).render('404', { message: "No projects available at the moment." });
            }
            res.render('projects', { projects: projects });
        } catch (error) {
            res.status(404).render('404', { message: "Error fetching projects." });
        }
    }
});

app.get('/solutions/projects/:id', async (req, res) => {
    const projectId = parseInt(req.params.id);
    try {
        const project = await projectData.getProjectById(projectId);
        res.render('project', { project: project });
    } catch (error) {
        res.status(404).render('404', { message: `Project with ID ${projectId} not found.` });
    }
});

app.get("/solutions/addProject", ensureLogin, async (req, res) => {
    try {
        const sectorData = await getAllSectors();
        res.render("addProject", { sectors: sectorData });
    } catch (err) {
        res.render("500", { message: `Error fetching sectors: ${err.message}` });
    }
});

app.post("/solutions/addProject", ensureLogin, async (req, res) => {
    try {
        await addProject(req.body);
        res.redirect("/solutions/projects");
    } catch (err) {
        res.render("500", { message: `Error adding project: ${err.message}` });
    }
});

app.get("/solutions/editProject/:id", ensureLogin, async (req, res) => {
    const projectId = parseInt(req.params.id);
    try {
        const [projectData, sectorData] = await Promise.all([
            projectData.getProjectById(projectId),
            projectData.getAllSectors()
        ]);
        if (projectData) {
            res.render("editProject", { sectors: sectorData, project: projectData });
        } else {
            res.status(404).render("404", { message: "Project not found!" });
        }
    } catch (err) {
        res.status(404).render("404", { message: "Error fetching project or sectors." });
    }
});

app.post("/solutions/editProject", ensureLogin, async (req, res) => {
    const { id, title, feature_img_url, summary_short, intro_short, impact, original_source_url, sector_id } = req.body;
    const projectDataToUpdate = { title, feature_img_url, summary_short, intro_short, impact, original_source_url, sector_id };
    try {
        await projectData.editProject(parseInt(id), projectDataToUpdate);
        res.redirect("/solutions/projects");
    } catch (err) {
        res.render("500", { message: `Error editing project: ${err}` });
    }
});

app.get('/solutions/deleteProject/:id', ensureLogin, async (req, res) => {
    const projectId = req.params.id;
    try {
        await projectData.deleteProject(projectId);
        res.redirect('/solutions/projects');
    } catch (err) {
        res.render('500', { message: `Error deleting project: ${err}` });
    }
});

// Authentication Routes
app.get("/login", (req, res) => {
    res.render("login", { errorMessage: "", userName: "" });
});

app.get("/register", (req, res) => {
    res.render("register", { errorMessage: "", successMessage: "", userName: "" });
});

app.post("/register", async (req, res) => {
    try {
        await authData.registerUser(req.body);
        res.render("register", { errorMessage: "", successMessage: "User created", userName: "" });
    } catch (err) {
        res.render("register", { errorMessage: err, successMessage: "", userName: req.body.userName });
    }
});

app.post("/login", (req, res) => {
    req.body.userAgent = req.get("User-Agent");
    authData.checkUser(req.body)
        .then((user) => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory
            };
            res.redirect("/solutions/projects");
        })
        .catch((err) => {
            res.render("login", { errorMessage: err, userName: req.body.userName });
        });
});

app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
    res.render("userHistory");
});

// Custom 404 error route
app.use((req, res) => {
    res.status(404).render("404", { message: "I'm sorry, we're unable to find what you're looking for." });
});

module.exports = app;
