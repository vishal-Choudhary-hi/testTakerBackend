const express = require('express');
const router = express.Router();
const CreaterDashboard = require('../controller/CreaterDashboard');
router.post('/createNewTest', CreaterDashboard.createNewTest);
router.get('/getAllTest', CreaterDashboard.getAllTest);
router.get('/getTest', CreaterDashboard.getTestWithId);
router.post('/inviteParticipants', CreaterDashboard.inviteParticipants);
router.get('/getQuestionTypes', CreaterDashboard.getQuestionTypes);
router.post('/updateTestQuestion', CreaterDashboard.updateTestQuestion);
router.post('/changeTestStatus', CreaterDashboard.changeTestStatus);
router.post('/getQuestionRecomendationFromAI', CreaterDashboard.getQuestionRecomendationFromAI);
router.get('/getAllTestStatues', CreaterDashboard.getAllTestStatues);
router.get('/getTestParticipantQuestion', CreaterDashboard.getTestParticipantQuestion);
router.post('/changeScoreManually', CreaterDashboard.changeScoreManually);
router.post('/releaseTestResult', CreaterDashboard.releaseTestResult);






module.exports = router;
