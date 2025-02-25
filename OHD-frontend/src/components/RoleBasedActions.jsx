import { useNavigate } from "react-router-dom";

export default function RoleBasedActions({ roles, setView }) {
    
    const navigate = useNavigate()

    return (
        <div className="bg-white shadow-md p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Available Actions</h2>
            <div className="flex flex-col gap-3">
                <button
                    className="p-3 bg-blue-500 text-white rounded"
                    onClick={() => navigate('/create-request')}
                >
                    Create New Request
                </button>
                <button
                    className="p-3 bg-blue-500 text-white rounded"
                    onClick={() => setView("my_requests")}
                >
                    View My Requests
                </button>
                {roles.includes("Manager") && (
                    <>
                        <button
                            className="p-3 bg-green-500 text-white rounded"
                            onClick={() => setView("facility_requests")}
                        >
                            View Facility Requests and Assign
                        </button>
                        <button
                            className="p-3 bg-red-500 text-white rounded"
                            onClick={() => setView("need_handle")}
                        >
                            View Closing Requests from Users
                        </button>
                    </>
                )}
                {roles.includes("Technician") && (
                    <>
                        <button
                            className="p-3 bg-yellow-500 text-white rounded"
                            onClick={() => setView("assigned_requests")}
                        >
                            View Assigned Requests
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
