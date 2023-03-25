const jwt = require("jsonwebtoken");

module.exports = async function isAuthenticated(req, res, next) {
    const token = req.headers["Authorization"].split(" ")[1];
    jwt.verify(token, "this_is_secret", (err, user) => {
        if (err) {
            return res.json({ message: err });
        } else {
            req.user = user;
            next();
        }
    });

};