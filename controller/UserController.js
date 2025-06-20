const { getUserData, setUserData } = require('../utils/userUtility')
const { prisma } = require('../prisma/getPrismaClient');
const { sendMail } = require('../utils/EmailUtility');
const { apiLog } = require('../utils/LogUtility');
const commonUtility = require('../utils/commonUtility');
const Joi = require("joi");

const getUser = async (req, res) => {
    let resBody = null;
    let statusCode = 200;
    try {
        const userData= getUserData();
        resBody = {
            'data': userData,
            'message': 'Hi ' + userData.name + ', Welcome to the TeatEra'
        };
    } catch (error) {
        statusCode = 400;
        resBody = {
            'data': null,
            'message': error.message

        };
        console.error(error);
    }
    apiLog(req, resBody, statusCode);
    return res.status(statusCode).json(resBody);
}
const getUserWithEmail = async (req, res) => {
    let resBody = null;
    let statusCode = 200;
    const ValidationJson = Joi.object({
        email: Joi.string().email().required(),
    });
    try {
        const { error } = ValidationJson.validate(req.body);
        if (error) {
            apiLog(req, resBody, statusCode);
            return res.status(400).json({ error: error.details[0].message });
        }
        let email = req.body.email;
        const userWithEmail = await prisma.user.findUnique({
            where: { emailId: email, status: true }
        });
        if (!userWithEmail) {
            throw new Error("User not registered");
        }
        let alreadyRegisteredUser = true;
        otpData = {
            "name": userWithEmail.name,
            email,
            alreadyRegisteredUser
        };
        GenerateAndSendAuthenticationOTP(otpData);
        resBody = {
            "data": {
                'userId': userWithEmail.id,
                alreadyRegisteredUser,
            },
            "message": `OTP send on email ${email}`
        }
    } catch (error) {
        statusCode = 400;
        resBody = {
            'data': null,
            'message': error.message
        };
        console.error(error);
    }
    apiLog(req, resBody, statusCode);
    return res.status(statusCode).json(resBody);
}
const registerNewUser = async (req, res) => {
    let resBody = null;
    let statusCode = 200;
    const ValidationJson = Joi.object({
        email: Joi.string().email().required(),
        name: Joi.string().optional(),
    });
    try {
        const { error } = ValidationJson.validate(req.body);
        if (error) {
            apiLog(req, resBody, statusCode);
            return res.status(400).json({ error: error.details[0].message });
        }
        let email = req.body.email;
        let name = req.body.name;
        let userWithEmail = await prisma.user.findUnique({
            where: { emailId: email}
        });
        if (userWithEmail) {
            throw new Error('EmailId Already Registered');
        }
        userWithEmail = await prisma.user.create({
            data: { 
                emailId: email,
                name: name,
                status: true
            }
        });
        let alreadyRegisteredUser = false;
        otpData = {
            name,
            email,
            alreadyRegisteredUser
        };
        GenerateAndSendAuthenticationOTP(otpData);
        resBody = {
            "data": {
                'userId': userWithEmail.id,
                alreadyRegisteredUser,
            },
            "message": `OTP send on email ${email}`
        }
    } catch (error) {
        statusCode = 400;
        resBody = {
            'data': null,
            'message': error.message
        };
        console.error(error);
    }
    apiLog(req, resBody, statusCode);
    return res.status(statusCode).json(resBody);
}
const verifyOTP = async (req, res) => {
    let resBody = null;
    let statusCode = 200;
    const ValidationJson = Joi.object({
        userId: Joi.number().integer().required(),
        otp: Joi.number().integer().min(100000).max(999999).required()
    });
    try {
        const { error } = ValidationJson.validate(req.body);
        if (error) {
            apiLog(req, resBody, statusCode);
            return res.status(400).json({ error: error.details[0].message });
        }
        const userId = req.body.userId;
        const otp = req.body.otp;
        const userWithIdOtp = await prisma.user.findFirst({
            where: {
                id: userId,
                otp: otp
            }
        });
        if (!userWithIdOtp) {
            throw new Error("OTP did not match");
        }
        await prisma.user.update({
            where: { id: userId },
            data: { status: true }
        });
        const token = commonUtility.generateUserAuthToken(userWithIdOtp.id);
        resBody = {
            'data': { ...userWithIdOtp, token },
            'message': "Email ID Verified"
        };
    } catch (error) {
        statusCode = 400;
        resBody = {
            'data': null,
            'message': error.message
        };
        console.error(error);
    }
    apiLog(req, resBody, statusCode);
    return res.status(statusCode).json(resBody);
}
const GenerateAndSendAuthenticationOTP = async (data) => {
    let email = data.email;
    let name = data.name;
    let alreadyRegisteredUser = data.alreadyRegisteredUser;
    const otp = commonUtility.generateOTP(6);
    let user = await prisma.user.upsert({
        where: { emailId: email },
        update: { otp: otp },
        create: { emailId: email, name: name, otp: otp, status: false }
    });
    setUserData(user);
    let emailData = {
        otp,
        "email": email,
        'userName': name,
        "alreadyRegisteredUser": alreadyRegisteredUser
    };
    let emailStatus = await sendMail(email, 'UserOTP', emailData);
    if (!emailStatus) {
        throw new Error("error while sending email");
    }
}

const getUserTestMessage=async (req, res) => {
    let resBody = null;
    let statusCode = 200;
    const ValidationJson = Joi.object({
        testId: Joi.number().integer().required(),
        receiverId:Joi.number().integer().optional()
    });
    try {
        const { error } = ValidationJson.validate(req.query);
        if (error) {
            apiLog(req, resBody, statusCode);
            return res.status(400).json({ error: error.details[0].message });
        }
        const userId = getUserData().id;
        if (!userId) {
            throw new Error("User not authenticated");
        }
        let additionalFilters = {};
        if(req.query.receiver_id){
            additionalFilters.receiver_id = req.query.receiver_id;
        }
        const testMessages = await prisma.testChats.findMany({
            where: { sender_id: userId,test_id: parseInt(req.query.testId),...additionalFilters },
        });
        resBody = {
            'data': testMessages,
            'message': 'Test messages retrieved successfully'
        };
    } catch (error) {
        statusCode = 400;
        resBody = {
            'data': null,
            'message': error.message
        };
        console.error(error);
    }
    apiLog(req, resBody, statusCode);
    return res.status(statusCode).json(resBody);
}

module.exports = { getUser, registerNewUser, verifyOTP, getUserWithEmail, getUserTestMessage }