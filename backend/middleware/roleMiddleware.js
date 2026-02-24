module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles || !Array.isArray(req.user.roles)) {
      return res.status(403).json({ message: "No roles assigned or invalid token structure" });
    }

    // Convert allowed roles to lowercase to match our token storage
    const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());

    // Check if the user has any of the allowed roles
    const hasPermission = req.user.roles.some(userRole =>
      normalizedAllowedRoles.includes(userRole.toLowerCase())
    );

    if (!hasPermission) {
      return res.status(403).json({ message: "Access denied. Insufficient permissions." });
    }

    next();
  };
};