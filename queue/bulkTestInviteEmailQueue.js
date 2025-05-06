const Queue = require('bull');

// Create a queue named 'email'
const bulkTestInviteEmailQueue = new Queue('bulkTestInviteEmailQueue', {
    redis: {
        url: process.env.REDIS_URL,
    },
});

module.exports = bulkTestInviteEmailQueue;