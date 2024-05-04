const { bastionGPT: { KEY } } = require('config.json');
const axios = require('axios');

const API_ENDPOINT = 'https://api.bastiongpt.com/pro;rev=2/deployments/bastionapi/chat/completions';

const headers = {
    'Content-Type': 'application/json',
    'Key': `${KEY}`
}

module.exports = {
    generateResponse,
    updateResponse,
}

async function generateResponse(formDetails, prompt) {
    return "Bastion GPT response";
}

async function updateResponse(oldResponse, newResponseSize) {
    return "More text";
}

async function postBastion(content) {
    const data = {
        "messages": [{
            "role": "user",
            "content": content
        }],
        "max_tokens": 1000,
        "temperature": 0,
        "user": "C0001"
    };
    const requestBody = JSON.stringify(data);
    try {
        const { choices } = await axios({
            method: 'post',
            maxBodyLength: Infinity,
            url: API_ENDPOINT,
            headers: headers,
            data: requestBody
        });
        console.log("Succesfully grabbed result from bastion");
        return choices;
    } catch (error) {
        console.error("Error while fetching result", error);
        throw "Error while fetching result from AI";
    }
}