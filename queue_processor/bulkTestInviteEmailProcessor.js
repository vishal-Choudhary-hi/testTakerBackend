const bulkTestInviteEmailQueue = require('../queue/bulkTestInviteEmailQueue');
const { sendMail } = require('../utils/EmailUtility');

bulkTestInviteEmailQueue.process(async (job) => {
    // const { testID } = job.data;
    console.log(`Sending email to`);
});