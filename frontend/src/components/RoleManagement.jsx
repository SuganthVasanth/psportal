import React, { useState } from "react";
import "./RoleManagement.css";

export default function RoleManagement({ userRole }) {
    const [roleName, setRoleName] = useState("");
    const [description, setDescription] = useState("");

    const [assignEmail, setAssignEmail] = useState("");
    const [assignRoleName, setAssignRoleName] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleCreateRole = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        try {
            const response = await fetch("http://localhost:5000/api/roles/create-role", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ role_name: roleName, description }),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(data.message || "Role created successfully");
                setRoleName("");
                setDescription("");
            } else {
                setError(data.message || "Failed to create role");
            }
        } catch (err) {
            setError("An error occurred");
        }
    };

    const handleAssignRole = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        try {
            const response = await fetch("http://localhost:5000/api/roles/assign-role", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ email: assignEmail, role_name: assignRoleName }),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(data.message || "Role assigned successfully");
                setAssignEmail("");
                setAssignRoleName("");
            } else {
                setError(data.message || "Failed to assign role");
            }
        } catch (err) {
            setError("An error occurred");
        }
    };

    return (
        <div className="role-management">
            <h3>Role Management</h3>

            {message && <div className="success-msg">{message}</div>}
            {error && <div className="error-msg">{error}</div>}

            {userRole === "super_admin" && (
                <div className="form-section">
                    <h4>Create New Role</h4>
                    <form onSubmit={handleCreateRole}>
                        <input
                            type="text"
                            placeholder="Role Name"
                            value={roleName}
                            onChange={(e) => setRoleName(e.target.value)}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        <button type="submit">Create Role</button>
                    </form>
                </div>
            )}

            {(userRole === "super_admin" || userRole === "admin") && (
                <div className="form-section">
                    <h4>Assign Role to User</h4>
                    <form onSubmit={handleAssignRole}>
                        <input
                            type="email"
                            placeholder="User Email"
                            value={assignEmail}
                            onChange={(e) => setAssignEmail(e.target.value)}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Role Name (e.g., student, teacher)"
                            value={assignRoleName}
                            onChange={(e) => setAssignRoleName(e.target.value)}
                            required
                        />
                        <button type="submit">Assign Role</button>
                    </form>
                </div>
            )}
        </div>
    );
}
