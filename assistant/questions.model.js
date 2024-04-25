const promptModel =  {
    TableName: 'PatientAnswers',
    Fields: {
        assistantId: String,
        sectionWiseAnswers: Text,
        createdAt: Date,
        ExtraData: Text // Use a text field to store JSON data
    }
};


module.exports = promptModel;