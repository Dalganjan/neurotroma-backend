const accountSchema = require('./account.model');
const airtableService = require('./airtable.service');

module.exports = {
    createUser,
    getUserByEmail,
    updateUserByEmailId,
    getUserById,
};


async function createUser(user) {
    try {
        const newUser = await airtableService.createRecord(accountSchema.tableName, user);
        return newUser.getId();
    } catch (error) {
        console.error('Error creating user in Airtable:', error);
        throw new Error('Failed to create user');
    }
}

async function getUserById(id) {
    try {
        const user = await airtableService.getRecordById(accountSchema.tableName, id);
        return user;
    } catch (error) {
        console.error('Error getting user in Airtable:', error);
        throw new Error('Failed to get user');
    }
}

async function getUserByEmail(emailId) {
    try {
        const records = await airtableService.getRecordByFilters(accountSchema.tableName, `{${accountSchema.fields.email.name}} = '${emailId}'`);
        if (records.length === 0) {
            return null; // User not found
        }
        return { fields: records[0].fields, id: records[0].id };
    } catch (error) {
        console.error('Error fetching user from Airtable:', error);
        throw new Error('Failed to get user');
    }
}

async function updateUserByEmailId(emailId, updatedFields) {
    try {
        const records = await airtableService.getRecordByFilters(accountSchema.tableName, `{${accountSchema.fields.email.name}} = '${emailId}'`);
        if (records.length === 0) {
            throw new Error('User not found');
        }
        const userRecord = records[0];
        await userRecord.patchUpdate(updatedFields);
    } catch (error) {
        console.error('Error updating user in Airtable:', error);
        throw new Error('Failed to update user');
    }
}