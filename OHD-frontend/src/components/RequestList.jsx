import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RequestList({ user, view }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const navigate = useNavigate();

    const statusStyle = {
        unassigned: "bg-yellow-600",
        assigned: "bg-blue-600",
        workinprogress: "bg-green-600",
        closed: "bg-gray-500",
        rejected: "bg-red-600"
    }

    const fetchRequests = async (page) => {
        setLoading(true);
        setError(null);

        try {
            let url = `http://localhost:3000/requests?page=${page}&limit=10`;

            if (view === "my_requests") {
                url += `&created_by_me=true`;
            } else if (view === "facility_requests") {
                url += `&facility=${user.user_id}`;
            } else if (view === "assigned_requests") {
                url += `&assigned_to=${user.user_id}`;
            } else if (view === 'need_handle') {
                url += `&need_handle=${user.user_id}`;
            }

            console.log(url);
            

            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
            });

            if (!res.ok) {
                throw new Error("Failed to fetch requests.");
            }

            const data = await res.json();
            setRequests(data.data);
            setTotalItems(data.totalItems);
            setTotalPages(data.totalPages);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests(currentPage);
    }, [currentPage, user.id, view]);

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    if (loading) return <p>Loading requests...</p>;
    if (error) return <p>Error: {error}</p>;

    let title
    switch (view) {
        case "my_requests":
            title = "Your Created Requests";
            break;
        case "facility_requests":
            title = "Facility Requests";
            break;
        case "assigned_requests":
            title = "Requests Assigned to You";
            break;
        default:
            title = "Requests";
    }

    return (
        <div className="bg-white shadow-md p-6 rounded-lg md:col-span-3">
            <h2 className="text-xl font-semibold mb-4">{title}</h2>
            
            {/* Table for Requests */}
            <table className="w-full table-auto">
                <thead>
                    <tr>
                        <th className="w-1/12 px-4 py-2">No.</th>
                        <th className="w-3/12 px-4 py-2">Title</th>
                        <th className="w-2/12 px-4 py-2">Facility</th>
                        <th className="w-1/12 px-4 py-2">Manager</th>
                        <th className="w-1/12 px-4 py-2">Technician</th>
                        <th className="w-2/12 px-4 py-2">Status</th>
                        <th className="w-2/12 px-4 py-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {requests.length === 0 ? (
                        <tr>
                            <td colSpan="4" className="text-center py-4">No requests found.</td>
                        </tr>
                    ) : (
                        requests.map((req, index) => (
                            <tr key={req.request_id} className={`border-b ${(req.closing_reason && !req.manager_handle) ? "bg-yellow-200" : ""}`}>
                                <td className="px-4 py-2 text-center">{(currentPage - 1) * 10 + index + 1}</td>
                                <td className="px-4 py-2">{req.title}</td>
                                <td className="px-4 py-2 text-center">{req.facility}</td>
                                <td className="px-4 py-2 text-center">{req.assigned_by}</td>
                                <td className="px-4 py-2 text-center">{req.assigned_to}</td>
                                <td className="px-4 py-2 text-center"><span className={`block py-1 text-sm rounded font-bold text-white ${statusStyle[req.status.toLowerCase().replace(/\s+/g, '')]}`}>{req.status}</span></td>
                                <td className="px-4 py-2 text-center">
                                <a
                                    href={`/request-detail/${req.request_id}`}
                                    className="text-blue-300 hover:underline text-sm"
                                >
                                    View Details
                                </a>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
                <button
                    className="bg-gray-300 p-2 rounded"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    Previous
                </button>
                <span>
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    className="bg-gray-300 p-2 rounded"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
