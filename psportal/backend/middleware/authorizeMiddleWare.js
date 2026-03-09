module.exports = function (requiredRoles) {
  return (req, res, next) => {
    const userRoles = req.user.roles;

    const allowed = requiredRoles.some(role =>
      userRoles.includes(role)
    );

    if (!allowed) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};