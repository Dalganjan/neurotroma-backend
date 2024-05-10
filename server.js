﻿require('rootpath')();
const express = require('express');
const timeout = require('connect-timeout');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('_middleware/error-handler');

app.use(timeout(120000));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// allow cors requests from any origin and with credentials
app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));

// api routes
app.use('/api/accounts', require('./accounts/accounts.airtable.controller'));

// assistant routes
app.use('/api/assistants', require('./assistant/assistant.controller'));

// prompt routes
app.use('/api/prompts', require('./prompt/prompt.controller'));

// swagger docs route
app.use('/api/api-docs', require('_helpers/swagger'));

// global error handler
app.use(errorHandler);

// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
app.listen(port, () => {
    console.log('Server listening on port ' + port);
});
