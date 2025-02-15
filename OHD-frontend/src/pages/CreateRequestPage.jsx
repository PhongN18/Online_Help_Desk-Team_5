import RequestForm from "@/components/RequestForm";

export default function CreateRequestPage() {
  // Mock facility list (Replace with API call later)
    const facilities = [
        { facility_id: "lab_a", name: "Lab A" },
        { facility_id: "library", name: "Library" },
        { facility_id: "hostel", name: "Hostel" },
    ];

    const loggedInUserId = "user_123"; // Replace with actual user ID from auth

    return (
        <div className="custom-container">
            <div className="flex items-center justify-center min-h-screen p-4">
                <RequestForm facilities={facilities} userId={loggedInUserId} />
            </div>
        </div>
    )
}
