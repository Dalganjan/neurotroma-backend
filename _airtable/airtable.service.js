const base = require('_helpers/airtable');

module.exports = {
    fetchRecords,
    getRecordById,
    createRecord,
    updateRecord,
    deleteRecord,
    getRecordByFilters
}

// fetch all records
async function fetchRecords(tableName) {
    const records = await base(tableName).select().all();
    return records;
}

// get record by recordId
async function getRecordById(tableName, recordId) {
    const records = await base(tableName).find(recordId);
    return records;
}

// insert new record
async function createRecord(table, data) {
    try {
        const createdRecord = await base(table).create(data);
        console.log('Record created:', createdRecord);
        return createdRecord;
    } catch (error) {
        console.error('Error creating record:', error);
        throw error;
    }
}

// update a record
async function updateRecord(table, recordId, data) {
    try {
        const updatedRecord = await base(table).update(recordId, data);
        console.log('Record updated:', updatedRecord);
        return updatedRecord;
    } catch (error) {
        console.error('Error updating record:', error);
        throw error;
    }
}

// Function to delete a record
async function deleteRecord(table, recordId) {
    try {
        await base(table).destroy(recordId);
        console.log('Record deleted successfully');
    } catch (error) {
        console.error('Error deleting record:', error);
        throw error;
    }
}

async function getRecordByFilters(table, filterQuery) {
    try {
        const data = await base(table).select({
            filterByFormula: `${filterQuery}`
        }).all(); // filter by formula {Email} = '${email}'
        console.log('data fetched', data);
        return data;
    } catch (error) {
        console.error('Error generating record:', error);
        throw error;
    }
    
}