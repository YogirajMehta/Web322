const projectData = require("../data/projectData");
const sectorData = require("../data/sectorData");

let projects = [];

// Initialize function to populate the projects array
function initialize() {
    return new Promise((resolve, reject) => {
        try {
            projects = projectData.map(project => {
                const sector = sectorData.find(s => s.id === project.sector_id);
                return { ...project, sector: sector ? sector.sector_name : "Unknown" };
            });
            resolve(); // Resolve once the initialization is complete
        } catch (error) {
            reject("Failed to initialize projects: " + error.message); // Reject if an error occurs
        }
    });
}

// Get all projects
function getAllProjects() {
    return new Promise((resolve, reject) => {
        if (projects.length === 0) {
            reject("No projects available.");
        } else {
            resolve(projects); // Resolve with the projects array
        }
    });
}

// Get a project by ID
function getProjectById(projectId) {
    return new Promise((resolve, reject) => {
        const project = projects.find(project => project.id === projectId);
        if (project) {
            resolve(project); // Resolve with the found project
        } else {
            reject("Unable to find the requested project."); // Reject if project not found
        }
    });
}

// Get projects by sector (case-insensitive, partial match)
function getProjectsBySector(sector) {
    return new Promise((resolve, reject) => {
        const lowerCaseSector = sector.toLowerCase();
        const filteredProjects = projects.filter(project => project.sector.toLowerCase().includes(lowerCaseSector));
        if (filteredProjects.length > 0) {
            resolve(filteredProjects); // Resolve with the found projects
        } else {
            reject("Unable to find the requested projects."); // Reject if no matching projects
        }
    });
}

// Export functions to be used as a module
module.exports = { initialize, getAllProjects, getProjectById, getProjectsBySector };

// Testing the functions

initialize()
    .then(() => getAllProjects())
    .then(projects => console.log("All Projects:", projects))
    .catch(error => console.log("Error:", error));

initialize()
    .then(() => getProjectById(9))  // Example project ID
    .then(project => console.log("Project by ID:", project))
    .catch(error => console.log("Error:", error));

initialize()
    .then(() => getProjectsBySector("Electricity"))  // Example sector
    .then(projects => console.log("Projects by Sector:", projects))
    .catch(error => console.log("Error:", error));
