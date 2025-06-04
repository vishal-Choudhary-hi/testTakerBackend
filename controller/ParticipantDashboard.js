const Joi = require("joi");
const axios = require('axios');
const { apiLog } = require('../utils/LogUtility');
const { prisma } = require('../prisma/getPrismaClient');
const { getUserData } = require('../utils/userUtility');
const { arraysEqual } = require("../utils/commonUtility");
const { add } = require("../queue/bulkTestInviteEmailQueue");

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
        let additionalFilters = {};
        if (req.query.search) {
            additionalFilters.test_name = {
                contains: req.query.search,
            };
        }

        if (req.query.status) {
            additionalFilters.status = req.query.status;
        }

        if (req.query.startDate && req.query.endDate) {
            const start = new Date(req.query.startDate);
            const end = new Date(req.query.endDate);

            additionalFilters.AND = [
                {
                    start_time: {
                        lte: end, 
                    },
                },
                {
                    end_time: {
                        gte: start, 
                    },
                },
            ];
        }
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
                        },
                        ...additionalFilters
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
            throw new Error("User Not Invited to participate in this test");
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
                id:true,
                label: true,
                description: true,
                total_score: true,
                sequence: true,
                Question: {
                    select: {
                        id: true,
                    }
                }
            }
        });
        resBody = {
            data: {
                questionSections: testQuestionDetails
            },
            message: "Test Sections Fetched"
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

const sectionTestQuestions=async(req,res)=>{
    let resBody = null;
    let statusCode = 200;

    const ValidationSchema = Joi.object({
        testId: Joi.number().required(),
        sectionId: Joi.number().required(),
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
        const { testId,sectionId } = req.query;
        const testQuestionDetails = await prisma.questionSection.findFirst({
            where: {
                test_id: parseInt(testId),
                id:parseInt(sectionId)
            },
            select: {
                id:true,
                Question: {
                    select: {
                        id: true,
                        sequence: true,
                        type_id: true,
                        question: true,
                        image: true,
                        negative_score_on_wrong_answer: true,
                        score_on_correct_answer: true,
                        manual_scoring: true,
                        Options: {
                            select: {
                                id: true,
                                description: true,
                                image: true,
                            }
                        },
                        QuestionType: {
                            select: {
                                allow_options: true,
                                label: true,
                                type: true,
                                allow_multiple_correct_answer:true,
                                score_manually: true,
                            }
                        }
                    }
                }
            }
        });
        const questions=testQuestionDetails.Question;
        resBody = {
            data: {
                questions
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
}

const startTest=async(req,res)=>{
    let resBody = null;
    let statusCode = 200;
    
    const ValidationSchema = Joi.object({
        testId: Joi.number().required(),
    });
    
    try {
        const { error } = ValidationSchema.validate(req.body);
        if (error) {
            const errorMessage = error.details[0]?.message || "Invalid Parameters";
            statusCode = 400;
            resBody = { error: errorMessage };
            apiLog(req, resBody, statusCode);
            return res.status(statusCode).json(resBody);
        }
        const { testId } = req.body;
        const userData = getUserData();

        const testInvitation = await prisma.testInvitation.findFirst({
            where: {
                test_id: parseInt(testId),
                email: userData.emailId,
                status: true,
            }
        });
        if (! testInvitation) {
            throw new Error("User Not Invited to participate in this test");
        }
        await prisma.testParticipant.upsert({
            where: {
                test_id_test_invitation_id:{
                    test_invitation_id:testInvitation.id,
                    test_id: parseInt(testId),
                }
            },
            create: {
                test_id: parseInt(testId),
                test_invitation_id:testInvitation.id,
                participated: true
            },
            update: {
                participated: true
            }
        });
        resBody = {
            data: null,
            message: "Test Participation Updated"
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
}

const saveAnswer=async(req,res)=>{
    let resBody = null;
    let statusCode = 200;
    
    const ValidationSchema = Joi.object({
        testId: Joi.number().required(),
        questionId: Joi.number().required(),
        optionIds: Joi.array().items(Joi.number()).optional(),
        answer:Joi.any().optional(),
        skipped:Joi.boolean().required()
    });
    
    try {
        const { error } = ValidationSchema.validate(req.body);
        if (error) {
            const errorMessage = error.details[0]?.message || "Invalid Parameters";
            statusCode = 400;
            resBody = { error: errorMessage };
            apiLog(req, resBody, statusCode);
            return res.status(statusCode).json(resBody);
        }
        const { testId,questionId,answer } = req.body;
        const userData = getUserData();

        const testInvitation = await prisma.testInvitation.findFirst({
            where: {
                test_id: parseInt(testId),
                email: userData.emailId,
                status: true,
            },
            select: {
                id: true,
                TestParticipant: {
                    select: {
                        id: true,
                    }
                }
            }
        });
        if (! testInvitation) {
            throw new Error("User Not Invited to participate in this test");
        }
        
        const selectedOptionMapping= await prisma.selectedOptionMapping.upsert({
            where: {
                test_id_test_participant_id_question_id:{
                    test_participant_id:testInvitation.TestParticipant.id,
                    test_id: parseInt(testId),
                    question_id:parseInt(questionId)
                }
            },
            create: {
                test_id: parseInt(testId),
                test_participant_id:testInvitation.TestParticipant.id,
                question_id:parseInt(questionId),
                option_ids: req.body.optionIds??null,
                input_value:req.body.answer?? null,
                skipped:req.body.skipped??false
            },
            update: {
                option_ids: req.body.optionIds??null,
                input_value:req.body.answer?? null,
                skipped:req.body.skipped??false
            }
        });
        const questionDetails=await prisma.question.findFirst({
            where: {
                id:parseInt(questionId)
            },
            select:{
                score_on_correct_answer:true,
                negative_score_on_wrong_answer:true,
                manual_scoring:true,
                Options:{
                    where:{
                        is_correct:true
                    },
                    select:{
                        id:true,
                    }
                }
            }
        });
        const correctOptionIds=questionDetails?.Options.map(option=>option.id);
        const selectedOptionIds=req.body.optionIds;
        if(!questionDetails.score_manually && !req.body.skipped){
              if (arraysEqual(correctOptionIds, selectedOptionIds)) {
                await prisma.selectedOptionMapping.update({
                    where: {
                        id: selectedOptionMapping.id
                    },
                    data: {
                        is_correct: true,
                        score: questionDetails.score_on_correct_answer
                    }
                });
            }else{
                await prisma.selectedOptionMapping.update({
                    where: {
                        id: selectedOptionMapping.id
                    },
                    data: {
                        is_correct: false,
                        score: questionDetails.negative_score_on_wrong_answer
                    }
                });
            }
        }
        resBody = {
            data: null,
            message: "Response Saved"
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
}

const testParticipantResults = async (req, res) => {
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
        const userData = getUserData();

        const testParticipantResults = await prisma.testParticipant.findFirst({
            where: {

                test_id: parseInt(testId),
                TestInvite: {
                    email: userData.emailId,
                    status: true,
                }
            },
            select: {
                id: true,
                TestInvite: {
                    select: {
                        name: true,
                        email_status: true,
                    }
                },
                SelectedOptionMapping: {
                    select: {
                        Question: {
                            select: {
                                id: true,
                                question: true,
                                score_on_correct_answer: true,
                                negative_score_on_wrong_answer: true,
                                manual_scoring: true,
                                Options: {
                                    select: {
                                        id: true,
                                        description: true,
                                        image: true,
                                        is_correct: true
                                    }
                                },
                            }
                        },
                        option_ids: true,
                        input_value: true,
                        skipped: true,
                        is_correct: true,
                        score: true,
                        manual_score: true,
                    }
                },
            }
        });

        resBody = {
            data: testParticipantResults,
            message: "Test Participant Results Fetched"
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
}

module.exports = { allUserParticipationTest, getTestBasicDetails, acceptInvitation, getTestVerificationImage, getTestQuestionSections,sectionTestQuestions,startTest,saveAnswer,testParticipantResults };