const { prisma } = require('../prisma/getPrismaClient');
const { getUserData, setUserData } = require('../utils/userUtility')

const apiLog = async (req, res, statusCode) => {
    try {
        let userData = getUserData();
        let logData = {
            "type": "api",
            "typeName": req.originalUrl,
            "url": `${req.protocol}://${req.get("host")}${req.originalUrl}`,
            "method": req.method,
            "request": req.body,
            "response": res,
            "headers": req.headers,
            "status": statusCode,
            "userId": userData ? userData.id : null,
        };
        await prisma.log.create({
            data: logData
        });
    }
    catch (error) {
        console.error("Error saving API log:", error);
    }
};

const emailLog = async (emailType, content, isSent, sentOn, failureReason = 'NA') => {
    try {
        let userData = getUserData()
        let emailLogData = {
            "userId": userData ? userData.id : null,
            "emailType": emailType,
            "content": content,
            "status": isSent,
            "sentOn": sentOn,
            "failureReason": failureReason
        }
        await prisma.emailLog.create({
            data: emailLogData
        });
    }
    catch (error) {
        console.error("Error saving API log:", error);
    }
}

module.exports = { apiLog, emailLog }