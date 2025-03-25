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
const app = express();

app.use(express.static(__dirname+'/public')); // Serve static files from 'public' folder
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs'); 

app.use(express.urlencoded({ extended: true }));
// Import getAllSectors and addProject from projects.js
const { getAllSectors, addProject } = require("./modules/projects");

projectData.initialize()
    .then(() => {
        console.log("Projects initialized successfully!");
        startServer(); 
    })
    .catch(error => {
        console.log("Failed to initialize projects:", error);
    });

function startServer() {
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
                res.status(404).render('404', { message:`No projects found for sector: ${sector}`});
            });
    } else {
        projectData.getAllProjects()
        .then(projects => {
            if (projects.length === 0) {
                return res.status(404).render('404', { message: "No projects available at the moment." });
            }
            res.render('projects', { projects: projects }); // Render all projects
        });
    }
});

    
    // GET "/solutions/projects/:id"
app.get('/solutions/projects/:id', (req, res) => {
    const projectId = parseInt(req.params.id); // Get the project ID from the URL

    projectData.getProjectById(projectId)
        .then(project => {
            res.render('project', { project: project }); // Render the project details
        })
        .catch(error => {
            res.status(404).render('404', { message:`Project with ID ${projectId} not found.`});
        });
});


// GET "/solutions/addProject" - Render the form
app.get("/solutions/addProject", async (req, res) => {
    try {
        const sectorData = await getAllSectors(); // Fetch all sectors
        console.log("Sectors fetched:", sectorData); // Log fetched sectors
        res.render("addProject", { sectors: sectorData });
    } catch (err) {
        console.error("Error fetching sectors:", err); // Log error details
        res.render("500", { message: `Error fetching sectors: ${err.message}` });
    }
});

// POST "/solutions/addProject" - Handle form submission
app.post("/solutions/addProject", async (req, res) => {
    try {
        await addProject(req.body); // Add project using form data
        res.redirect("/solutions/projects"); // Redirect to project list
    } catch (err) {
        res.render("500", { message: `Error adding project: ${err.message}` });
    }
});

app.get("/solutions/editProject/:id", (req, res) => {
    const projectId = parseInt(req.params.id);

    // Fetch project data and sector data
    Promise.all([projectData.getProjectById(projectId), projectData.getAllSectors()])  // <-- Fix this line
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
app.post("/solutions/editProject", (req, res) => {
    const { id, title, feature_img_url, summary_short, intro_short, impact, original_source_url, sector_id } = req.body;
    const projectDataToUpdate = { title, feature_img_url, summary_short, intro_short, impact, original_source_url, sector_id };

    projectData.editProject(parseInt(id), projectDataToUpdate)  // <-- Correct way of using editProject
        .then(() => {
            res.redirect("/solutions/projects");
        })
        .catch(err => {
            res.render("500", { message: `Error editing project: ${err}` });
        });
});

// DELETE Project Route
app.get('/solutions/deleteProject/:id', (req, res) => {
    const projectId = req.params.id; // Get project ID from the URL parameter

    projectData.deleteProject(projectId)  // <-- This should be projectData.deleteProject
        .then(() => {
            res.redirect('/solutions/projects'); // Redirect to the projects page after deletion
        })
        .catch((err) => {
            res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` }); // Error handling
        });
});

    // Custom 404 error route
    app.use((req, res) => {
        res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for.", page: "/404" });
    });


    // Start the server
    app.listen(3000, () => {
        console.log("Server is running on http://localhost:3000");
    });
}
