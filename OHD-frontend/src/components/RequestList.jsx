import { useEffect, useState } from "react";

export default function RequestList({ user }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`http://localhost:5000/api/requests?user_id=${user.id}`)
            .then((res) => res.json())
            .then((data) => {
                setRequests(data);
                setLoading(false);
            });
    }, [user.id]);

    if (loading) return <p>Loading requests...</p>;

    return (
        <div className="bg-white shadow-md p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Your Requests</h2>
            {requests.length === 0 ? (
                <p>No requests found.</p>
            ) : (
                <ul>
                    {requests.map((req) => (
                        <li key={req.request_id} className="border-b py-2">
                            <strong>{req.facility}</strong> - {req.status}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
