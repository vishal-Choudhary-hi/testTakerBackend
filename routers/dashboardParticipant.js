const express = require('express');
const router = express.Router();
const ParticipantDashboard = require('../controller/ParticipantDashboard');

router.get('/allUserParticipationTest', ParticipantDashboard.allUserParticipationTest);
router.get('/getTestBasicDetails', ParticipantDashboard.getTestBasicDetails);
router.post('/acceptInvitation', ParticipantDashboard.acceptInvitation);
router.get('/getTestVerificationImage', ParticipantDashboard.getTestVerificationImage);
router.get('/getTestQuestionSections', ParticipantDashboard.getTestQuestionSections);


module.exports = router;
