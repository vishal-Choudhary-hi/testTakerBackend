const cron = require('node-cron');
const { Queue } = require('bullmq');
const Redis = require('ioredis');
const jobs = require('../crons');

const connection = new Redis(process.env.REDIS_URL,{
    maxRetriesPerRequest: null,
      enableReadyCheck: false

});
const queue = new Queue('cron-jobs', { connection });

jobs.forEach(job => {
  cron.schedule(job.schedule, async () => {
    console.log(`📥 Queuing job "${job.name}"`);
    await queue.add(job.name, job.payload || {});
  });
});
