const Joi = require("joi");
const { apiLog } = require("../utils/LogUtility");
const { getUserData } = require("../utils/userUtility");
const CloudinaryUtility = require("../utils/CloudinaryUtility");
const { prisma } = require('../prisma/getPrismaClient');

const uploadFileToCloud = async (req, res) => {
    let resBody = null;
    let statusCode = 200;
    const ValidationJson = Joi.object({
        file: Joi.any(),
        uploadedByModelType: Joi.string().valid('userTestCreater').required(),
        uploadedByModelId: Joi.number().required(),
        documentCategory: Joi.string(),
        documentName: Joi.string().required()
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
        if (!req.file) {
            throw new Error('File not provided');
        }
        const documentCategory = req.body.documentCategory;
        const documentCategoryData = await prisma.documentCategory.findFirst({
            where: {
                key: documentCategory
            },
            select: {
                id: true
            }
        });
        if (!documentCategoryData) {
            throw new Error("Category Not Configured");
        } const filePath = req.file.path;
        const uploadResult = await CloudinaryUtility.uploader.upload(filePath, {
            folder: `image/${documentCategory}/`,
            resource_type: 'auto'
        });
        const data = {
            name: req.body.documentName,
            path: uploadResult.public_id,
            link: uploadResult.secure_url,
            cloud_service: 'cloudinary',
            uploadedByModelId: parseInt(req.body.uploadedByModelId),
            UploadedByModelType: req.body.uploadedByModelType,
            documentCategoryId: documentCategoryData.id,
            status: true
        };
        const documentData = await prisma.documents.create({ data: data })
        resBody = {
            data: documentData,
            message: "File Uploaded Successfully"
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

const getDocumentCategoryDetails = async (req, res) => {
    let resBody = null;
    let statusCode = 200;
    const ValidationJson = Joi.object({
        documentCategoryName: Joi.string().required()
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
        const documentCategory = req.query.documentCategory;
        const documentCategoryData = await prisma.documentCategory.findFirst({
            where: {
                key: documentCategory
            },
            select: {
                id: true,
                key: true,
                name: true,
                logo: true,
                expiryAction: true,
                allowedFileTypes: true,
                maxFileSize: true,
            }
        });
        if (!documentCategoryData) {
            throw new Error("Category Not Configured");
        }
        resBody = {
            data: documentCategoryData,
            message: "Document Category Details Fetched Successfully"
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
const getUploadedDocuments = async (req, res) => {
    let resBody = null;
    let statusCode = 200;

    // Validate as string since it's a GET request
    const ValidationJson = Joi.object({
        documentIds: Joi.string().required()
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

        // Split and convert to array of integers
        const documentIds = req.query.documentIds
            .split(',')
            .map(id => parseInt(id.trim(), 10))
            .filter(id => !isNaN(id));

        const documentData = await prisma.documents.findMany({
            where: {
                id: {
                    in: documentIds
                }
            },
            select: {
                id: true,
                name: true,
                path: true,
                link: true
            }
        });

        resBody = {
            data: documentData,
            message: "Documents Fetched Successfully"
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
module.exports = { uploadFileToCloud, getDocumentCategoryDetails, getUploadedDocuments }