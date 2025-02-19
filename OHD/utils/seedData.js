const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Facility = require('../models/Facility');

// Helper function to generate random names
function generateName() {
    const firstNames = ['John', 'Jane', 'Alex', 'Emily', 'Chris', 'Sarah', 'Michael', 'Emma', 'David', 'Olivia'];
    const lastNames = ['Smith', 'Johnson', 'Brown', 'Taylor', 'Lee', 'Davis', 'Miller', 'Wilson', 'Moore', 'Anderson'];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
}

// Helper function to generate a random email
function generateEmail(name) {
    const domain = 'example.com';
    return `${name.replace(' ', '.').toLowerCase()}@${domain}`;
}

// Function to create user data
async function seedUsers() {
    await User.deleteMany({})
    const users = [];

    // Create the Admin user
    users.push({
        user_id: 'U000001',
        name: 'Admin User',
        roles: ['Admin'],
        email: generateEmail('Admin User'),
        password: await bcrypt.hash('adminpassword', 10),
        status: 'active'
    });

    // Create Manager users
    for (let i = 2; i <= 6; i++) {
        users.push({
            user_id: `U${String(i).padStart(6, '0')}`,
            name: generateName(),
            roles: ['Manager', 'Technician'],
            email: generateEmail(`Manager ${i}`),
            password: await bcrypt.hash('password', 10),
            status: 'active'
        });
    }

    // Create Technician users
    for (let i = 7; i <= 31; i++) {
        users.push({
            user_id: `U${String(i).padStart(6, '0')}`,
            name: generateName(),
            roles: ['Technician', 'Requester'],
            email: generateEmail(`Technician ${i}`),
            password: await bcrypt.hash('password', 10),
            status: 'active'
        });
    }

    // Create Requester users
    for (let i = 32; i <= 100; i++) {
        users.push({
            user_id: `U${String(i).padStart(6, '0')}`,
            name: generateName(),
            roles: ['Requester'],
            email: generateEmail(`Requester ${i}`),
            password: await bcrypt.hash('password', 10),
            status: 'active'
        });
    }

    // Save all users to the database
    try {
        await User.insertMany(users);
        console.log('Users seeded!');
    } catch (error) {
        console.error('Error seeding users:', error);
    }
}

const facilityNames = ['Lab', 'Library', 'Gym', 'Cafeteria', 'Computer Center'];

// Function to create facility data
async function seedFacilities() {
    try {
        await Facility.deleteMany({})
        const facilities = [];

        // Create 5 facilities
        for (let i = 0; i < 5; i++) {
            const techniciansAssigned = []
            for (let j = 0; j < 5; j++) {
                techniciansAssigned.push(`U${String(7 + i * 5 + j).padStart(6, '0')}`);
            }

            const facility = {
                facility_id: `F${String(i + 1).padStart(3, '0')}`,
                name: facilityNames[i],
                head_manager: `U${String(i + 2).padStart(6, '0')}`,
                technicians: techniciansAssigned,
                status: 'Operating',
                location: `Location ${i + 1}`,
            };

            facilities.push(facility);
        }

        // Insert the generated facilities into the database
        await Facility.insertMany(facilities);
        console.log('Facilities seeded!');
    } catch (error) {
        console.error('Error seeding facilities:', error);
    }
}

const requestDescriptions = [
    "System malfunction in the facility.",
    "Request for room maintenance.",
    "Equipment repair required.",
    "Issues with the server in the lab.",
    "Cleaning needed in the cafeteria.",
    "Power failure in the building.",
    "Air conditioner not working properly.",
    "Wi-Fi connectivity issue.",
    "Issue with the security system."
];

const requestTitles = [
    "System Error",
    "Facility Maintenance",
    "Equipment Repair",
    "Server Issue",
    "Cleaning Required",
    "Power Outage",
    "Temperature Issue",
    "Network Issue",
    "Security Problem"
];

const requestStartTime = new Date('2025-01-01T00:00:00Z'); // 1st January 2025
const requestEndTime = new Date('2025-02-20T23:59:59Z'); // 20th February 2025
function getRandomTimestamp(start, end) {

    // Generate a random time in milliseconds between the start and end date
    const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());

    return new Date(randomTime);
}

// Function to create request data
async function seedRequests() {
    try {
        // Get all facilities and users
        const facilities = await Facility.find();
        const users = await User.find({ roles: { $in: ['Technician', 'Manager'] } });

        const requests = [];

        // Create 500 requests
        for (let i = 1; i <= 500; i++) {
            const statusOptions = ['Unassigned', 'Assigned', 'Work in progress', 'Closed', 'Rejected'];
            const severityOptions = ['low', 'medium', 'high'];

            const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
            const severity = severityOptions[Math.floor(Math.random() * severityOptions.length)];
            const facility = facilities[Math.floor(Math.random() * facilities.length)].facility_id;
            const title = requestTitles[Math.floor(Math.random() * requestTitles.length)];
            const description = requestDescriptions[Math.floor(Math.random() * requestDescriptions.length)];

            let assigned_to = null;
            let assigned_by = null;
            let remarks = null;

            // If status is "Work in progress" or "Closed", assign values to "assigned_to", "assigned_by" and "remarks"
            if (status === 'Work in progress' || status === 'Closed') {
                assigned_to = users[Math.floor(Math.random() * users.length)].user_id;
                assigned_by = users[Math.floor(Math.random() * users.length)].user_id;
                remarks = status === 'Closed' ? "Request closed." : "Work is ongoing, awaiting completion."
            }

            const created_at = getRandomTimestamp(requestStartTime, requestEndTime);
            const updated_at = created_at;

            const request = {
                request_id: `R${String(i).padStart(6, '0')}`,
                created_by: users[Math.floor(Math.random() * users.length)].user_id,
                assigned_to: assigned_to,
                assigned_by: assigned_by,
                facility: facility,
                title: title,
                severity: severity,
                description: description,
                status: status,
                remarks: remarks,
                created_at: created_at, // Random timestamp
                updated_at: updated_at  // Initially same as created_at
            };

            requests.push(request);
        }

        // Insert the generated requests into the database
        await Request.insertMany(requests);
        console.log('Requests seeded successfully!');
    } catch (error) {
        console.error('Error seeding requests:', error);
    }
}

async function seedData() {
    await seedUsers();
    await seedFacilities();
    console.log('Data seeding completed!');
}

module.exports = { seedData }