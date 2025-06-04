const jwt = require('jsonwebtoken')
function generateOTP(length = 6) {
    return Math.floor(100000 + Math.random() * 900000);
}
function generateUserAuthToken(userId, expiresIn = '30d') {
    const payload = { userId };
    const options = { expiresIn: expiresIn };

    const token = jwt.sign(payload, process.env.AUTH_SECRET_KEY, options);
    return token;
}
function verifyUserAuthToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.AUTH_SECRET_KEY);
        return decoded;
    } catch (err) {
        return null;
    }
}

const arraysEqual = (a, b) =>{
    return (a.length === b.length && a.every((val, index) => val === b[index]));

}
module.exports = { generateOTP, generateUserAuthToken, verifyUserAuthToken,arraysEqual }