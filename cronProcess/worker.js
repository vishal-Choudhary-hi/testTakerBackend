const { Worker } = require('bullmq');
const Redis = require('ioredis');
const { prisma } = require('../prisma/getPrismaClient');
require('dotenv').config();

const connection = new Redis(process.env.REDIS_URL,{
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});
const worker = new Worker('cron-jobs', async job => {
  try {
    const jobModule = require(`../crons/${job.name}`);
    const returnData=await jobModule.handler(job.data);
    await prisma.cronJobLogs.create({
      data: {
        name: job.name,
        return_data: returnData,
        created_at: new Date(),
      },
    });
  } catch (error) {
    console.error(`Error while processing job "${job.name}":`, error);
    await prisma.cronJobLogs.create({
      data: {
        name: job.name,
        return_data: returnData? returnData : {error:error.message},
        created_at: new Date(),
      },
    });
  }

}, { connection });

