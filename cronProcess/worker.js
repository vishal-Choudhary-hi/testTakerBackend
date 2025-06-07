const { Worker } = require('bullmq');
const Redis = require('ioredis');
require('dotenv').config();

const connection = new Redis(process.env.REDIS_URL,{
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});
const worker = new Worker('cron-jobs', async job => {
  console.log(`⚙️ Running job "${job.name}" with data:`, job.data);
    const jobModule = require(`../crons/${job.name}`);
    jobModule.handler(job.data);
}, { connection });

worker.on('completed', job => {
  console.log(`✅ Job "${job.name}" completed.`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job "${job.name}" failed:`, err);
});
