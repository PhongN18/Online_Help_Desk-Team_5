import DashboardNavbar from "@/components/DashboardNavbar";
import RequestList from "@/components/RequestList";
import RoleBasedActions from "@/components/RoleBasedActions";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) {
            navigate("/login");
            return;
        }

        // Fetch user data (example API call)
        fetch("http://localhost:5000/api/user", {
            headers: { Authorization: `Bearer ${authToken}` },
        })
            .then((res) => res.json())
            .then((data) => setUser(data))
            .catch(() => navigate("/login"));
    }, [navigate]);

    if (!user) return <p>Loading dashboard...</p>;

    return (
        <div>
            <DashboardNavbar user={user} />
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <RequestList user={user} />
                <RoleBasedActions roles={user.roles} />
            </div>
        </div>
    );
}
