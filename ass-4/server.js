/********************************************************************************
* WEB322 – Assignment 03
*
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
*
* https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
*
* Name: Yogiraj Mehta Student ID: 162867238  Date: 14-02-2025
*
********************************************************************************/

const express = require('express');
const path = require('path'); // Import path module to handle file paths
const projectData = require("./modules/projects");
const app = express();

app.use(express.static(__dirname+'/public')); // Serve static files from 'public' folder
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs'); 

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



    // Custom 404 error route
    app.use((req, res) => {
        res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for.", page: "/404" });
    });


    // Start the server
    app.listen(3000, () => {
        console.log("Server is running on http://localhost:3000");
    });
}
