const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();
const Schema = mongoose.Schema;

const userSchema = new Schema({
    userName: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    loginHistory: [
        {
            dateTime: { type: Date, default: Date.now },
            userAgent: { type: String, required: true }
        }
    ]
});

let User;

// Function to initialize database connection
function initialize() {
    return new Promise((resolve, reject) => {
        let db = mongoose.createConnection(process.env.MONGODB);

        db.on('error', (err) => {
            reject(err); // Reject if there's an error with MongoDB connection
        });

        db.once('open', () => {
            User = db.model("users", userSchema); // Set up User model
            resolve(); // Resolve when connection is established
        });
    });
};

// Function to register a new user with password hashing
function registerUser(userData) {
    return new Promise((resolve, reject) => {
        // Check if passwords match
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
            return;
        }

        // Hash the password
        bcrypt.hash(userData.password, 10)
            .then(hash => {
                // Create a new User instance with hashed password
                let newUser = new User({
                    userName: userData.userName,
                    userAgent: userData.userAgent,
                    email: userData.email,
                    password: hash // Store the hashed password
                });

                // Save the user to the database
                newUser.save()
                    .then(() => resolve()) // Successfully created user
                    .catch((err) => {
                        if (err.code === 11000) {
                            reject("User Name already taken"); // Duplicate username
                        } else {
                            reject(`There was an error creating the user: ${err}`);
                        }
                    });
            })
            .catch(err => reject(`There was an error encrypting the password: ${err}`));
    });
}

// Function to check user credentials with password comparison
function checkUser(userData) {
    return new Promise((resolve, reject) => {
        // Find user by userName
        User.find({ userName: userData.userName })
            .then(users => {
                if (users.length === 0) {
                    reject(`Unable to find user: ${userData.userName}`);
                    return;
                }

                let user = users[0];

                // Compare the hashed password with the entered password
                bcrypt.compare(userData.password, user.password)
                    .then(result => {
                        if (!result) {
                            reject(`Incorrect Password for user: ${userData.userName}`);
                            return;
                        }

                        // Limit loginHistory to 8 entries
                        if (user.loginHistory.length === 8) {
                            user.loginHistory.pop();
                        }

                        // Add new login entry
                        user.loginHistory.unshift({
                            dateTime: new Date().toString(),
                            userAgent: userData.userAgent
                        });

                        // Update loginHistory in the database
                        User.updateOne(
                            { userName: user.userName },
                            { $set: { loginHistory: user.loginHistory } }
                        )
                            .then(() => resolve(user))
                            .catch(err => reject(`There was an error verifying the user: ${err}`));
                    })
                    .catch(err => reject(`Error comparing passwords: ${err}`));
            })
            .catch(() => reject(`Unable to find user: ${userData.userName}`));
    });
}

// Export all functions
module.exports = { initialize, registerUser, checkUser };
