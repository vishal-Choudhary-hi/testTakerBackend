const express = require('express');
const router = express.Router();
const userController = require('./controller/UserController');
const authMiddleware = require('./middleware/authMiddleware');
const dashboardCreater = require('./routers/dashboardCreater');
const dashboardParticipant = require('./routers/dashboardParticipant');
const UploadFileController = require('./controller/UploadFileController');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.post("/registerNewUser", userController.registerNewUser);
router.post("/getUserWithEmail", userController.getUserWithEmail);
router.post("/verifyUserLoginOTP", userController.verifyOTP);

router.get("/user", authMiddleware.setUserDataMiddleware, userController.getUser);

router.use('/dashboard/participant', authMiddleware.setUserDataMiddleware, dashboardParticipant);
router.use('/dashboard/creater', authMiddleware.setUserDataMiddleware, dashboardCreater);

router.post('/uploadFileToCloud', upload.single('file'), UploadFileController.uploadFileToCloud);
router.get('/getDocumentCategoryDetails', UploadFileController.getDocumentCategoryDetails);
router.get('/getUploadedDocuments', UploadFileController.getUploadedDocuments);


module.exports = router;