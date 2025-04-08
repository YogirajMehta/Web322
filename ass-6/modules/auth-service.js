const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define user schema
const userSchema = new mongoose.Schema({
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

const User = mongoose.model('User', userSchema);

// Function to initialize the user model
function initialize() {
    return new Promise((resolve, reject) => {
        if (mongoose.connection.readyState === 0) {
            reject("Database not connected!");
        } else {
            resolve();
        }
    });
}

// Function to register a user
function registerUser(userData) {
    return new Promise((resolve, reject) => {
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
            return;
        }

        bcrypt.hash(userData.password, 10)
            .then(hash => {
                let newUser = new User({
                    userName: userData.userName,
                    userAgent: userData.userAgent,
                    email: userData.email,
                    password: hash
                });
                return newUser.save();
            })
            .then(() => resolve())
            .catch(err => reject("Error creating user: " + err));
    });
}

// Function to check if the user exists and authenticate
function checkUser(userData) {
    return new Promise((resolve, reject) => {
        User.findOne({ userName: userData.userName })
            .then(user => {
                if (!user) {
                    reject("User not found");
                    return;
                }

                bcrypt.compare(userData.password, user.password)
                    .then(isMatch => {
                        if (isMatch) {
                            user.loginHistory.push({ userAgent: userData.userAgent });
                            user.save();
                            resolve(user);
                        } else {
                            reject("Incorrect password");
                        }
                    })
                    .catch(err => reject("Error comparing passwords: " + err));
            })
            .catch(err => reject("Error finding user: " + err));
    });
}

module.exports = { initialize, registerUser, checkUser };
