const User = require('../models/User');
const Facility = require('../models/Facility');

let maxCurrentUserId = 0;  // Global variable for max user_id
let maxCurrentFacilityId = 0;  // Global variable for max facility_id

// Function to initialize max user_id and max facility_id on server startup
async function initializeMaxIds() {
    try {
        const maxUser = await User.find().sort({ user_id: -1 }).limit(1);
        if (maxUser.length > 0) {
            maxCurrentUserId = parseInt(maxUser[0].user_id.substring(1));  // Extract numeric part of 'U000001'
        }

        const maxFacility = await Facility.find().sort({ facility_id: -1 }).limit(1);
        if (maxFacility.length > 0) {
            maxCurrentFacilityId = parseInt(maxFacility[0].facility_id.substring(1));  // Extract numeric part of 'F001'
        }

        console.log(`Max User ID: ${maxCurrentUserId}`);
        console.log(`Max Facility ID: ${maxCurrentFacilityId}`);
    } catch (err) {
        console.error('Error initializing max IDs:', err);
    }
}

// Expose global variables
function getMaxUserId() {
    return maxCurrentUserId;
}

function getMaxFacilityId() {
    return maxCurrentFacilityId;
}

// Re-query and update max ID if necessary after deletion
async function updateMaxUserId() {
    try {
        const maxUser = await User.find().sort({ user_id: -1 }).limit(1);
        if (maxUser.length > 0) {
            maxCurrentUserId = parseInt(maxUser[0].user_id.substring(1));  // Update global variable
        }
    } catch (err) {
        console.error('Error updating max user ID:', err);
    }
}

async function updateMaxFacilityId() {
    try {
        const maxFacility = await Facility.find().sort({ facility_id: -1 }).limit(1);
        if (maxFacility.length > 0) {
            maxCurrentFacilityId = parseInt(maxFacility[0].facility_id.substring(1));  // Update global variable
        }
    } catch (err) {
        console.error('Error updating max facility ID:', err);
    }
}

// Export the functions and variables
module.exports = {
    initializeMaxIds,
    getMaxUserId,
    getMaxFacilityId,
    updateMaxUserId,
    updateMaxFacilityId
};
