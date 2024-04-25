const Airtable = require('airtable');
const { airtable: { AIRTABLE_API_TOKEN, AIRTABLE_BASE  } } = require('config.json');


Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: AIRTABLE_API_TOKEN
});

const base = Airtable.base(AIRTABLE_BASE);

module.exports = base;