import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";

export default function RequestDetail() {
    const [user, setUser] = useState(null);
    const { request_id } = useParams(); // Get the request_id from the URL
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate()

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
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`http://localhost:3000/requests/${request_id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch request details.");
                }

                const data = await response.json();
                setRequest(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
        fetchRequestDetail();
    }, [request_id]); // Fetch again if the request_id changes

    if (loading) return <p>Loading request details...</p>;
    if (error) return <p>Error: {error}</p>;

    if (!request) return <p>No request found.</p>;

    return (
        <>
            <DashboardNavbar user={user}/>
            <div>
                <div className="p-6 bg-white shadow-md rounded-lg">
                    <h2 className="text-2xl font-semibold mb-4">Request Details</h2>
                    <div className="mb-4">
                        <h3 className="text-xl font-semibold">Title: {request.title}</h3>
                        <p><strong>Facility:</strong> {request.facility}</p>
                        <p><strong>Severity:</strong> {request.severity}</p>
                        <p><strong>Description:</strong> {request.description}</p>
                        <p><strong>Status:</strong> {request.status}</p>
                        <p><strong>Assigned To:</strong> {request.assigned_to}</p>
                        <p><strong>Assigned By:</strong> {request.assigned_by}</p>
                        <p><strong>Remarks:</strong> {request.remarks || "No remarks"}</p>
                    </div>

                    {/* Add any additional information you'd like to show */}
                    <div>
                        <p><strong>Created At:</strong> {new Date(request.createdAt).toLocaleString()}</p>
                        <p><strong>Updated At:</strong> {new Date(request.updatedAt).toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </>
    );
}
