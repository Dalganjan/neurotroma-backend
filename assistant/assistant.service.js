const config = require('config.json');
const bastionGptService = require('_helpers/bastionGpt');
const airtable = require('_airtable/airtable.service');
const patientSchema = require('./patient.model');
const sectionWiseResultSchema = require('./sectionWiseResult.model');
const promptService = require('prompt/prompt.service');
const Role = require('_helpers/role');
const path = require('path');

module.exports = {
    recordPatient,
    recordSectionWiseResults,
    updateSectionPromptResponse,
    getSectionWiseResults,
}


async function recordPatient(assistantId) {
    try {
        const data = {
            [patientSchema.fields.assistantId.name]: assistantId,
            [patientSchema.fields.patientId.name]: generatedRandomId(),
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
        const { promptDetails, version } = await promptService.getLatestPromptBySection(assistantId, body.sectionId);
        const bastionResponse = await bastionGptService.generateResponse(body.sectionForm, promptDetails);
        const data = {
            [sectionWiseResultSchema.fields.assistantId.name]: assistantId,
            [sectionWiseResultSchema.fields.patientId.name]: patientId,
            [sectionWiseResultSchema.fields.sectionId.name]: body.sectionId,
            [sectionWiseResultSchema.fields.sectionForm.name]: JSON.stringify(body.sectionForm),
            [sectionWiseResultSchema.fields.sectionPromptResponse.name]: bastionResponse,
            [sectionWiseResultSchema.fields.promptVersionId.name]: version,
        }
        await airtable.createRecord(sectionWiseResultSchema.tableName, data);
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
                [sectionWiseResultSchema.fields.assistantId.name]: assistantId,
                [sectionWiseResultSchema.fields.patientId.name]: patientId,
                [sectionWiseResultSchema.fields.sectionId.name]: sectionId,
                [sectionWiseResultSchema.fields.sectionForm.name]: sectionData.fields.sectionForm,
                [sectionWiseResultSchema.fields.sectionPromptResponse.name]: bastionResponse,
                [sectionWiseResultSchema.fields.promptVersionId.name]: sectionData.fields.promptVersionId,
            }
            const { fields: { sectionPromptResponse, promptVersionId } } = await airtable.updateRecord(sectionWiseResultSchema.tableName, sectionData.id, data);
            console.log("Successfully updated prompt response");
            return { patientId, sectionId, sectionPromptResponse, promptVersionId };
        } else {
            return "Sections are not saved earlier";
        }
    } catch (error) {
        console.error("Error while updating response", error);
        throw "Error while updating response";
    }
}

async function getSectionWiseResults(patientId) {
    try {
        const results = await airtable.getRecordByFilters(sectionWiseResultSchema.tableName,
             `{patientId} = '${patientId}'`);
        const sectionWiseResult = results.map(({ fields }) => {
            return {
                sectionPromptResponse: fields.sectionPromptResponse,
                sectionId: fields.sectionId,
                version: `V ${fields.promptVersionId}` 
            }
        });  
        return sectionWiseResult;   
    } catch (error) {
        throw  `Error while getting patient ${patientId} section wise results`;
    }
}


// helper functions
async function getSectionResult(sectionId, patientId) {
    try {
        const sectionData = await airtable.getRecordByFilters(sectionWiseResultSchema.tableName,
            `{patientId} = '${patientId}'`);
        const result = sectionData.find((section) => section.fields.sectionId === sectionId);
        if (result) {
            return result;
        } else return null;
    } catch (e) {
        throw `Error while getting patient ${patientId} section ${sectionId} result`;
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