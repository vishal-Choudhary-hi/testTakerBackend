const { verifyUserAuthToken } = require("../utils/commonUtility");
const { getUserData, setUserData } = require('../utils/userUtility');
const { apiLog } = require("../utils/LogUtility");
const { prisma } = require("../prisma/getPrismaClient");

async function setUserDataMiddleware(req, res, next) {
    try {
        const authHeader = req.headers["authorization"];
        const decodedToken = verifyUserAuthToken(authHeader);
        if (!decodedToken) {
            throw new Error("Invalid Authentication. Please login again.");
        }
        let userData = await prisma.user.findUnique({
            where: { id: decodedToken.userId, status: true }
        })
        if (!userData) {
            throw new Error("User not present");
        }
        setUserData(userData);
        next();
    } catch (error) {
        let statusCode = 401;
        let resBody = {
            'data': null,
            'message': error.message
        };
        apiLog(req, resBody, statusCode);
        res.status(statusCode);
        res.json(resBody);
    }
}

module.exports = { setUserDataMiddleware };