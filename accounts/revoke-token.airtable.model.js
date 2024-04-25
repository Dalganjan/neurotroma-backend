const revokeToken = {
    tableName: 'RevokeToken',
    fields: {
        token : { name: 'token', type: 'text' },
        accountId : { name: 'accountId', type: 'text' },
        isExpired : { name: 'isExpired', type: 'text' }
    }
};

module.exports = revokeToken;