import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select"; // Import React-Select
import AdminNavbar from "../components/AdminNavbar";

export default function ManageFacilities() {
    const [facilities, setFacilities] = useState([]);
    const [managers, setManagers] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editFacility, setEditFacility] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [facilityToDelete, setFacilityToDelete] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newFacility, setNewFacility] = useState({ name: "", head_manager: "", location: "", status: "Operating", technicians: [] });
    const [hoveredUser, setHoveredUser] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

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

        fetchFacilities(authToken);
        fetchManagers(authToken);
        fetchTechnicians(authToken);
    }, [showDeleteModal, showCreateModal, showEditModal]);

    /** Fetch all facilities */
    const fetchFacilities = async (authToken) => {
        try {
            const res = await fetch("http://localhost:3000/facilities", {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
            });

            if (!res.ok) throw new Error("Failed to fetch facilities.");
            const data = await res.json();
            setFacilities(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    /** Fetch all managers (users with "Manager" role) */
    const fetchManagers = async (authToken) => {
        try {
            const res = await fetch("http://localhost:3000/users?roles=Manager", {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
            });

            if (!res.ok) throw new Error("Failed to fetch managers.");
            const data = await res.json();
            setManagers(data.data);
        } catch (err) {
            console.error("Error fetching managers:", err);
        }
    };

    /** Fetch all technicians (users with "Technician" role) */
    const fetchTechnicians = async (authToken) => {
        try {
            const res = await fetch("http://localhost:3000/users?roles=Technician", {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
            });

            if (!res.ok) throw new Error("Failed to fetch technicians.");
            const data = await res.json();
            setTechnicians(data.data);
        } catch (err) {
            console.error("Error fetching technicians:", err);
        }
    };

    const handleManagerChange = (selected) => {
        setEditFacility(prev => ({
            ...prev,
            manager: selected ? selected.value : "", // Set manager as single value
        }));
    };

    /** Update Selected Technicians */
    const handleTechnicianChange = (selectedTechnicians, isEdit = false) => {
        const techIds = selectedTechnicians.map(tech => tech.value);
        if (isEdit) {
            setEditFacility({ ...editFacility, technicians: techIds });
        } else {
            setNewFacility({ ...newFacility, technicians: techIds });
        }
    };

    const handleEdit = (facility) => {
        setEditFacility({ ...facility });
        setShowEditModal(true)
    };

    const handleUpdateFacility = async () => {
        try {
            const authToken = localStorage.getItem("authToken");
            const res = await fetch(`http://localhost:3000/facilities/${editFacility.facility_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
                body: JSON.stringify(editFacility),
            });

            if (!res.ok) throw new Error("Failed to update facility.");
            alert("Facility updated successfully.");
            setEditFacility(null);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteFacility = async () => {
        try {
            console.log(facilityToDelete)
            const authToken = localStorage.getItem("authToken");
            const res = await fetch(`http://localhost:3000/facilities/${facilityToDelete}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
            });

            if (!res.ok) throw new Error("Failed to delete facility.");
            alert("Facility deleted successfully.");
            setShowDeleteModal(false);
        } catch (err) {
            alert(err.message);
        }
    };

    /** Handle Create Facility */
    const handleCreateFacility = async () => {
        try {
            const authToken = localStorage.getItem("authToken");
            const res = await fetch(`http://localhost:3000/facilities`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
                body: JSON.stringify(newFacility),
            });

            if (!res.ok) throw new Error("Failed to create facility.");
            alert("Facility created successfully.");
            setShowCreateModal(false);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("authToken");
        navigate("/login");
    };

    if (loading) return <p>Loading facilities...</p>;
    if (error) return <p>Error: {error}</p>;

    const managerOptions = managers?.map(manager => ({
        value: manager.user_id,
        label: `${manager.name} - ID: ${manager.user_id} - ${facilities?.find(f => f.head_manager === manager.user_id)?.name || 'Unassigned'}`
    }))

    /** Convert Technicians to Select Options */
    const technicianOptions = technicians?.map(tech => ({
        value: tech.user_id,
        label: `${tech.name} - ID: ${tech.user_id} - ${facilities?.find(f => f.technicians.includes(tech.user_id))?.name || 'Unassigned'}`
    }));

    // console.log(facilities)
    // console.log(technicians)

    return (
        <>
            <AdminNavbar onLogout={handleLogout} />
            <div className="p-6 bg-white min-h-[100vh]">
                <h2 className="text-2xl font-semibold mb-4">Manage Facilities</h2>

                {/* Create New Facility Button */}
                <button
                    className="bg-green-500 text-white px-4 py-2 rounded mb-4"
                    onClick={() => setShowCreateModal(true)}
                >
                    Add New Facility
                </button>

                {/* Facilities Table */}
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="p-2 border">Facility ID</th>
                            <th className="p-2 border">Name</th>
                            <th className="p-2 border">Head Manager</th>
                            <th className="p-2 border">Technicians</th>
                            <th className="p-2 border">Location</th>
                            <th className="p-2 border">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {facilities.map((facility) => (
                            <tr key={facility.facility_id} className="border">
                                <td className="p-2 border text-center">{facility.facility_id}</td>
                                <td className="p-2 border">{facility.name}</td>
                                <td className="p-2 border relative">
                                    <span
                                        className="cursor-pointer hover:text-white hover:bg-black transition-all rounded-2xl p-2"
                                        onMouseEnter={(e) => {
                                            setHoveredUser({
                                                name: managers.find(m => m.user_id === facility.head_manager)?.name || "Unknown",
                                                id: facility.head_manager
                                            });
                                            setTooltipPosition({ x: e.clientX, y: e.clientY });
                                        }}
                                        onMouseLeave={() => setHoveredUser(null)}
                                    >
                                        {managers?.find(m => m.user_id === facility.head_manager)?.name || "Unknown"}
                                    </span>
                                </td>
                                <td className="p-2 border">
                                    {facility.technicians?.map(techId => {
                                        const technician = technicians.find(t => t.user_id === techId);
                                        return (
                                            <span
                                                key={techId}
                                                className="mr-2 text-blue-600 relative cursor-pointer hover:text-white hover:bg-blue-500 transition-all rounded-2xl p-2"
                                                onMouseEnter={(e) => {
                                                    setHoveredUser({ name: technician?.name, id: techId });
                                                    setTooltipPosition({ x: e.clientX, y: e.clientY });
                                                }}
                                                onMouseLeave={() => setHoveredUser(null)}
                                            >
                                                {technician?.name || "Unknown"}
                                            </span>
                                        );
                                    })}
                                </td>
                                <td className="p-2 border">{facility.location}</td>
                                <td className="p-2 border text-center">
                                    <button className="bg-blue-500 text-white px-3 py-1 rounded mr-2" onClick={() => handleEdit(facility)}>Edit</button>
                                    <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={() => { setShowDeleteModal(true); setFacilityToDelete(facility.facility_id); }}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Floating Tooltip */}
                {hoveredUser && (
                    <div
                        className="absolute bg-gray-800 text-white text-sm px-2 py-1 rounded shadow-md"
                        style={{
                            top: tooltipPosition.y + 30 + "px",
                            left: tooltipPosition.x - 50 + "px",
                            whiteSpace: "nowrap"
                        }}
                    >
                        {hoveredUser.name} (ID: {hoveredUser.id})
                    </div>
                )}

                {showCreateModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                        <div className="bg-white p-6 rounded shadow-md w-96">
                            <h3 className="text-xl font-semibold mb-4">Add New Facility</h3>
                            <input type="text" className="border p-2 w-full rounded mb-2" placeholder="Facility Name" onChange={(e) => setNewFacility({ ...newFacility, name: e.target.value })} />
                            <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handleCreateFacility}>
                                Create
                            </button>
                            <button className="bg-gray-400 px-4 py-2 rounded ml-3" onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Edit Facility Modal */}
                {editFacility && showEditModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                        <div className="bg-white p-6 rounded shadow-md w-96">
                            <h3 className="text-xl font-semibold mb-4">Edit Facility</h3>
                            <input type="text" className="border p-2 w-full rounded mb-2" value={editFacility.name} onChange={(e) => setEditFacility({ ...editFacility, name: e.target.value })} />
                            <label htmlFor="">Head Manager</label>
                            <Select
                                options={managerOptions}
                                placeholder="Select Manager"
                                value={managerOptions.find(opt => editFacility.manager === opt.value) || null} // Find single selected option
                                className="mb-2"
                                onChange={(selected) => handleManagerChange(selected)} // Handle selection
                            />
                            <label htmlFor="">Facility's Technicians</label>
                            <Select
                                options={technicianOptions}
                                isMulti
                                placeholder="Select Technicians"
                                value={technicianOptions.filter(opt => editFacility.technicians.includes(opt.value))}
                                className="mb-2"
                                onChange={(selected) => handleTechnicianChange(selected, true)}
                            />
                            <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleUpdateFacility}>
                                Save
                            </button>
                            <button className="bg-gray-400 px-4 py-2 rounded ml-3" onClick={() => setShowEditModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Delete Facility Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                        <div className="bg-white p-6 rounded shadow-md w-96">
                            <h3 className="text-xl font-semibold text-red-600 mb-4">Delete Facility</h3>
                            <p className="mb-1">Are you sure you want to delete <strong>{facilities.find(f => f.facility_id === facilityToDelete)?.name}</strong>? This action cannot be undone.</p>
                            <p className="mb-4 text-sm text-red-500"><strong>Head Manager and Technicians</strong> of this Facility will be set to <span className="underline text-gray-400 font-bold">unassigned</span>.</p>
                            <div className="flex justify-end">
                                <button className="bg-gray-500 text-white px-4 py-2 rounded mr-2" onClick={() => setShowDeleteModal(false)}>
                                    Cancel
                                </button>
                                <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={handleDeleteFacility}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
