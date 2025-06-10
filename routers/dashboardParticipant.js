const express = require('express');
const router = express.Router();
const ParticipantDashboard = require('../controller/ParticipantDashboard');

router.get('/allUserParticipationTest', ParticipantDashboard.allUserParticipationTest);
router.get('/getTestBasicDetails', ParticipantDashboard.getTestBasicDetails);
router.post('/acceptInvitation', ParticipantDashboard.acceptInvitation);
router.get('/getTestVerificationImage', ParticipantDashboard.getTestVerificationImage);
router.get('/getTestQuestionSections', ParticipantDashboard.getTestQuestionSections);
router.get('/sectionTestQuestions', ParticipantDashboard.sectionTestQuestions);
router.post('/startTest', ParticipantDashboard.startTest);
router.post('/saveAnswer', ParticipantDashboard.saveAnswer);
router.get('/testParticipantResults', ParticipantDashboard.testParticipantResults);
router.post('/saveTestParticipantWarnings', ParticipantDashboard.saveTestParticipantWarnings);





module.exports = router;
