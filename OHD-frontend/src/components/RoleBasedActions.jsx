export default function RoleBasedActions({ roles }) {
    return (
        <div className="bg-white shadow-md p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Available Actions</h2>
            <div className="flex flex-col gap-3">
                {roles.includes("Requester") && <button className="p-3 bg-blue-500 text-white rounded">Create New Request</button>}
                {roles.includes("Manager") && <button className="p-3 bg-green-500 text-white rounded">View & Assign Requests</button>}
                {roles.includes("Technician") && <button className="p-3 bg-yellow-500 text-white rounded">View Assigned Requests</button>}
            </div>
        </div>
    );
}