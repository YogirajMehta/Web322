/********************************************************************************
* WEB322 – Assignment 02
*
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
*
* https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
*
* Name: Yogiraj Mehta Student ID:162867238  Date:30-01-2025
*
********************************************************************************/

const express = require('express');
const projectData = require("./modules/projects");
const app = express();

projectData.initialize()
    .then(() => {
        console.log("Projects initialized successfully!");
        startServer(); // Proceed to start the server after initialization
    })
    .catch(error => {
        console.log("Failed to initialize projects:", error);
    });

function startServer() {
    // GET "/"
    app.get('/', (req, res) => {
        res.send('Assignment 2: Yogiraj Mehta - 162867238');
    });

    // GET "/solutions/projects"
    app.get('/solutions/projects', (req, res) => {
        projectData.getAllProjects()
            .then(projects => {
                res.json(projects); // Respond with the projects array in JSON format
            })
            .catch(error => {
                res.status(500).send("Error fetching projects: " + error);
            });
    });

    // GET "/solutions/projects/id-demo"
    app.get('/solutions/projects/id-demo', (req, res) => {
        projectData.getProjectById(9) // Replace `9` with an actual project ID
            .then(project => {
                res.json(project); // Respond with the project object
            })
            .catch(error => {
                res.status(404).send("Error: " + error);
            });
    });

    // GET "/solutions/projects/sector-demo"
    app.get('/solutions/projects/sector-demo', (req, res) => {
        projectData.getProjectsBySector("agriculture") // Replace `"agriculture"` with the sector name you want to search
            .then(projects => {
                res.json(projects); // Respond with the filtered projects
            })
            .catch(error => {
                res.status(404).send("Error: " + error);
            });
    });

    // Start the server
    app.listen(3000, () => {
        console.log("Server is running on http://localhost:3000");
    });
}
