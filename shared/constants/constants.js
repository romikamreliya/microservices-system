class Constants {
  
    // User Roles
    static role = {
        admin: "admin",
        user: "user",
        guest: "guest",
    };

    // Pagination
    static pagination = {
        default_page: 1,
        default_limit: 10,
        max_limit: 100,
    };

    // Regular Expressions
    static regex = {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^[\d\s\-\+\(\)]{10,}$/,
        password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    };
}

module.exports = new Constants();
