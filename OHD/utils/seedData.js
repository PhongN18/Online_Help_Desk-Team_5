// utils/seedData.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');  // Import bcryptjs to hash the password
const User = require('../models/User');
const Facility = require('../models/Facility');

// Function to get the largest user_id from the User collection
async function getMaxUserId() {
    const maxUser = await User.find().sort({ user_id: -1 }).limit(1);
    if (maxUser.length > 0) {
        // Extract numeric part and return the incremented value
        return parseInt(maxUser[0].user_id.substring(1));  // Remove the prefix 'U' and convert to integer
    }
    return 0;  // If no users exist, start with 0
}

// Function to get the largest facility_id from the Facility collection
async function getMaxFacilityId() {
    const maxFacility = await Facility.find().sort({ facility_id: -1 }).limit(1);
    if (maxFacility.length > 0) {
        // Extract numeric part and return the incremented value
        return parseInt(maxFacility[0].facility_id.substring(1));  // Remove the prefix 'F' and convert to integer
    }
    return 0;  // If no facilities exist, start with 0
}

// Function to generate new User documents
async function generateUserData() {
    try {
        const maxUserId = await getMaxUserId();  // Get the largest user_id from the database

        // Generate 10 new users (for example)
        for (let i = 0; i < 10; i++) {
            const userId = `U${(maxUserId + 1 + i).toString().padStart(6, '0')}`;

            // Hash the password before saving
            const hashedPassword = await bcrypt.hash('password123', 10);  // Salt rounds = 10

            const newUser = new User({
                user_id: userId,
                name: `User ${maxUserId + 1 + i}`,
                email: `user${maxUserId + 1 + i}@example.com`,
                password: hashedPassword,  // Use the hashed password
                status: 'active',
                roles: ['Requester']  // Default role for new users
            });

            // Save the new user document
            await newUser.save();

            console.log(`Created new user: ${userId}`);
        }

    } catch (err) {
        console.error('Error generating user data:', err);
    }
}

// Function to generate new Facility documents
async function generateFacilityData() {
    try {
        const maxFacilityId = await getMaxFacilityId();  // Get the largest facility_id from the database

        // Generate 5 new facilities (for example)
        for (let i = 0; i < 5; i++) {
            const facilityId = `F${(maxFacilityId + 1 + i).toString().padStart(3, '0')}`;


            const newFacility = new Facility({
                facility_id: facilityId,
                name: `Facility ${maxFacilityId + 1 + i}`,
                responsible: `U${(i + 1).toString().padStart(6, '0')}`,  // Assign the user_id of the responsible user
                status: 'Operating',
                location: `Location ${maxFacilityId + 1 + i}`
            });

            // Save the new facility document
            await newFacility.save();

            console.log(`Created new facility: ${facilityId} with responsible user: ${responsibleUser.user_id}`);
        }

    } catch (err) {
        console.error('Error generating facility data:', err);
    }
}

// Function to generate both User and Facility data
async function seedData() {
    try {
        await generateUserData();
        await generateFacilityData();

        console.log('All new data generated successfully');
    } catch (err) {
        console.error('Error generating new data:', err);
    }
}

// Run the seed function when the script is executed
seedData().then(() => {
    mongoose.disconnect();  // Disconnect from MongoDB after generating data
});
