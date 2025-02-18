// Users
[{
    user_id: "unique_user_id",
    name: "Full Name",
    roles: ["requester", "manager", "technician"], // Array to allow multiple roles
    email: "user@example.com",
    password: "hashed_password",
    status: "active" // User status (active, inactive, etc.)
}]

// Requests
[{
    request_id: "unique_request_id",
    created_by: "user_id", // References Users collection
    assigned_to: "user_id", // References Users collection (if assigned)
    assigned_by: "user_id", // References Users collection (if assigned)
    facility: "facility_id", // References Facilities collection
    severity: ["low", "medium", "high"], // Severity levels
    description: "Brief description of the request",
    status: ["unassigned", "assigned", "work in progress", "closed", "rejected"],
    remarks: "Remarks by assignee or facility head",
    created_at: "timestamp", // Timestamp when the request was created
    updated_at: "timestamp" // Timestamp when the request was last updated
}]

// Facilities
[{
    facility_id: "unique_facility_id",
    name: "Facility Name (e.g., Lab A, Library)",
    head_manager: "user_id", // User ID of the person responsible (lab-assistant or facility-head)
    status: ["operational", "under maintenance"], // Facility status
    location: "Location details (optional)"
}]

// Messages
[{
    message_id: "unique_message_id",
    message_type: ["created", "status-change"], // Type of message
    sender_id: "user_id", // User ID of the sender
    recipient_ids: ["user_id1", "user_id2"], // Array of user IDs who receive the message
    message: "Content of the message",
    request_id: "unique_request_id", // References Requests collection (if applicable)
    timestamp: "timestamp" // Timestamp when the message was sent
}]
