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
const HTTP_PORT = process.env.PORT || 3000;

const app = express();

app.use(express.static(__dirname + '/public')); // Serve static files from 'public' folder
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs'); 

app.use(express.urlencoded({ extended: true }));

// Import getAllSectors and addProject from projects.js
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

projectData.initialize()
.then(authData.initialize)
.then(function() {
    // Start the server
    app.listen(HTTP_PORT, () => {
        console.log(`Server running on port ${HTTP_PORT}`);
    });
})
.catch(function(err) {
    console.log(`Unable to start server: ${err}`);
});

function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect("/login"); // Redirect to login if user is not logged in
    } else {
        next(); // Continue to the requested route
    }
}

// GET "/"
app.get('/', (req, res) => {
    res.render('home', { page: '/' }); 
});

// GET "/about"
app.get('/about', (req, res) => {
    res.render('about', { page: '/about' }); 
});

// GET "/solutions/projects"
app.get('/solutions/projects', (req, res) => {
    const sector = req.query.sector; // Get sector from query params

    if (sector) {
        projectData.getProjectsBySector(sector)
            .then(projects => {
                res.render('projects', { projects: projects }); // Render the projects
            })
            .catch(error => {
                res.status(404).render('404', { message: `No projects found for sector: ${sector}` });
            });
    } else {
        projectData.getAllProjects()
            .then(projects => {
                if (projects.length === 0) {
                    return res.status(404).render('404', { message: "No projects available at the moment." });
                }
                res.render('projects', { projects: projects }); // Render all projects
            })
            .catch(err => {
                res.status(500).render('500', { message: `Error fetching projects: ${err.message}` });
            });
    }
});

// GET "/solutions/projects/:id"
app.get('/solutions/projects/:id', (req, res) => {
    const projectId = parseInt(req.params.id); // Get the project ID from the URL

    if (isNaN(projectId)) {
        return res.status(404).render('404', { message: 'Invalid project ID' });
    }

    projectData.getProjectById(projectId)
        .then(project => {
            res.render('project', { project: project }); // Render the project details
        })
        .catch(error => {
            res.status(404).render('404', { message: `Project with ID ${projectId} not found.` });
        });
});

// GET "/solutions/addProject" - Render the form
app.get("/solutions/addProject", ensureLogin, async (req, res) => {
    try {
        const sectorData = await getAllSectors(); // Fetch all sectors
        res.render("addProject", { sectors: sectorData });
    } catch (err) {
        console.error("Error fetching sectors:", err);
        res.render("500", { message: `Error fetching sectors: ${err.message}` });
    }
});

// POST "/solutions/addProject" - Handle form submission
app.post("/solutions/addProject", ensureLogin, async (req, res) => {
    try {
        await addProject(req.body); // Add project using form data
        res.redirect("/solutions/projects"); // Redirect to project list
    } catch (err) {
        res.render("500", { message: `Error adding project: ${err.message}` });
    }
});

// GET "/solutions/editProject/:id"
app.get("/solutions/editProject/:id", ensureLogin, (req, res) => {
    const projectId = parseInt(req.params.id);

    Promise.all([projectData.getProjectById(projectId), projectData.getAllSectors()])
        .then(([projectData, sectorData]) => {
            if (projectData) {
                res.render("editProject", { sectors: sectorData, project: projectData });
            } else {
                res.status(404).render("404", { message: "Project not found!" });
            }
        })
        .catch(err => {
            res.status(404).render("404", { message: "Error fetching project or sectors." });
        });
});

// POST "/solutions/editProject"
app.post("/solutions/editProject", ensureLogin, (req, res) => {
    const { id, title, feature_img_url, summary_short, intro_short, impact, original_source_url, sector_id } = req.body;
    const projectDataToUpdate = { title, feature_img_url, summary_short, intro_short, impact, original_source_url, sector_id };

    projectData.editProject(parseInt(id), projectDataToUpdate)
        .then(() => {
            res.redirect("/solutions/projects");
        })
        .catch(err => {
            res.render("500", { message: `Error editing project: ${err}` });
        });
});

// DELETE Project Route
app.get('/solutions/deleteProject/:id', ensureLogin, (req, res) => {
    const projectId = req.params.id;

    projectData.deleteProject(projectId)
        .then(() => {
            res.redirect('/solutions/projects'); // Redirect to the projects page after deletion
        })
        .catch((err) => {
            res.render('500', { message: `Error deleting project: ${err}` }); // Error handling
        });
});

app.get("/login", (req, res) => {
    res.render("login", { errorMessage: "", userName: "" });
});

app.get("/register", (req, res) => {
    res.render("register", { errorMessage: "", successMessage: "", userName: "" });
});

app.post("/register", (req, res) => {
    authData.registerUser(req.body)
        .then(() => {
            res.render("register", {
                errorMessage: "",
                successMessage: "User created",
                userName: ""
            });
        })
        .catch((err) => {
            res.render("register", {
                errorMessage: err,
                successMessage: "",
                userName: req.body.userName
            });
        });
});

app.post("/login", (req, res) => {
    req.body.userAgent = req.get("User-Agent"); // Store user agent

    authData.checkUser(req.body)
        .then((user) => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory
            };
            res.redirect("/solutions/projects"); // Redirect to dashboard
        })
        .catch((err) => {
            res.render("login", {
                errorMessage: err,
                userName: req.body.userName
            });
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
    res.status(404).render("404", { message: "I'm sorry, we're unable to find what you're looking for.", page: "/404" });
});

module.exports = app;
