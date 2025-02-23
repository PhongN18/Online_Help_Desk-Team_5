import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";

export default function RequestDetail() {
    const [user, setUser] = useState(null);
    const { request_id } = useParams();
    const [request, setRequest] = useState(null);
    const [facility, setFacility] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [remarks, setRemarks] = useState("");
    const [manager, setManager] = useState();
    const [technicians, setTechnicians] = useState([]);
    const [assignedTechnician, setAssignedTechnician] = useState()
    const [selectedTechnician, setSelectedTechnician] = useState("");
    const [rejectReason, setRejectReason] = useState("");
    const [showTechnicianDropdown, setShowTechnicianDropdown] = useState(false);
    const [showRejectInput, setShowRejectInput] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const authToken = localStorage.getItem("authToken");
    
        if (!authToken) {
            navigate("/login");
            return;
        }
    
        const fetchUser = async () => {
            try {
                const response = await fetch("http://localhost:3000/auth/me", {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
    
                if (!response.ok) {
                    throw new Error("Session expired. Please log in again.");
                }
    
                const data = await response.json();
                setUser(data);
            } catch (err) {
                setError(err.message);
                localStorage.removeItem("authToken");
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };
    
        const fetchRequestDetail = async () => {
            try {
                const response = await fetch(`http://localhost:3000/requests/${request_id}`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });

                if (!response.ok) throw new Error("Failed to fetch request details.");
                const requestData = await response.json();
                setRequest(requestData);

                // Fetch facility, manager, and technicians only if request exists
                fetchFacilityDetail(requestData.facility, authToken);

                if (requestData.assigned_to) {
                    fetchAssignedTechnicianDetail(requestData.assigned_to, authToken);
                }
            } catch (err) {
                setError(err.message);
            }
        };
    
        fetchUser();
        fetchRequestDetail();
    }, [request_id]);

    /** Fetch Facility Details */
    const fetchFacilityDetail = async (facilityId, authToken) => {
        try {
            const facilityResponse = await fetch(`http://localhost:3000/facilities/${facilityId}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!facilityResponse.ok) throw new Error("Failed to fetch facility details.");
            const facilityData = await facilityResponse.json();
            setFacility(facilityData);

            // Fetch manager and technicians for the facility
            fetchManagerDetail(facilityData.head_manager, authToken);
            fetchTechniciansDetail(facilityData.technicians, authToken);
        } catch (err) {
            setError(err.message);
        }
    };

    /** Fetch Manager Details */
    const fetchManagerDetail = async (managerId, authToken) => {
        try {
            const managerResponse = await fetch(`http://localhost:3000/users/${managerId}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!managerResponse.ok) throw new Error("Failed to fetch manager details.");
            const managerData = await managerResponse.json();
            setManager(managerData);
        } catch (err) {
            setError(err.message);
        }
    };

    /** Fetch Technicians Details */
    const fetchTechniciansDetail = async (technicianIds, authToken) => {
        try {
            const technicianRequests = technicianIds.map((techId) =>
                fetch(`http://localhost:3000/users/${techId}`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                }).then((res) => res.json())
            );

            const techniciansData = await Promise.all(technicianRequests);
            setTechnicians(techniciansData);
        } catch (err) {
            setError(err.message);
        }
    };

    const fetchAssignedTechnicianDetail = async (technicianId, authToken) => {
        try {
            const technicianResponse = await fetch(`http://localhost:3000/users/${technicianId}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!technicianResponse.ok) throw new Error("Failed to fetch technician details.");
            const technicianData = await technicianResponse.json();
            setAssignedTechnician(technicianData);

        } catch (err) {
            setError(err.message);
        }
    };

    const handleStartWork = async () => {
        try {
            const response = await fetch(`http://localhost:3000/requests/${request_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
                body: JSON.stringify({ status: "Work in progress", remarks: "Work is ongoing" }),
            });

            if (!response.ok) {
                throw new Error("Failed to start work.");
            }

            alert("Work started successfully.");
            window.location.reload();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleUpdateRemarks = async () => {
        try {
            const response = await fetch(`http://localhost:3000/requests/${request_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
                body: JSON.stringify({ remarks }),
            });

            if (!response.ok) {
                throw new Error("Failed to update remarks.");
            }

            alert("Remarks updated successfully.");
            window.location.reload();
        } catch (err) {
            alert(err.message);
        }
    }

    const handleCompleteWork = async () => {
        try {
            const response = await fetch(`http://localhost:3000/requests/${request_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
                body: JSON.stringify({ status: "Closed", remarks: "Work completed" }),
            });

            if (!response.ok) {
                throw new Error("Failed to complete request.");
            }

            alert("Request completed successfully.");
            window.location.reload();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleAssignTechnician = async () => {
        try {
            const response = await fetch(`http://localhost:3000/requests/${request_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
                body: JSON.stringify({ assigned_by: user.user_id, assigned_to: selectedTechnician, status: "Assigned" }),
            });

            if (!response.ok) {
                throw new Error("Failed to assign technician.");
            }

            alert("Technician assigned successfully.");
            window.location.reload();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleRejectRequest = async () => {
        try {
            const response = await fetch(`http://localhost:3000/requests/${request_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
                body: JSON.stringify({ status: "Rejected", remarks: `Rejected by Manager ${user.name}, reject reason: ${rejectReason}` }),
            });

            if (!response.ok) {
                throw new Error("Failed to reject request.");
            }

            alert("Request rejected successfully.");
            window.location.reload();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <p>Loading request details...</p>;
    if (error) return <p>Error: {error}</p>;
    if (!request) return <p>No request found.</p>;

    const isManagerOfThisFacility = user?.roles.includes("Manager") && user?.user_id === facility?.head_manager;
    console.log('User', user);
    console.log('Facility', facility);
    console.log('Manager', manager);
    console.log('Technicians', technicians)
    console.log('assigned', assignedTechnician)
    console.log('Request', request)
    return (
        <>
            <DashboardNavbar user={user} />
            <div className="p-6 bg-white shadow-md rounded-lg">
                <h2 className="text-2xl font-semibold mb-4">Request Details</h2>
                <p><strong>Request ID:</strong> {request.request_id}</p>
                <p><strong>Facility:</strong> {facility?.name} - {facility?.facility_id}</p>
                <p><strong>Assigned By:</strong> ID: {manager?.user_id} - {manager?.name}</p>
                <p><strong>Assigned To:</strong> ID: {request?.assigned_to} - {assignedTechnician?.name || "Unassigned"}</p>
                <p><strong>Remarks:</strong> {request.remarks || "No remarks"}</p>
                <p><strong>Status:</strong> {request.status}</p>

                {/* Technician Actions */}
                {user?.roles.includes("Technician") && user.user_id === request.assigned_to && (
                    <div className="mt-4">
                        {request.status === "Assigned" ? (
                            <button onClick={handleStartWork} className="bg-blue-500 text-white px-4 py-2 rounded">
                                Start Working on Request
                            </button>
                        ) : request.status === "Work in progress" ? (
                            <>
                                <textarea className="border w-full p-2 rounded" placeholder="Update remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                                <button onClick={handleUpdateRemarks} className="px-4 py-2 rounded mt-2 bg-blue-500 text-white" >Update Remarks</button>
                                <br />
                                <button onClick={handleCompleteWork} className="bg-green-500 text-white px-4 py-2 rounded mt-2">
                                    Complete Request
                                </button>
                            </>
                        ) : null}
                    </div>
                )}

                {/* Manager Actions */}
                {isManagerOfThisFacility && request.status === "Unassigned" && (
                    <>
                        <button onClick={() => setShowTechnicianDropdown(!showTechnicianDropdown)} className="bg-blue-500 text-white px-4 py-2 rounded mt-2">
                            Assign Technician
                        </button>
                        {showTechnicianDropdown && (
                            <>
                                <select onChange={(e) => setSelectedTechnician(e.target.value)} className="border p-2 rounded w-full mt-2">
                                    <option value="">Select Technician</option>
                                    {technicians.map((tech) => (
                                        <option key={tech.user_id} value={tech.user_id}>{tech.name}</option>
                                    ))}
                                </select>
                                <button onClick={handleAssignTechnician} className="bg-green-500 text-white px-4 py-2 rounded mt-2">Confirm Assignment</button>
                            </>
                        )}
                        <button onClick={() => setShowRejectInput(!showRejectInput)} className="bg-red-500 text-white px-4 py-2 rounded mt-2">
                            Reject Request
                        </button>
                        {showRejectInput && (
                            <>
                                <textarea className="border w-full p-2 rounded mt-2" placeholder="Reason for rejection" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                                <button onClick={handleRejectRequest} className="bg-red-500 text-white px-4 py-2 rounded mt-2">Confirm Rejection</button>
                            </>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
