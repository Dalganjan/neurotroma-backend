const patient = {
    tableName: 'AssistantPatients',
    fields: {
        patientId : { name: 'patientId', type: 'text' },
        assistantId : { name: 'assistantId', type: 'text' },
        addedAt : { name: 'addedAt', type: 'Date' }
    }
};

module.exports = patient;