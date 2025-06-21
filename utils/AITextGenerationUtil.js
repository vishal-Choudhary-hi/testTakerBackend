const NLPCloudClient = require('nlpcloud');

const AITextGeneration = async (inputString) => {
    try {
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+process.env.GEMINI_API_KEY, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: inputString }
                        ]
                    }
                ]
            })
        });

        const data = await response.json();
        const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
        return {
            aiResponse: aiText,
            status: true
        };
    } catch (error) {
        console.error("Error in AITextGeneration: ", error);
        return {
            aiResponse: null,
            status: false
        };
    }
};


const NLPAITextGeneration=async(inputString)=>{
    try {
        const client = new NLPCloudClient({model:process.env.AI_NPL_CLOUD_MODEL,token:process.env.AI_NPL_CLOUD_API_KEY, gpu:true})
        const aiResponse=await client.generation({
            text:inputString,
            maxLength:4096,
            lengthNoinput:true,
            endSequence:null,
            removeInput:true,
            numBeams:1,
            numReturnSequences:1,
            topK:50,
            topP:1,
            temperature:0.8,
            repetitionPenalty:1,
            removeEndSequence:false
        });
        return {
            aiResponse:aiResponse.data.generated_text,
            status:true   
        };
    } catch (error) {
        console.error("Error in AITextGeneration: ", error);
        return {
            aiResponse: null,
            status:false   
        };
    }
}
module.exports={
    AITextGeneration
};