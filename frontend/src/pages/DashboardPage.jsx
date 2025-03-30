import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

function DashboardPage() {
  const { logout, user } = useAuthStore();
  const [documents, setDocuments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("https://warrenty-me-assignment.onrender.com/api/documents")
      .then((res) => res.json())
      .then((data) => setDocuments(data))
      .catch((err) => console.error("Error fetching documents", err));
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const createNewDocument = async () => {
    const response = await fetch("https://warrenty-me-assignment.onrender.com/api/documents", {
      method: "POST",
    });
    const newDoc = await response.json();
    navigate(`/document/${newDoc._id}`);
  };

  return (
    <div>
      <div className="flex justify-between p-4">
        <h1>Welcome, {user.name}</h1>
        <button onClick={handleLogout}>Log out</button>
      </div>
      <button
        onClick={createNewDocument}
        className="pl-4 bg-blue-500 text-white p-2 rounded"
      >
        Create New Document
      </button>
      <ul>
        {documents.map((doc, index) => (
          <li key={doc._id}>
            <a href={`/document/${doc._id}`} className="ml-4 text-blue-500">
              Document {index + 1}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DashboardPage;
