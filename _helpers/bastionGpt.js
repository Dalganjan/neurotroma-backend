const { bastionGPT: { KEY } } = require('config.json');
const axios = require('axios');
const { merge } =  require('lodash');

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
    try {
        const bastionQuery = updateFormData(formDetails, prompt);
        const result = await postBastion(bastionQuery);
        return result;
    } catch (error) {
        console.error('Error while generating response', error);
        throw "Error while generating response";
    }
}

async function updateResponse(oldResponse, newResponseSize) {
    try {
        const result = await postBastion(`${oldResponse}. Please rephrase it in ${newResponseSize} words`);
        return result;
    } catch (error) {
        console.error('Error while updating response', error);
        throw "Error while updating response";
    }
}

function updateFormData(formDetails, promptQuery) {
    var mergedData = {'Section2_WordCount' : 500}; // default limit of words
    var isNested = Object.keys(formDetails).some(function(key) {
        return formDetails[key] && typeof formDetails[key] === 'object';
    });
    if(isNested) {
        mergedData = merge(mergedData, ...Object.values(formDetails));
    } else {
        mergedData = merge(mergedData, formDetails);
    }
    for (var key in mergedData) {
        if (mergedData.hasOwnProperty(key)) {
            var regex = new RegExp("%" + key + "%", "g");
            promptQuery = promptQuery.replace(regex, mergedData[key]);
        }
    }
    return promptQuery;
}

async function postBastion(input) {
    const data = {
        "messages": [{
            "role": "user",
            "content": input
        }],
        "max_tokens": 1000,
        "temperature": 0,
        "user": "C0001"
    };
    const requestBody = JSON.stringify(data);
    try {
        const response = await axios({
            method: 'post',
            maxBodyLength: Infinity,
            url: API_ENDPOINT,
            headers: headers,
            data: requestBody
        });
        console.log("Succesfully grabbed result from bastion");
        const { choices: [{ message: { content } }] } = response.data;
        return content;
    } catch (error) {
        console.error("Error while fetching result", error.response.data);
    }
}