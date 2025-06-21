const { getUserData, setUserData } = require('../utils/userUtility')
const { prisma } = require('../prisma/getPrismaClient');
const { apiLog } = require('../utils/LogUtility');
const Joi = require("joi");
const bulkTestInviteEmailQueue = require('../queue/bulkTestInviteEmailQueue');
const { sendMail } = require('../utils/EmailUtility');
const { AITextGeneration } = require('../utils/AITextGenerationUtil');
const { json } = require('body-parser');
const { connect } = require('../routers/dashboardCreater');

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
        totalWarningAllowed: Joi.number().integer().optional(),
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
            status: 'draft',
            total_warning_allowed:parseInt(req.body.totalWarningAllowed)??50,
            CreatedByUser:{
                connect:{id:userData.id}
            },
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
                        lte: end, // test can start before or during the selected range
                    },
                },
                {
                    end_time: {
                        gte: start, // test can end after or during the selected range
                    },
                },
            ];
        }

        const getPaginatedTests = async (userId, page = 1, limit = 5) => {
            const skip = (page - 1) * limit; // Calculate offset

            const [testData, totalCount] = await Promise.all([
                prisma.test.findMany({
                    where: { created_by: userId,...additionalFilters },
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
        role: Joi.string(),
        page: Joi.number().integer().optional(),
        limit: Joi.number().integer().optional()
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
        const createrTest = await prisma.test.findFirst({
            where: {
                id: parseInt(testId),
                created_by: userData.id
            }
        })
        if (!createrTest) {
            throw new Error("Unauthorized Access"); 
        }
        const skip= req.query.page ? (req.query.page - 1) * req.query.limit : 0;
        const limit = req.query.limit || 10;
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
                total_warning_allowed:true,
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
                        id: true,
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
                        },
                        InviteUser:{
                            select:{
                                id: true,
                            }
                        },
                        TestParticipant:{
                            select: {
                                participated: true,
                                SelectedOptionMapping:{
                                    select:{
                                        question_id: true,
                                        option_ids:true,
                                        input_value:true,
                                        skipped:true,
                                        is_correct:true,
                                        manual_score:true,
                                        score: true,
                                    }
                                },
                                _count: {
                                    select: {
                                        TestParticipantWarnings: true,
                                    },
                                }
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
        const now = new Date();
        const testEndTime = new Date(testDetails.end_time);
        if (testEndTime > now && testDetails.status === 'live') {
            await prisma.test.update({
                where: { id: parseInt(testId) },
                data: {
                    status: 'result_pending'
                }
            })
            testDetails.status='result_pending';
        }
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
                    name: invitation.name,
                    created_by: invitation.created_by,
                    additional_details: invitation.additional_details,
                    status: invitation.status,
                    Test: {
                        connect: { id: invitation.test_id }
                    },
                    VerificationImage: {
                        connect: { id: invitation.verification_image_document_id }
                    },
                    InviteUser:{
                        connect:{emailId:invitation.email}
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
const getQuestionRecomendationFromAI=async(req,res)=> {
    let resBody = null;
    let statusCode = 200;
    const ValidationJson = Joi.object({
        testId: Joi.number().integer().required(),
        aiInstructions:Joi.object({
            purpose:Joi.string().required(),
            questionTypes:Joi.array().items(Joi.object({
                id:Joi.number().integer().required(),
                count:Joi.number().integer().required(),
            })).required(),
            topics:Joi.array().items(Joi.string()).required(),
            difficultyLevels:Joi.array().items(Joi.string()).required(),
            subjects:Joi.array().items(Joi.string()).required(),
        }).required(),
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
        const testId = parseInt(req.body.testId);
        const aiInstructions = req.body.aiInstructions;
        const prevAIResponse=await prisma.aiTestQuestionSuggestion.findFirst({
            where:{
                test_id:testId
            }
        });
        let ai_responses=prevAIResponse?.ai_response;
        let prevQuestions=[];
        if(ai_responses){
            ai_responses.forEach((ai_response)=>{
                prevQuestions.push(ai_response.question);
            });
        }else{
            ai_responses=[];
        }
        const testDetails = await prisma.test.findFirst({
            where: {
                id: parseInt(testId),
                created_by: userData.id
            }
        });   
        if (!testDetails) {
            throw new Error("No test found");
        }
        const { purpose, questionTypes, topics, difficultyLevels, subjects } = aiInstructions;
        let allQuestionTypes = await prisma.questionType.findMany({
            select: {
                id: true,
                label: true
            }
        });
        const sanitizedQuestionTypes = allQuestionTypes.map(q => ({
            id: q.id,
            label: q.label,
          }));
        const labels = questionTypes.map(qType =>
            allQuestionTypes.find(q => q.id == qType.id)?.label || "Unknown Type"
        );
        let inputString = {
          purpose: `${purpose} Generate questions of type ${labels} for subject(s): ${subjects.join(", ")}. Focus on topics: ${topics.join(", ")}. Difficulty levels should include: ${difficultyLevels.join(", ")}. Include both theory and numerical questions where relevant. For MCQs, provide exactly 4 options and mark the correct one(s).Do not repeat questions present in the previous questions json array.Please return the json only in the provided response_format , and dont include any other text.`,
          question_types: sanitizedQuestionTypes,
          previous_questions:prevQuestions,
          response_format: {
            questions: [
              {
                question: "string",
                options: [
                  {
                    description: "string",
                    is_correct: true
                  }
                ],
                question_type_id: questionTypes.id
              }
            ]
          }
        };
        inputString=JSON.stringify(inputString);
        const aiResponse=await AITextGeneration(inputString);
        if(!aiResponse.status) {
            throw new Error("AI Text Generation Failed");
        }
        let data = aiResponse.aiResponse;
        let questions=[];
        if (typeof data === "string") {
            data = data.replace(/```json|```/g, "").trim();
            try {
                data = JSON.parse(data);
                questions=data.questions;
                let updatedAIResponse=[...ai_responses,...questions];
                await prisma.aiTestQuestionSuggestion.upsert({
                    where:{
                        test_id:testId
                    },
                    update:{
                        creator_request:aiInstructions,
                        ai_response:updatedAIResponse,
                        creator_request:aiInstructions
                    },
                    create:{
                        test_id:testId,
                        creator_request:aiInstructions,
                        ai_response:updatedAIResponse,
                        creator_request:aiInstructions
                    }
                })
            } catch (error) {
                throw new Error("Invalid response from the AI "+ error);
            }
        }
        resBody = {
            data:questions,
            message: "AI Question Recommendation Fetched Successfully",
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

const getAISuggestedQuestions=async(req,res)=>{
    let resBody = null;
    let statusCode = 200;
    const ValidationJson = Joi.object({
        testId: Joi.number().integer().required(),
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
        const {testId}=req.query;
        const aiTestQuestionSuggestion=await prisma.aiTestQuestionSuggestion.findFirst({
            where:{
                test_id:parseInt(testId)
            }
        })
        const ai_response=aiTestQuestionSuggestion?.ai_response;
        const creator_request=aiTestQuestionSuggestion?.creator_request;
        resBody = {
            data: {ai_response,creator_request},
            message: "Test Participant Questions Returned Successfully"
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

const getAllTestStatues=async(req,res)=>{
    let resBody = null;
    let statusCode = 200;
    const ValidationJson = Joi.object({}).required()
    try {
        const { error } = ValidationJson.validate(req.query);
        if (error) {
            const errorMessage = error.details[0]?.message || "Invalid query parameters";
            statusCode = 400;
            resBody = { error: errorMessage };
            apiLog(req, resBody, statusCode);
            return res.status(statusCode).json(resBody);
        }
        const data = [
            { id: 'draft', label: 'Draft' },
            { id: 'live', label: 'Live' },
            { id: 'result_pending', label: 'Result Pending' },
            { id: 'completed', label: 'Completed' },
        ];
        resBody = {
            'data': data,
            'message': "Test Statuses Fetched Successfully"
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
const getTestParticipantQuestion=async(req, res) => {
    let resBody = null;
    let statusCode = 200;
    const ValidationJson = Joi.object({
        testId: Joi.number().integer().required(),
        participantId: Joi.number().integer().required()
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
        const participantId = req.query.participantId;
        const testDetails = await prisma.test.findFirst({
            where: {
                id: parseInt(testId),
                created_by: userData.id
            }
        });
        if (!testDetails) {
            throw new Error("No test found");
        }
        const participantDetails = await prisma.testInvitation.findFirst({
            where: {
                id: parseInt(participantId),
                Test: {
                    id: parseInt(testId)
                }
            },
            select: {
                TestParticipant: {
                    select: {
                        SelectedOptionMapping: {
                            select: {
                                question_id: true,
                                option_ids: true,
                                input_value: true,
                                skipped: true,
                                is_correct: true,
                                manual_score: true,
                                Question: {
                                    select: {
                                        id:true,
                                        question: true,
                                        image: true,
                                        negative_score_on_wrong_answer: true,
                                        score_on_correct_answer: true,
                                        manual_scoring: true,
                                        type_id: true,
                                        QuestionSection: {
                                            select: {
                                                label: true,
                                                description: true,
                                                total_score: true
                                            }
                                        },
                                        Options: {
                                            select: {
                                                id:true,
                                                description: true,
                                                image: true,
                                                is_correct: true
                                            }
                                        }
                                    }
                                },
                            }
                        }
                    }
                }
            }
        });
        if (!participantDetails) {
            throw new Error("No participant found");
        }
        resBody = {
            data: participantDetails.TestParticipant.SelectedOptionMapping,
            message: "Test Participant Questions Returned Successfully"
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
const changeScoreManually = async (req, res) => {
    let resBody = null;
    let statusCode = 200;
    const ValidationJson = Joi.object({
        testId: Joi.number().integer().required(),
        participantId: Joi.number().integer().required(),
        questionId: Joi.number().integer().required(),
        manualScore: Joi.number().integer().required()
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
        const participantId = req.body.participantId;
        const questionId = req.body.questionId;
        const manualScore = req.body.manualScore;

        // Check if the test exists and is created by the user
        const testDetails = await prisma.test.findFirst({
            where: {
                id: parseInt(testId),
                created_by: userData.id
            }
        });
        if (!testDetails) {
            throw new Error("No test found");
        }

        // Check if the participant exists in the test
        const participantDetails = await prisma.testInvitation.findFirst({
            where: {
                id: parseInt(participantId),
                Test: {
                    id: parseInt(testId)
                }
            }
        });
        if (!participantDetails) {
            throw new Error("No participant found");
        }

        // Update the manual score for the selected question
        await prisma.selectedOptionMapping.update({
            where: {
                test_id_test_participant_id_question_id:{
                    test_id: parseInt(testId),
                    test_participant_id: parseInt(participantId),
                    question_id: parseInt(questionId)
                }
            },
            data: {
                manual_score: manualScore,
            }
        });
        //update the total score for the participant
        resBody = {
            data: [],
            message: "Manual Score Updated Successfully"
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

const releaseTestResult = async (req, res) => {
    let resBody = null;
    let statusCode = 200;
    const ValidationJson = Joi.object({
        testId: Joi.number().integer().required(),
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

        const testCompletedStatus = 'completed'; // Define the status to update to

        // Check if the test exists and is created by the user
        const testDetails = await prisma.test.findFirst({
            where: {
                id: parseInt(testId),
                created_by: userData.id
            }
        });
        if (!testDetails) {
            throw new Error("No test found");
        }

        await prisma.test.update({
            where: {
                id: parseInt(testId)
            },
            data: {
                status: testCompletedStatus
            }
        });
        
         const testParticipant=await prisma.testParticipant.findMany({
            where: {
                test_id: parseInt(testId),
            },
            select: {
                id: true,
                TestInvite: {
                    select: {
                        email: true,
                        name: true
                    }
                },
                SelectedOptionMapping: {
                    select: {
                        manual_score: true,
                        score: true,
                    }
                }
            }
        });
        // Calculate total score for each participant
        for (const participant of testParticipant) {
            const totalScore = participant.SelectedOptionMapping.reduce((acc, curr) => acc + (curr.manual_score || curr.score || 0), 0);
            const mailData={
                testName: testDetails.test_name,
                participantName: participant.TestInvite.name,
                totalScore: totalScore,
                resultsLink: `${process.env.APP_URL}participator/test/${testId}/result`
            }
            await sendMail(participant.TestInvite.email, "testResultEmail", mailData);
        }
        resBody = {
            data: [],
            message: "Test Result Released and Status Updated Successfully"
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

const testParticipantWarnings=async (req, res) => {
    let resBody = null;
    let statusCode = 200;
    const ValidationJson = Joi.object({
        inviteId: Joi.number().integer().required()
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
        const inviteId = req.query.inviteId;
        const participantDetails = await prisma.testInvitation.findFirst({
            where: {
                id: parseInt(inviteId),
            },
            select: {
                TestParticipant: {
                    select: {
                        TestParticipantWarnings: true
                    }
                },
            }
        });
        if (!participantDetails) {
            throw new Error("No participant found");
        }
        let allWarnings = participantDetails.TestParticipant.TestParticipantWarnings.map(warning => warning.warning_message).flat();


        resBody = {
            data: allWarnings,
            message: "Test Participant Warnings Returned Successfully"
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
module.exports = { createNewTest, updateTestQuestion, getQuestionTypes, getAllTest, getTestWithId, inviteParticipants, changeTestStatus, getQuestionRecomendationFromAI,getAllTestStatues,getTestParticipantQuestion,changeScoreManually,releaseTestResult,testParticipantWarnings, getAISuggestedQuestions };