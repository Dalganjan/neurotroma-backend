const airtable = require('_airtable/airtable.service');
const promptSchema = require('./prompt.model');

module.exports = {
    recordPrompt,
    updatePrompt,
    getAllPrompts,
}



async function recordPrompt(promptAdminId, req) {
    try {
        const data = {
            [promptSchema.fields.promptDetails.name]: req.promptDetails,
            [promptSchema.fields.promptUserId.name]: promptAdminId,
            [promptSchema.fields.sectionId.name]: req.sectionId,
            [promptSchema.fields.isLatest.name]: 'true',
            [promptSchema.fields.version.name]: createNewVersion(promptAdminId, req.sectionId)
        }
        const { id, fields } = await airtable.createRecord(promptSchema.tableName, data);
        return { id, fields };
    } catch (error) {
        console.error('Error while creating prompt', error);
        throw 'Error while creating prompt';
    }
}


async function updatePrompt(promptAdminId, promptId, req) {
    try {
        const data = {
            [promptSchema.fields.isLatest.name]: 'false',
        }
        // keep data immutable (new version on any change)
        await airtable.updateRecord(promptSchema.tableName, promptId, data);
        const { id, fields } = await recordPrompt(promptAdminId, req);
        return { id, fields };
    } catch (error) {
        console.error('Error while creating prompt', error);
        throw 'Error while creating prompt';
    }
}

async function getAllPrompts(promptAdminId) {
    try {
        const data = await airtable.getRecordByFilters(promptSchema.tableName, `{promptUserId}: '${promptAdminId}'`);
        if (data.length) {
            const latestData = getLatestPrompt(data);
            return latestData.map(({ id, fields }) => { id, fields });
        } else return [];
    } catch (error) {
        console.error('Error while fetching all prompts', error);
        throw 'Error while fetching all prompts';
    }

}



// helper functions
function getLatestPrompt(promptsArr) {
    const data = promptsArr.find((prompt) => prompt.isLatest === 'true');
    if (data) {
        return data;
    } else return null;
}

async function createNewVersion(promptAdminId, sectionId) {
    const data = await airtable.getRecordByFilters(promptSchema.tableName, `{promptUserId}: '${promptAdminId}'`);
    const versions = data.filter(({ fields }) => fields.sectionId === sectionId)
        .map(({ fields }) => fields.version);
    const latestVersion = Math.max(...versions);
    return latestVersion++;
}