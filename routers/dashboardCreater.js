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


module.exports = router;
