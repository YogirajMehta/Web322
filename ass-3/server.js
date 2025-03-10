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
        res.sendFile(path.join(__dirname, 'views', 'home.html')); 
    });

    // GET "/about"
    app.get('/about', (req, res) => {
        res.sendFile(path.join(__dirname, 'views', 'about.html')); 
    });

    // GET "/solutions/projects"
    app.get('/solutions/projects', (req, res) => {
        const sector = req.query.sector; 

        if (sector) {
            projectData.getProjectsBySector(sector)
                .then(projects => {
                    res.json(projects);
                })
                .catch(error => {
                    res.status(404).send("Error: " + error);
                });
        } else {
            projectData.getAllProjects()
                .then(projects => {
                    res.json(projects);
                })
                .catch(error => {
                    res.status(404).send("Error: " + error);
                });
        }
    });

    
    app.get('/solutions/projects/:id', (req, res) => {
        const projectId = parseInt(req.params.id); 

        projectData.getProjectById(projectId)
            .then(project => {
                res.json(project);
            })
            .catch(error => {
                res.status(404).send("Error: " + error);
            });
    });

    // DELETE "/solutions/projects/sector-demo" 

    
    app.use((req, res) => {
        res.status(404).sendFile(path.join(__dirname, 'views', '404.html')); 
    });


    // Start the server
    app.listen(3000, () => {
        console.log("Server is running on http://localhost:3000");
    });
}
