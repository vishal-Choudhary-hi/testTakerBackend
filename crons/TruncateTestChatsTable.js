const { prisma } = require("../prisma/getPrismaClient");

const TruncateTestChatsTable=async()=>{
    try {
        await prisma.testChats.deleteMany();
        return {
            "message": "Test chats table truncated successfully",
        }
    } catch (error) {
        return {
            "message": "Error truncating test chats table",
            "error": error.message
        }
    }
}

module.exports = {
    data:{
        name: 'TruncateTestChatsTable',
        schedule: '30 23 * * *', // every day at 01:30 AM
        payload: { }
    },
  handler: TruncateTestChatsTable
};
