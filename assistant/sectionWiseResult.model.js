const sectionWiseResult =  {
    tableName: 'SectionResults',
    fields: {
        id: {name : 'id', type: 'text'},
        assistantId: { name: 'assistantId', type: 'text' },
        patientId: { name: 'patientId', type: 'text' },
        sectionId: { name: 'sectionId', type: 'text' },
        sectionForm: { name: 'sectionForm', type: 'text' },
        sectionPromptResponse: { name: 'sectionPromptResponse', type: 'text' },
        promptVersionId: { name: 'promptVersionId', type: 'text' },
    }
};


module.exports = sectionWiseResult;