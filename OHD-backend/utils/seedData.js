const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Facility = require('../models/Facility');
const Request = require('../models/Request');
const { initializeMaxIds } = require('./initMaxIds')

const facilityNames = ['Lab', 'Library', 'Gym', 'Cafeteria', 'Computer Center', 'Pool'];
const noOfFacilities = facilityNames.length

// Function to create facility data
async function seedFacilities() {
    try {
        await Facility.deleteMany({})
        const facilities = [];

        // Create facilities
        for (let i = 0; i < noOfFacilities; i++) {
            const techniciansAssigned = []
            for (let j = 0; j < 5; j++) {
                techniciansAssigned.push(`U${String(noOfFacilities + 2 + i * 5 + j).padStart(6, '0')}`);
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
        status: 'Active'
    });

    // Create Manager users
    for (let i = 1; i <= noOfFacilities; i++) {

        // For demo purposes
        if (i === 1) {
            users.push({
                user_id: `U${String(i + 1).padStart(6, '0')}`,
                name: generateName(),
                roles: ['Manager', 'Technician', 'Requester'],
                email: 'chelsea2009021808@gmail.com',
                password: await bcrypt.hash('password', 10),
                status: 'Active'
            });
        } else {
            users.push({
                user_id: `U${String(i + 1).padStart(6, '0')}`,
                name: generateName(),
                roles: ['Manager', 'Technician', 'Requester'],
                email: generateEmail(`Manager ${i}`),
                password: await bcrypt.hash('password', 10),
                status: 'Active'
            });
        }

    }

    // Create Technician users
    const noOfTechnicians = noOfFacilities * 5;
    for (let i = 1; i <= noOfTechnicians; i++) {
        if (i === 1) {
            users.push({
                user_id: `U${String(i + noOfFacilities + 1).padStart(6, '0')}`,
                name: generateName(),
                roles: ['Technician', 'Requester'],
                email: 'nguyendinhhaphongk51d2csp@gmail.com',
                password: await bcrypt.hash('password', 10),
                status: 'Active'
            });
        } else {
            users.push({
                user_id: `U${String(i + noOfFacilities + 1).padStart(6, '0')}`,
                name: generateName(),
                roles: ['Technician', 'Requester'],
                email: generateEmail(`Technician ${i}`),
                password: await bcrypt.hash('password', 10),
                status: Math.floor(Math.random() * 10) > 0 ? 'Active' : 'Inactive'
            });
        }
    }

    // Create Requester users
    for (let i = 1; i <= 100; i++) {
        users.push({
            user_id: `U${String(i + noOfFacilities + noOfTechnicians + 1).padStart(6, '0')}`,
            name: generateName(),
            roles: ['Requester'],
            email: generateEmail(`Requester ${i}`),
            password: await bcrypt.hash('password', 10),
            status: Math.floor(Math.random() * 5) > 0 ? 'Active' : 'Inactive'
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

const requestDescriptions = [
    "The air conditioning unit in the conference room is not cooling effectively. It has been making unusual noises, and the airflow is weak even at maximum settings. Requesting maintenance to check and repair it.",
    "There is a system malfunction affecting the main facility’s security access. Employees are unable to scan their badges at certain entrances, causing delays during check-ins.",
    "The server in Lab 3 is experiencing frequent crashes and slow response times. Several researchers have reported difficulties in running simulations and accessing critical files.",
    "One of the power outlets in the office is sparking when plugging in a device. This poses a serious safety hazard and needs immediate attention from the electrical maintenance team.",
    "Multiple Wi-Fi connectivity issues in the staff lounge and meeting rooms. The connection frequently drops, making it difficult for employees to access online resources during work hours.",
    "The projector in the training room is not turning on. It was working fine yesterday, but now it fails to display any output even after checking the connections.",
    "The cafeteria requires urgent cleaning as there has been a spill near the food counter, causing a slipping hazard for staff and visitors. Requesting immediate sanitation services.",
    "The office heating system is not functioning, and employees are experiencing extreme cold in the mornings. The issue has persisted for a few days despite adjusting the thermostat.",
    "Several ceiling lights in the parking area have gone out, making it difficult for employees to navigate safely at night. The area is dimly lit, and it may pose a security risk.",
    "A strange burning smell is coming from one of the copy machines in the printing room. It appears to be overheating and may require immediate inspection before use.",
    "Water leakage detected in the restroom on the second floor. The sink pipes seem to be loose, and water is pooling under the counter. This may cause further damage if left unresolved.",
    "One of the office chairs in the meeting room is broken, making it unsafe for use. The backrest is loose, and the wheels are unstable. Requesting a replacement or repair.",
    "There is a delay in opening the front gate due to a possible issue with the automatic locking mechanism. Employees with morning shifts have been struggling to enter the premises on time.",
    "The fire alarm in the main hallway has been going off intermittently without any apparent cause. This is causing unnecessary panic among staff, and it needs to be checked for malfunctions.",
    "The coffee machine in the break room is not dispensing properly. Several employees have reported that the machine leaks water and the buttons are unresponsive.",
    "The office printer is constantly jamming paper, making it impossible to print important documents. Even after clearing the jam, it continues to malfunction.",
    "Several employees have reported flickering lights in the conference room, which is causing discomfort during long meetings. The bulbs may need to be checked or replaced.",
    "The main entrance door is not closing properly. It remains slightly open after each use, which could lead to security concerns and increased energy costs for air conditioning.",
    "One of the elevators in the building is making a loud screeching noise and occasionally stops between floors. It has caused concerns among employees, and maintenance is urgently needed.",
    "A section of the carpet in the waiting area is torn, creating a tripping hazard for visitors. It needs to be repaired or replaced to prevent accidents.",
    "The water dispenser in the lobby is leaking, leaving puddles on the floor. This could be a slipping hazard, and the maintenance team needs to inspect the issue.",
    "The kitchen sink in the employee lounge is clogged, causing water to back up and making it difficult to wash dishes. It needs to be unclogged as soon as possible.",
    "The air vents in the storage room are dusty and blocked, leading to poor ventilation and an unpleasant odor in the space. A thorough cleaning is required.",
    "The electronic attendance system at the main entrance is failing to register employee check-ins. This is causing discrepancies in work hour records and needs to be fixed immediately.",
    "The backup generator did not activate during the recent power outage. This could be a major issue during emergencies, and an inspection is required to ensure proper functionality.",
    "There has been a pest sighting in the pantry area, with several reports of ants and cockroaches near food storage. Pest control intervention is required to address the issue.",
    "The restroom stall doors on the third floor do not lock properly, leading to complaints from employees about privacy concerns. The locks need to be repaired or replaced.",
    "The sound system in the auditorium is producing static noise and intermittent sound loss during events. This is affecting presentations and needs to be checked by a technician.",
    "The company vehicle assigned for deliveries is making unusual engine noises and seems to struggle when accelerating. A thorough checkup is needed before further use."
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

const closingReasons = [
    "The issue has been resolved on my end.",
    "I found an alternative solution, no further action needed.",
    "The problem no longer occurs, so I’m closing the request.",
    "I managed to fix it myself, no assistance required.",
    "The request was submitted by mistake.",
    "I have received help from another source, request is no longer needed.",
    "The issue was temporary and has resolved itself.",
    "I misunderstood the problem, no action is necessary.",
    "The situation has changed, and this request is no longer relevant.",
    "I no longer require this service or support.",
    "Another department has already handled the issue.",
    "The equipment started working again, no repair needed.",
    "After a restart, the issue disappeared.",
    "A colleague assisted me in fixing the problem.",
    "I was able to resolve it following online instructions.",
    "The request is no longer urgent, and I will submit a new one later if needed.",
    "The issue was minor and does not require intervention.",
    "The power/internet/connection was restored, so no further help is needed.",
    "A workaround has been found, so I’m closing this request.",
    "I was able to reset the system and fix the issue myself."
];


const requestStartTime = new Date('2024-08-01T00:00:00Z'); // 1st August 2024
const createEndTime = new Date('2025-02-15T00:00:00Z'); // 15nd February 2025
const requestEndTime = new Date('2025-02-27T23:59:59Z'); // 27th February 2025
function getRandomTimestamp(start, end) {

    // Generate a random time in milliseconds between the start and end date
    const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());

    return new Date(randomTime);
}

// Function to create request data
async function seedRequests() {
    try {
        await Request.deleteMany({})
        const requests = [];

        // Create 500 requests
        for (let i = 1; i <= 500; i++) {
            const statusOptions = ['Unassigned', 'Assigned', 'Work in progress', 'Closed', 'Rejected'];
            const severityOptions = ['Low', 'Medium', 'High'];
            const managerHandleOptions = ['approve', 'decline', null]
            const facilityId = Math.ceil(Math.random() * noOfFacilities)

            const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
            const severityRandom = Math.floor(Math.random() * 10);
            const severity = severityRandom > 4 ? 'Low' : (severityRandom < 2 ? 'High' : 'Medium')
            const facility = `F${facilityId.toString().padStart(3, '0')}`;
            const title = requestTitles[Math.floor(Math.random() * requestTitles.length)];
            const description = requestDescriptions[Math.floor(Math.random() * requestDescriptions.length)];

            let assigned_to = null;
            let assigned_by = null;
            let remarks = null;
            const created_at = getRandomTimestamp(requestStartTime, createEndTime);
            let updated_at = created_at;

            // If status is "Work in progress" or "Closed", assign values to "assigned_to", "assigned_by" and "remarks"
            if (status === 'Work in progress' || status === 'Closed' || status === 'Assigned') {
                assigned_to = `U${String(Math.floor(Math.random() * 5) + 2 + facilityId * 5).padStart(6, '0')}`;
                assigned_by = `U${String(facilityId + 1).padStart(6, '0')}`;
                remarks = status === 'Closed' ? "Request closed." :
                ( status === 'Assigned' ? "Assigned to technician" : "Work is ongoing, awaiting completion.")
                updated_at = getRandomTimestamp(created_at, requestEndTime);
            }

            if (status === 'Rejected') {
                updated_at = getRandomTimestamp(created_at, requestEndTime);
            }

            const request = {
                request_id: `Req${created_at.getTime()}`,
                created_by: `U${(Math.ceil(Math.random() * 100) + noOfFacilities + 1).toString().padStart(6, '0')}`,
                assigned_to: assigned_to,
                assigned_by: assigned_by,
                facility: facility,
                title: title,
                severity: severity,
                description: description,
                status: status,
                remarks: remarks,
                created_at: created_at,
                updated_at: updated_at
            };

            const reasonSubmitted = Math.floor(Math.random() * 2) === 0 ? true : false
            let closing_reason = null

            if (reasonSubmitted && status !== 'Rejected') {
                closing_reason = closingReasons[Math.floor(Math.random() * closingReasons.length)]
                request.closing_reason = closing_reason
                let manager_handle = null

                if (status === 'Closed') {
                    const closedByUser = Math.floor(Math.random() * 2) === 0 ? true : false
                    if (closedByUser) {
                        manager_handle = 'approve'
                    } else {
                        manager_handle = 'decline'
                    }
                } else {
                    manager_handle = managerHandleOptions[Math.floor(Math.random() * 3)]
                }


                if (manager_handle) request.manager_handle = manager_handle
            }

            requests.push(request);
        }

        // Insert the generated requests into the database
        await Request.insertMany(requests);
        console.log('Requests seeded!');
    } catch (error) {
        console.error('Error seeding requests:', error);
    }
}

async function seedData() {
    console.log('Seeding data...');
    await seedUsers();
    await seedFacilities();
    await seedRequests();
    console.log('Data seeding completed!');
    initializeMaxIds();
}

module.exports = { seedData }