const keepServerLive=async(req,res)=>{
    try {
        res.status(200).json({ message: 'Server is live' });
    } catch (error) {
        console.error('Error in keepServerLive:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
module.exports={keepServerLive};