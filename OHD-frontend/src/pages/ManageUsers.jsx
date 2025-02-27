import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";

export default function ManageUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editUser, setEditUser] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newUser, setNewUser] = useState({ name: "", email: "", roles: ["Requester"], status: "Active" });

    // Filters
    const [selectedRoles, setSelectedRoles] = useState(['Admin', 'Manager', 'Technician', 'Requester']); // Multi-select
    const [selectedStatus, setSelectedStatus] = useState(""); // Single-select

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();

    useEffect(() => {

        const isTokenExpired = (token) => {
            if (!token) return true; // If there's no token, consider it expired
        
            try {
                const payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload
                const expiryTime = payload.exp * 1000; // Convert to milliseconds
                return expiryTime < Date.now(); // Check if expired
            } catch (error) {
                return true; // If decoding fails, treat token as expired
            }
        };

        const authToken = localStorage.getItem("authToken");

        if (!authToken || isTokenExpired(authToken)) {
            localStorage.removeItem("authToken"); // Remove expired token
            navigate("/login"); // Redirect to login page
        }

        /** Fetch users with pagination & filters */
        const fetchUsers = async (page) => {
            setLoading(true);
            try {

                let url = `http://localhost:3000/users?page=${page}&limit=10`;

                // Append role filter if selected
                if (selectedRoles.length > 0) {
                    url += `&roles=${selectedRoles.join(",")}`;
                }

                // Append status filter if selected
                if (selectedStatus) {
                    url += `&status=${selectedStatus}`;
                }

                const res = await fetch(url, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authToken}`,
                    },
                });

                console.log(url);
                

                if (!res.ok) throw new Error("Failed to fetch users.");
                const data = await res.json();
                setUsers(data.data);
                setTotalPages(data.totalPages);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers(currentPage);
    }, [currentPage, selectedRoles, selectedStatus]);

    /** Handle pagination navigation */
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    /** Handle multi-select role filtering */
    const handleRoleChange = (role) => {
        setSelectedRoles((prevRoles) =>
            prevRoles.includes(role) ? prevRoles.filter((r) => r !== role) : [...prevRoles, role]
        );
        setCurrentPage(1); // Reset pagination when filter changes
    };

    /** Handle status filtering */
    const handleStatusChange = (e) => {
        setSelectedStatus(e.target.value);
        setCurrentPage(1); // Reset pagination when filter changes
    };

    /** Handle Logout */
    const handleLogout = () => {
        localStorage.removeItem("authToken");
        navigate("/login");
    };

    if (loading) return <p>Loading users...</p>;
    if (error) return <p>Error: {error}</p>;

    console.log(users);
    

    return (
        <>
            <AdminNavbar onLogout={handleLogout} />
            <div className="bg-white p-6 min-h-[100vh]">
                <h2 className="text-2xl font-semibold mb-4">Manage Users</h2>
                <div className="flex justify-between items-center mb-4 gap-4">
                    {/* Role Filter (Multi-select) */}
                    <div>
                        <label className="font-semibold">Filter by Role:</label>
                        <div className="flex space-x-2 mt-1">
                            {["Admin", "Manager", "Technician", "Requester"].map((role) => (
                                <button
                                    key={role}
                                    onClick={() => handleRoleChange(role)}
                                    className={`px-3 py-1 border rounded ${
                                        selectedRoles.includes(role) ? "bg-blue-500 text-white" : "bg-gray-200"
                                    }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status Filter (Dropdown) */}
                    <div>
                        <label className="font-semibold">Filter by Status:</label>
                        <select
                            value={selectedStatus}
                            onChange={handleStatusChange}
                            className="border p-2 rounded ml-2"
                        >
                            <option value="">All</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <span className="text-center mr-4 leading-10">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            className={`px-4 py-2 rounded ${
                                currentPage === 1 ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 text-white"
                            }`}
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1}
                        >
                            &lt; First
                        </button>
                        <button
                            className={`px-4 py-2 rounded ${
                                currentPage === 1 ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 text-white"
                            }`}
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        <button
                            className={`px-4 py-2 rounded ${
                                currentPage === totalPages ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 text-white"
                            }`}
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                        <button
                            className={`px-4 py-2 rounded ${
                                currentPage === totalPages ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 text-white"
                            }`}
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            Last &gt;
                        </button>
                    </div>
                </div>

                {/* Users Table */}
                <table className="w-full table-auto border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="p-2 border">User ID</th>
                            <th className="p-2 border">Name</th>
                            <th className="p-2 border">Email</th>
                            <th className="p-2 border">Role</th>
                            <th className="p-2 border">Status</th>
                            <th className="p-2 border">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center p-4">No users found.</td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.user_id} className="border">
                                    <td className="p-2 border text-center">{user.user_id}</td>
                                    <td className="p-2 border">{user.name}</td>
                                    <td className="p-2 border">{user.email}</td>
                                    <td className="p-2 border">{user.roles.join(", ")}</td>
                                    <td className="p-2 border">{user.status}</td>
                                    <td className="p-2 border text-center">
                                        <button
                                            className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
                                            onClick={() => handleEdit(user)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="bg-red-500 text-white px-3 py-1 rounded"
                                            onClick={() => {
                                                setShowDeleteModal(true);
                                                setUserToDelete(user.user_id);
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}
