require('dotenv').config(); 
const { Op } = require('sequelize');
const { Sequelize } = require('sequelize'); 
require('pg'); 

// set up sequelize to point to our postgres database
const sequelize = new Sequelize(process.env.PG_CONNECTION_STRING, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true, // This will help you connect to the database with SSL
      rejectUnauthorized: false, // Allows self-signed certificates
    },
  },
});

// Define the Sector model
const Sector = sequelize.define('Sector', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  sector_name: {
    type: Sequelize.STRING,
  },
}, {
  timestamps: false, // Disable createdAt & updatedAt fields
});

// Define the Project model
const Project = sequelize.define('Project', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: Sequelize.STRING,
  feature_img_url: Sequelize.STRING,
  summary_short: Sequelize.TEXT,
  intro_short: Sequelize.TEXT,
  impact: Sequelize.TEXT,
  original_source_url: Sequelize.STRING,
}, {
  timestamps: false, // Disable createdAt & updatedAt fields
});


Project.belongsTo(Sector, { foreignKey: 'sector_id' });


// Initialize function to populate the projects array
function initialize() {
    return sequelize.sync()
    .then(() => {
        return Promise.resolve(); // Resolve once the models are synced
    })
    .catch((error) => {
        return Promise.reject("Failed to initialize Sequelize: " + error.message); // Reject if an error occurs
    });
}

// Get all projects
function getAllProjects() {
    return Project.findAll({ 
        include: [Sector] // Include the Sector data
    })
    .then((projects) => projects)
    .catch(() => Promise.reject("Unable to retrieve projects"));
}

// Get a project by ID
function getProjectById(projectId) {
    return Project.findAll({
        where: { id: projectId },
        include: [Sector] // Include the Sector data
    })
    .then(projects => {
        if (projects.length === 0) {
            return Promise.reject("Unable to find the requested project.");
        } else {
            return Promise.resolve(projects[0]); // Resolve with the first element of the array (single project)
        }
    })
    .catch(error => {
        return Promise.reject("Error fetching the project: " + error.message);
    });
}

// Get projects by sector (case-insensitive, partial match)
function getProjectsBySector(sector) {
   return Project.findAll({
        include: [Sector],
        where: {
            '$Sector.sector_name$': {
                [Op.iLike]: `%${sector}%`
            }
        }
    })
    .then(projects => {
        if (projects.length === 0) {
            return Promise.reject("Unable to find the requested projects.");
        } else {
            return Promise.resolve(projects); // Resolve with the found projects
        }
    })
    .catch(error => {
        return Promise.reject("Error fetching projects by sector: " + error.message);
    });
}

// Get all sectors from the database
function getAllSectors() {
    return Sector.findAll()
        .then(sectors => sectors)
        .catch(() => Promise.reject("Unable to retrieve sectors"));
}

// Add a new project to the database
function addProject(projectData) {
    return Project.create(projectData)
        .then(() => Promise.resolve()) // Successfully added project
        .catch(err => Promise.reject(err.errors[0].message)); // Return first validation error
}

// Edit an existing project
function editProject(id, projectData) {
    return Project.update(projectData, {
        where: { id: id } // Update project with the provided ID
    })
    .then(([affectedCount]) => {
        if (affectedCount > 0) {
            return Promise.resolve();  // Successfully edited project
        } else {
            return Promise.reject("No project found with the given ID.");
        }
    })
    .catch(err => Promise.reject(err.errors ? err.errors[0].message : "Error editing project"));
}

function deleteProject(id) {
    return new Promise((resolve, reject) => {
        Project.destroy({
            where: { id: id } // Assuming `id` is the primary key
        })
        .then(() => resolve()) // Successfully deleted
        .catch((err) => reject(err.errors[0].message)); // If there's an error, reject with a human-readable error message
})}

// Export functions to be used as a module
module.exports = { initialize, getAllProjects, getProjectById, getProjectsBySector, getAllSectors, addProject, editProject, deleteProject };


