import DashboardNavbar from "@/components/DashboardNavbar";
import RequestList from "@/components/RequestList";
import RoleBasedActions from "@/components/RoleBasedActions";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [view, setView] = useState("my_requests"); // Default view
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

        fetchUser();
    }, [navigate]);

    if (loading) return <p className="text-center p-6">Loading dashboard...</p>;
    if (error) return <p className="text-center p-6 text-red-500">{error}</p>;

    return (
        <div>
            <DashboardNavbar user={user} />
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <RequestList user={user} view={view}/>
                <RoleBasedActions roles={user.roles} setView={setView} />
            </div>
        </div>
    );
}
