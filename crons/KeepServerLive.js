const keepServerLive=async()=>{
    try {
        const response=await fetch(process.env.BACKEND_URL+'base/keepServerLive', {
             method: 'GET',
             headers: {
                 'Content-Type': 'application/json',
                 'authorization':process.env.AUTH_TOKEN,
             },
         })
        const data = await response.json();
        return data;
    } catch (error) {
        return {
            message: "Error keeping server live",
            error: error.message
        };
    }
}

module.exports = {
    data:{
        name: 'KeepServerLive',
        schedule: '*/14 * * * *', // every 14 mins
        payload: { }
    },
  handler: keepServerLive
};
