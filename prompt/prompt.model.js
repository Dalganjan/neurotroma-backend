const promptModel =  {
    tableName: 'Prompts',
    fields: {
        promptId: {name: 'promptId', type: 'text'},
        promptDetails: {name: 'promptDetails', type: 'text'},
        promptUserId: {name: 'promptUserId', type: 'text'},
        version: {name: 'version', type: 'Number'},
        isLatest: {name: 'isLatest', type: 'boolean' },
        sectionId: {name: 'sectionId', type: 'text' },
        editorPromptDetails: {name: 'editorPromptDetails', type: 'text'},
        ExtraData: String // Use a text field to store JSON data
    }
};


module.exports = promptModel;