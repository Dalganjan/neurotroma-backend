const accountSchema = {
    tableName: 'Accounts',
    fields: {
        title: {name: 'title', type: 'text'},
        firstName: { name: 'firstName', type: 'text' },
        lastName : { name: 'lastName', type: 'text' },
        password: { name: 'password', type: 'text' },
        contactNumber: { name: 'contactNumber', type: 'text' },
        email: { name: 'email', type: 'text' },
        role: { name: 'role',  type: 'text' }
    }
};

module.exports = accountSchema;