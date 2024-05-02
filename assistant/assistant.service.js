const config = require('config.json');
const bastionGptService = require('_helpers/bastionGpt');
const airtable = require('_airtable/airtable.service');
const patient = require('./patient.model');
const sectionWiseResult = require('./sectionWiseResult.model');
const Role = require('_helpers/role');
const path = require('path');

module.exports = {
    recordPatient,
    recordSectionWiseResults,
    updateSectionPromptResponse,
}


async function recordPatient(assistantId) {
    try {
        const data = {
            [patient.fields.assistantId.name]: assistantId,
            [patient.fields.patientId.name]: generatedRandomId(),
        }
        await airtable.createRecord(patientSchema.tableName, data);
        console.log("Successfully created patient");
        return data;
    } catch (e) {
        console.error('Error occurred while recording new patient', e);
        throw 'Error occurred while recording new patient';
    }
}

async function recordSectionWiseResults(assistantId, patientId, body) {
    try {
        const sectionDetails = {};
        const latestPrompt = { promptDetails: 'prompt details', version: 'V2' };
        const bastionResponse = await bastionGptService.generateResponse(sectionDetails, latestPrompt);
        const data = {
            [sectionWiseResult.fields.assistantId.name]: assistantId,
            [sectionWiseResult.fields.patientId.name]: patientId,
            [sectionWiseResult.fields.sectionId.name]: body.sectionId,
            [sectionWiseResult.fields.sectionForm.name]: body.sectionForm,
            [sectionWiseResult.fields.sectionPromptResponse.name]: bastionResponse,
            [sectionWiseResult.fields.promptVersionId.name]: latestPrompt.version,
        }
        await airtable.createRecord(sectionWiseResult.tableName, data);
        console.log("Successfully created section wise results");
        return data;

    } catch (error) {
        console.error("Error while generating response", error);
        throw "Error while generating response";
    }
}

async function updateSectionPromptResponse(assistantId, patientId, { sectionId, sectionPromptResponse, updatedResponseSize }) {
    try {
        const bastionResponse = await bastionGptService.updateResponse(sectionPromptResponse, updatedResponseSize);
        const sectionData = await getSectionResult(sectionId, patientId);
        if (sectionData) {
            const data = {
                [sectionWiseResult.fields.assistantId.name]: assistantId,
                [sectionWiseResult.fields.patientId.name]: patientId,
                [sectionWiseResult.fields.sectionId.name]: sectionId,
                [sectionWiseResult.fields.sectionForm.name]: sectionData.fields.sectionForm,
                [sectionWiseResult.fields.sectionPromptResponse.name]: bastionResponse,
                [sectionWiseResult.fields.promptVersionId.name]: sectionData.fields.promptVersionId,
            }
            const result = await airtable.updateRecord(sectionWiseResult.tableName, sectionData.id, data);
            console.log("Successfully updated prompt response");
            return result;
        } else {
            return "Sections are not saved earlier";
        }
    } catch (error) {
        console.error("Error while updating response", error);
        throw "Error while updating response";
    }
}


// helper functions
async function getSectionResult(sectionId, patientId) {
    try {
        const sectionData = await airtable.getRecordByFilters(sectionWiseResult.tableName,
            `{patientId} = '${patientId}'`);
        const result = sectionData.find((section) => section.fields.sectionId === sectionId);
        if (result) {
            return result;
        } else return null;
    } catch (e) {

    }
}

function generatedRandomId() {
    const randomInteger = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    const randomGeneratedString = Math.random()
        .toString(36)
        .substr(2, randomInteger(6, 10));
    return randomGeneratedString;
}