import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function OAuthSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      navigate("/", { replace: true });
      return;
    }
    localStorage.setItem("token", token);
    try {
      const decoded = jwtDecode(token);
      const rawRoles = decoded.roles;
      if (rawRoles && rawRoles.length > 0) {
        const roles = rawRoles.map((r) =>
          (typeof r === "string" ? r : r.role_name || r || "").toLowerCase()
        );
        localStorage.setItem("roles", JSON.stringify(roles));
        let primaryRole = "student";
        if (roles.includes("super_admin")) primaryRole = "super_admin";
        else if (roles.includes("admin")) primaryRole = "admin";
        else primaryRole = roles[0];
        localStorage.setItem("role", primaryRole);
      } else {
        localStorage.setItem("roles", JSON.stringify(["student"]));
        localStorage.setItem("role", "student");
      }
      if (decoded.email) {
        localStorage.setItem("userName", String(decoded.email).split("@")[0]);
      }
    } catch {
      localStorage.setItem("roles", JSON.stringify(["student"]));
      localStorage.setItem("role", "student");
    }
    navigate("/dashboard", { replace: true });
  }, [params, navigate]);

  return <p>Logging you in...</p>;
}
