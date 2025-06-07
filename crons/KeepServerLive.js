const keepServerLive=()=>{
   fetch(process.env.BACKEND_URL+'base/keepServerLive', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'authorization':process.env.AUTH_TOKEN,
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .catch(data => {
        console.log('Server keep-alive response:', data);
    });
}

module.exports = {
    data:{
        name: 'KeepServerLive',
        schedule: '*/14 * * * *', // every 14 mins
        payload: { }
    },
  handler: keepServerLive
};
