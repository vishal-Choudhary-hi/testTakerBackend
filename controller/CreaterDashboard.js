const { getUserData, setUserData } = require('../utils/userUtility')
const { prisma } = require('../prisma/getPrismaClient');
const { apiLog } = require('../utils/LogUtility');
const Joi = require("joi");
const bulkTestInviteEmailQueue = require('../queue/bulkTestInviteEmailQueue');
const { sendMail } = require('../utils/EmailUtility');

const createNewTest = async (req, res) => {
    let resBody = null;
    let statusCode = 200;
    const ValidationJson = Joi.object({
        testName: Joi.string().required(),
        testDescription: Joi.string().required(),
        testStartTime: Joi.date().required(),
        testEndTime: Joi.date().required(),
        testDurationInSeconds: Joi.number().required(),
        studyMaterial: Joi.optional(),
        inviteEmailAdditionalContent: Joi.optional(),
        testId: Joi.optional(),
        testInstructions: Joi.array().items(
            Joi.object({
                heading: Joi.string().required(),
                description: Joi.string().required(),
            })
        ).optional(),
    });
    try {
        const userData = getUserData();
        const { error } = ValidationJson.validate(req.body);
        if (error) {
            const errorMessage = error.details[0]?.message || "Invalid query parameters";
            statusCode = 400;
            resBody = { error: errorMessage };
            apiLog(req, resBody, statusCode);
            return res.status(statusCode).json(resBody);
        }
        let testInstructions = [];

        if (Array.isArray(req.body.testInstructions)) {
            testInstructions = req.body.testInstructions.map(element => ({
                heading: element.heading,
                description: element.description,
                created_by: userData.id
            }));
        }

        let data = {
            test_name: req.body.testName,
            description: req.body.testDescription,
            study_material: req.body.studyMaterial,
            invite_email_additional_content: req.body.inviteEmailAdditionalContent,
            start_time: new Date(req.body.testStartTime),
            end_time: new Date(req.body.testEndTime),
            duration_in_seconds: req.body.testDurationInSeconds,
            created_by: userData.id,
            status: 'draft',
            TestInstructions: { create: testInstructions }
        };
        let testData;
        let testId = parseInt(req.body.testId)
        if (testId) {
            await prisma.testInstruction.deleteMany({
                where: { test_id: testId },
            });
            testData = await prisma.test.upsert({
                where: { id: testId },
                update: data,
                create: data
            });
        } else {
            testData = await prisma.test.create({ data: data });
        }
        resBody = {
            data: testData,
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

const getAllTest = async (req, res) => {
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
            const skip = (page - 1) * limit; // Calculate offset

            const [testData, totalCount] = await Promise.all([
                prisma.test.findMany({
                    where: { created_by: userId },
                    skip: skip,
                    take: +limit,
                    orderBy: { id: "desc" }, // Order by latest created tests (optional)
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

const updateTestQuestion = async (req, res) => {
    let resBody = null;
    let statusCode = 200;
    const ValidationJson = Joi.object({
        testId: Joi.number().required(),
        questionSections: Joi.array().items(
            Joi.object({
                description: Joi.string().required(),
                label: Joi.string().required(),
                totalScore: Joi.number().integer().required(),
                questions: Joi.array().items(
                    Joi.object({
                        question: Joi.string().required(),
                        negativeMarks: Joi.number().integer().optional(),
                        questionTypeId: Joi.number().integer().required(),
                        score: Joi.number().integer().required(),
                        image: Joi.any(),
                        manual_scoring: Joi.boolean(),
                        options: Joi.array().items(
                            Joi.object({
                                isCorrect: Joi.boolean(),
                                description: Joi.string().required(),
                                image: Joi.string().allow('', null).optional()
                            })
                        )
                    })
                )
            })
        ).required(),

    });
    try {
        const { error } = ValidationJson.validate(req.body);
        if (error) {
            const errorMessage = error.details[0]?.message || "Invalid Request";
            statusCode = 400;
            resBody = { error: errorMessage };
            apiLog(req, resBody, statusCode);
            return res.status(statusCode).json(resBody);
        }
        const userData = getUserData();
        const test_id = req.body.testId;
        await prisma.option.deleteMany({
            where: {
                Question: {
                    QuestionSection: {
                        test_id: test_id
                    }
                }
            }
        });
        await prisma.question.deleteMany({
            where: {
                QuestionSection: {
                    test_id: test_id
                }
            }
        });
        await prisma.questionSection.deleteMany({
            where: {
                test_id: test_id
            }
        });
        let reqSection = req.body.questionSections;
        reqSection.forEach(async (section) => {
            let createdSectionId = await prisma.questionSection.create({
                data: {
                    test_id: test_id,
                    label: section.label,
                    description: section.description,
                    total_score: section.totalScore,
                    created_by: userData.id
                },
                select: {
                    id: true
                }
            });
            let sectionQuestions = section.questions;
            let QuestionCount = 1;
            sectionQuestions.forEach(async (question) => {
                let questionId = await prisma.question.create({
                    data: {
                        question_section_id: createdSectionId.id,
                        sequence: QuestionCount,
                        type_id: question.questionTypeId,
                        question: question.question,
                        image: question.image,
                        negative_score_on_wrong_answer: question.negativeMarks,
                        score_on_correct_answer: question.score,
                        manual_scoring: question.manual_scoring ?? false,
                        created_by: userData.id
                    },
                    select: {
                        id: true
                    }
                })
                let options = question.options;
                options.forEach(async (option) => {
                    await prisma.option.create({
                        data: {
                            question_id: questionId.id,
                            description: option.description,
                            image: option.image,
                            is_correct: option.isCorrect,
                            created_by: userData.id
                        }
                    })
                });
            })
        });
        resBody = {
            data: [],
            message: "Test Details Saved Successfully"
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
const getQuestionTypes = async (req, res) => {
    let resBody = null;
    let statusCode = 200;
    const ValidationJson = Joi.object({
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
        let questionData = await prisma.questionType.findMany({
            select: {
                id: true,
                type: true,
                label: true,
                description: true,
                allow_options: true,
                allow_multiple_correct_answer: true,
                score_manually: true
            }
        })
        resBody = {
            data: questionData,
            message: "Question Types Returned Successfully"
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

const getTestWithId = async (req, res) => {
    let resBody = null;
    let statusCode = 200;
    const ValidationJson = Joi.object({
        testId: Joi.number().integer().required(),
        role: Joi.string()
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
        const role = req.query.role;
        const testId = req.query.testId;
        const userData = getUserData();
        if (role === 'creator') {
            const createrTest = await prisma.test.findFirst({
                where: {
                    id: parseInt(testId),
                    created_by: userData.id
                }
            })
            if (!createrTest) {
                throw new Error("Unauthorized Access");
            }
        } else if (role == 'participant') {
            const testInvitation = await prisma.testInvitation.findFirst({
                where: {
                    test_id: parseInt(testId),
                    email: userData.emailId,
                    status: true
                }
            })
            if (!testInvitation) {
                throw new Error("Unauthorized Access");
            }
        } else {
            throw new Error("Unauthorized Access");
        }
        let testDetails = await prisma.test.findUnique({
            where: { id: parseInt(testId) },
            select: {
                id: true,
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
                        description: true
                    }
                },
                TestInvitations: {
                    where: {
                        status: true
                    },
                    select: {
                        email: true,
                        name: true,
                        accepted: true,
                        additional_details: true,
                        email_status: true,
                        verification_image_document_id: true,
                        VerificationImage: {
                            select: {
                                link: true
                            }
                        }
                    }
                },
                QuestionSection: {
                    select: {
                        label: true,
                        description: true,
                        total_score: true,
                        sequence: true,
                        Question: {
                            select: {
                                type_id: true,
                                question: true,
                                image: true,
                                negative_score_on_wrong_answer: true,
                                score_on_correct_answer: true,
                                manual_scoring: true,
                                Options: {
                                    select: {
                                        description: true,
                                        image: true,
                                        is_correct: true,
                                    }
                                }
                            }
                        }

                    }
                }
            }
        });

        resBody = {
            data: testDetails,
            message: "Test Details Returned Successfully"
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

const inviteParticipants = async (req, res) => {
    let resBody = null;
    let statusCode = 200;
    const ValidationJson = Joi.object({
        testId: Joi.number().integer().required(),
        testInvitations: Joi.array().items(
            Joi.object({
                name: Joi.string().required(),
                email: Joi.string().required(),
                verification_image_document_id: Joi.number().required()
            }).required()
        )
    });
    try {
        const { error } = ValidationJson.validate(req.body);
        if (error) {
            const errorMessage = error.details[0]?.message || "Invalid query parameters";
            statusCode = 400;
            resBody = { error: errorMessage };
            apiLog(req, resBody, statusCode);
            return res.status(statusCode).json(resBody);
        }
        const userData = getUserData();
        const testId = req.body.testId;
        const invitationArray = req.body.testInvitations;
        let invitations = [];
        let emailIds = [];
        invitationArray.forEach(element => {
            emailIds.push(element.email);
            invitations.push({
                email: element.email,
                name: element.name,
                verification_image_document_id: element.verification_image_document_id,
                test_id: testId,
                created_by: userData.id,
                additional_details: element.additional_details,
                status: true
            })
        });
        const invitationUpsertPromises = invitations.map(invitation => {
            return prisma.testInvitation.upsert({
                where: {
                    test_id_email: {
                        test_id: invitation.test_id,
                        email: invitation.email
                    }
                },
                update: { status: true, verification_image_document_id: invitation.verification_image_document_id },
                create: {
                    email: invitation.email,
                    name: invitation.name,
                    created_by: invitation.created_by,
                    additional_details: invitation.additional_details,
                    status: invitation.status,
                    Test: {
                        connect: { id: invitation.test_id }
                    },
                    VerificationImage: {
                        connect: { id: invitation.verification_image_document_id }
                    }
                }
            })
        });
        await prisma.$transaction(invitationUpsertPromises);
        await prisma.testInvitation.updateMany({
            where: {
                test_id: testId,
                email: {
                    notIn: emailIds
                }
            },
            data: { status: false }
        });
        await sendBulkTestInviteEmail(testId);
        resBody = {
            data: [],
            message: "Test Invitations Saved Successfully",
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

const changeTestStatus = async (req, res) => {
    let resBody = null;
    let statusCode = 200;
    const ValidationJson = Joi.object({
        testId: Joi.number().integer().required(),
        status: Joi.string().required()
    });
    try {
        const { error } = ValidationJson.validate(req.body);
        if (error) {
            const errorMessage = error.details[0]?.message || "Invalid query parameters";
            statusCode = 400;
            resBody = { error: errorMessage };
            apiLog(req, resBody, statusCode);
            return res.status(statusCode).json(resBody);
        }
        const userData = getUserData();
        const testId = req.body.testId;
        const status = req.body.status;
        const testDetails = await prisma.test.findFirst({
            where: {
                id: testId
            }
        });
        if (!testDetails) {
            throw new Error("No test found");
        }
        if (status == 'live') {
            const now = new Date();
            const testStartTime = new Date(testDetails.start_time);
            if (testStartTime < now) {
                throw new Error("Test Has Already Started");
            }
        }
        if (status == 'result_pending') {
            const now = new Date();
            const testEndTime = new Date(testDetails.end_time);
            if (testEndTime > now) {
                throw new Error("Test Is Not Yet Ended");
            }
        }
        await prisma.test.update({
            where: {
                id: testId
            },
            data: {
                status: status
            }
        })
        if (status == 'live') {
            await sendBulkTestInviteEmail(testId);
        }
        resBody = {
            data: [],
            message: "Test Status Changed Successfully",
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

const sendBulkTestInviteEmail = async (testID) => {
    const data = await prisma.test.findUnique({
        where: {
            id: testID
        },
        select: {
            test_name: true,
            description: true,
            invite_email_additional_content: true,
            start_time: true,
            end_time: true,
            duration_in_seconds: true,
            TestInvitations: {
                where: {
                    email_status: false,
                    status: true
                },
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            CreatedByUser: true
        }
    });
    let successEmailSentTestInvitationId = await Promise.all(
        data.TestInvitations.map(async (testInvitation) => {
            try {
                let additionalDetails = {
                    testName: data.test_name,
                    description: data.description,
                    inviteEmailAdditionalContent: data.invite_email_additional_content,
                    startTime: data.start_time,
                    endTime: data.end_time,
                    durationInSeconds: data.duration_in_seconds,
                    testInvitationName: testInvitation.name,
                    testInviterName: data.CreatedByUser.name,
                    testLink: process.env.APP_URL
                };
                await sendMail(testInvitation.email, "testInviteEmail", additionalDetails);
                return testInvitation.id;
            } catch (error) {
                console.error(error);
                return null; // return null so you can filter it later
            }
        })
    );
    successEmailSentTestInvitationId = successEmailSentTestInvitationId.filter(id => id !== null);
    if (successEmailSentTestInvitationId.length > 0) {
        await prisma.testInvitation.updateMany({
            where: {
                id: {
                    in: successEmailSentTestInvitationId
                }
            },
            data: {
                email_status: true
            }
        });
    }
}

module.exports = { createNewTest, updateTestQuestion, getQuestionTypes, getAllTest, getTestWithId, inviteParticipants, changeTestStatus };