const promptModel =  {
    TableName: 'PromptVersions',
    Fields: {
        prompt: String,
        version: Number,
        createdAt: Date,
        ExtraData: Text // Use a text field to store JSON data
    }
};


module.exports = promptModel;