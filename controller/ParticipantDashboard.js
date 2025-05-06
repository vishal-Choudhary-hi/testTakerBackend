const Joi = require("joi");
const axios = require('axios');
const { apiLog } = require('../utils/LogUtility');
const { prisma } = require('../prisma/getPrismaClient');
const { getUserData } = require('../utils/userUtility')

const allUserParticipationTest = async (req, res) => {
    let resBody = null;
    let statusCode = 200;
    const ValidationJson = Joi.object({
        page: Joi.number().required(),
        limit: Joi.number().required(),
        search: Joi.optional(),
        status: Joi.optional(),
        startDate: Joi.optional(),
        endDate: Joi.optional(),
    });
    try {
        const { error } = ValidationJson.validate(req.query);
        if (error) {
            const errorMessage = error.details[0]?.message || "Invalid query parameters";
            statusCode = 400;
            resBody = { error: errorMessage };
            apiLog(req, resBody, statusCode);
            return res.status(statusCode).json(resBody);
        }
        const userData = getUserData();
        const getPaginatedTests = async (userId, page = 1, limit = 5) => {
            const skip = (page - 1) * limit;
            const allTestParticipant = await prisma.testInvitation.findMany({
                where: {
                    status: true,
                    email: userData.emailId
                },
                select: {
                    test_id: true
                }
            });
            const allTestIds = allTestParticipant.map(participant => participant.test_id);
            const [testData, totalCount] = await Promise.all([
                prisma.test.findMany({
                    where: {
                        id: {
                            in: allTestIds
                        }
                    },
                    skip: skip,
                    take: +limit,
                    orderBy: { id: "desc" },
                }),
                prisma.test.count({
                    where: { created_by: userId }
                })
            ]);

            return {
                tests: testData,
                totalPages: Math.ceil(totalCount / limit),
                currentPage: page
            };
        };
        let data = await getPaginatedTests(userData.id, req.query.page, req.query.limit);
        resBody = {
            data: data,
            message: "Test Details Saved Successfully"
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
const getTestBasicDetails = async (req, res) => {
    let resBody = null;
    let statusCode = 200;
    const ValidationJson = Joi.object({
        testId: Joi.number().required(),
    });
    try {
        const { error } = ValidationJson.validate(req.query);
        if (error) {
            const errorMessage = error.details[0]?.message || "Invalid query parameters";
            statusCode = 400;
            resBody = { error: errorMessage };
            apiLog(req, resBody, statusCode);
            return res.status(statusCode).json(resBody);
        }
        const userData = getUserData();
        const testId = req.query.testId;
        const testBasicDetails = await prisma.testInvitation.findFirst({
            where: {
                status: true,
                email: userData.emailId,
                test_id: parseInt(testId),
            },
            select: {
                name: true,
                verification_image_document_id: true,
                accepted: true,
                additional_details: true,
                email_status: true,
                Test: {
                    select: {
                        test_name: true,
                        description: true,
                        study_material: true,
                        invite_email_additional_content: true,
                        start_time: true,
                        end_time: true,
                        duration_in_seconds: true,
                        status: true,
                        TestInstructions: {
                            select: {
                                heading: true,
                                description: true,
                            },
                        },
                    },
                },
                TestParticipant: {
                    select: {
                        participated: true,
                    },
                },
            },
        });

        if (!testBasicDetails) {
            throw new Error("User Not Invited ti participate in this test");
        }
        resBody = {
            data: testBasicDetails,
            message: "Test Details Saved Successfully"
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
const acceptInvitation = async (req, res) => {
    let resBody = null;
    let statusCode = 200;
    const ValidationJson = Joi.object({
        testId: Joi.number().required(),
    });
    try {
        const { error } = ValidationJson.validate(req.body);
        if (error) {
            const errorMessage = error.details[0]?.message || "Invalid Parameters";
            statusCode = 400;
            resBody = { error: errorMessage };
            apiLog(req, resBody, statusCode);
            return res.status(statusCode).json(resBody);
        }
        const userData = getUserData();
        const testId = req.body.testId;
        const testBasicDetails = await prisma.testInvitation.update({
            where: {
                test_id_email: {
                    test_id: parseInt(testId),
                    email: userData.emailId
                },
                status: true,
            },
            data: {
                accepted: true
            }
        });

        if (!testBasicDetails) {
            throw new Error("User Not Invited ti participate in this test");
        }
        resBody = {
            data: testBasicDetails,
            message: "Test Details Saved Successfully"
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

const getTestVerificationImage = async (req, res) => {
    let resBody = null;
    let statusCode = 200;

    const ValidationSchema = Joi.object({
        testId: Joi.number().required(),
    });

    try {
        const { error } = ValidationSchema.validate(req.query);
        if (error) {
            const errorMessage = error.details[0]?.message || "Invalid Parameters";
            statusCode = 400;
            resBody = { error: errorMessage };
            apiLog(req, resBody, statusCode);
            return res.status(statusCode).json(resBody);
        }

        const userData = getUserData(req);
        const { testId } = req.query;
        const testBasicDetails = await prisma.testInvitation.findFirst({
            where: {
                test_id: parseInt(testId),
                email: userData.emailId,
                status: true,
            },
            select: {
                VerificationImage: {
                    select: {
                        link: true
                    }
                }
            }
        });
        if (!testBasicDetails) {
            throw new Error("User Not Invited to participate in this test");
        }
        const referenceImageUrl = testBasicDetails.VerificationImage.link;
        const imageResponse = await axios.get(referenceImageUrl, {
            responseType: 'arraybuffer',
        });

        const referenceImageBase64 = `data:image/jpeg;base64,${Buffer.from(imageResponse.data, 'binary').toString('base64')}`;
        resBody = {
            data: {
                image: referenceImageBase64
            },
            message: "Image Returned"
        };
    } catch (error) {
        statusCode = 400;
        resBody = {
            data: null,
            message: error.message
        };
        console.error(error);
    }

    apiLog(req, resBody, statusCode);
    return res.status(statusCode).json(resBody);
};
const getTestQuestionSections = async (req, res) => {
    let resBody = null;
    let statusCode = 200;

    const ValidationSchema = Joi.object({
        testId: Joi.number().required(),
    });

    try {
        const { error } = ValidationSchema.validate(req.query);
        if (error) {
            const errorMessage = error.details[0]?.message || "Invalid Parameters";
            statusCode = 400;
            resBody = { error: errorMessage };
            apiLog(req, resBody, statusCode);
            return res.status(statusCode).json(resBody);
        }
        const { testId } = req.query;
        const testQuestionDetails = await prisma.questionSection.findMany({
            where: {
                test_id: parseInt(testId),
            },
            select: {
                label: true,
                description: true,
                total_score: true,
                sequence: true,
                Question: {
                    select: {
                        sequence: true,
                        type_id: true,
                        question: true,
                        image: true,
                        negative_score_on_wrong_answer: true,
                        score_on_correct_answer: true,
                        manual_scoring: true,
                        Options: {
                            select: {
                                description: true,
                                image: true
                            }
                        }
                    }
                }
            }
        });
        resBody = {
            data: {
                questionSections: testQuestionDetails
            },
            message: "Questions Fetched"
        };
    } catch (error) {
        statusCode = 400;
        resBody = {
            data: null,
            message: error.message
        };
        console.error(error);
    }

    apiLog(req, resBody, statusCode);
    return res.status(statusCode).json(resBody);
};


module.exports = { allUserParticipationTest, getTestBasicDetails, acceptInvitation, getTestVerificationImage, getTestQuestionSections };