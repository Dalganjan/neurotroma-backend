const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require("crypto");
const accountService = require('_airtable/account.service');
const airtable = require('_airtable/airtable.service');
const base = require('_helpers/airtable');
const accountSchema = require('_airtable/account.model');
const Role = require('_helpers/role');
const path = require('path');

module.exports = {
    authenticate,
    refreshToken,
    register,
    revokeToken,
};

async function authenticate({ email, password }) {
    const account = await accountService.getUserByEmail(email);

    if (!account || !bcrypt.compareSync(password, account.fields.password)) {
        throw 'Email or password is incorrect';
    }

    // authentication successful so generate jwt and refresh tokens
    const jwtToken = generateAccessToken(account);
    const refreshToken = generateRefreshToken(account);

    // save authentication token
    await createOrUpdateToken(refreshToken, account.id);

    // return basic details and tokens
    return {
        ...basicDetails(account.fields, account.id),
        jwtToken,
        refreshToken
    };
}

async function refreshToken({ token }) {
    const id = await getAccountIdbyToken(token);
    if(!id) {
        throw "Invalid token";
    }
    const account = await getAccount(id);

    // replace old refresh token with a new one and save
    const newRefreshToken = generateAccessToken(account);
    // generate new jwt
    const jwtToken = generateJwtToken(account);

    await createOrUpdateToken(jwtToken, id);

    // return basic details and tokens
    return {
        ...basicDetails(account.fields, id),
        jwtToken,
        newRefreshToken
    };
}

async function register(params, origin) {
    // validate
    if (await accountService.getUserByEmail(params.email.toLowerCase())) {
        return `Already Registered with email ${params.email}, please login or register with different emailId`;
    }

    console.log("Account Register", params);
    let { title, firstName, lastName, email, contactNumber, password, role } = params; 

    const newAccount = {
        [accountSchema.fields.title.name]: title,
        [accountSchema.fields.firstName.name]: firstName,
        [accountSchema.fields.lastName.name]: lastName,
        [accountSchema.fields.email.name]: email.toLowerCase(),
        [accountSchema.fields.contactNumber.name]: contactNumber,
        [accountSchema.fields.password.name]:  hash(password),
        [accountSchema.fields.role.name]: role
    };
    
    // save account
    await accountService.createUser(newAccount);
    return newAccount;
}

async function revokeToken(token) {
    try {
        // Store the revoked token in Airtable
        await createOrUpdateToken(token);
    } catch (error) {
        console.error('Error revoking token:', error);
        throw 'Failed to revoke token';
    }
}

// helper functions

async function getAccount(id) {
    const account = await accountService.getUserById(id);
    if (!account) throw 'Account not found';
    return account;
}

async function getTokenDetails(token) {
    try {
        const data = await airtable.getRecordByFilters('RevokedTokens', `{Token} = '${token}'`);
        return data;
    } catch (error) {
        throw "Error while fetching token details";
    }
}

async function getAccountIdbyToken(token) {
    try {
        const data = await getTokenDetails(token);
        const nonExpiredData = (data && data.length == 1  && data[0].fields && (data[0].fields.isExpired === 'false')) ? data[0] : {};
        if (nonExpiredData && nonExpiredData.id) {
            const { accountId } = nonExpiredData.fields;
            return accountId;
        } else {
            return null; 
        }
    } catch (error) {
        console.error("Error while processing token", error);
        throw "Error while processing token";
    }

}

function hash(password) {
    return bcrypt.hashSync(password, 10);
}

function generateJwtToken(account) {
    // create a jwt token containing the account id that expires in 1h
    return jwt.sign({ sub: account.id, id: account.id }, config.secret, { expiresIn: '1h' });
}

// Generate Access Token
function generateAccessToken(user) {
    return jwt.sign({ sub: user.id, id: user.id }, config.secret, { expiresIn: '1h' });
}

// Generate Refresh Token
function generateRefreshToken(user) {
    return jwt.sign({ sub: user.id, id: user.id }, config.secret);
}

function randomTokenString() {
    return crypto.randomBytes(40).toString('hex');
}

function basicDetails(account, id) {
    const { title, firstName, lastName, email, contactNumber, role } = account;
    return { id, title, firstName, lastName, email, contactNumber, role };
}

async function createOrUpdateToken(token, id) {
    try {
        const data = await getTokenDetails(token);
        if (data.length && data.fields) {
            await airtable.updateRecord('RevokedTokens', data[0].id, { Token: token, accountId: data[0].fields.accountId, isExpired: 'true'});
        } else {
            await airtable.createRecord('RevokedTokens', { Token: token, accountId: id,  isExpired: 'false' });
        }
    } catch (error) {
        throw "Error while updating/creating new token";
    }
}