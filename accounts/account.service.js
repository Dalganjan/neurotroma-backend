const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require("crypto");
const sendEmail = require('_helpers/send-email');
const db = require('_helpers/db');
const Role = require('_helpers/role');
const pug = require('pug');
const path = require('path');

module.exports = {
    authenticate,
    refreshToken,
    revokeToken,
    register,
    verifyEmail,
    resendVerifyEmail,
    forgotPassword,
    validateResetToken,
    resetPassword,
    getAll,
    getById,
    create,
    update,
    delete: _delete
};

async function authenticate({ email, password, ipAddress }) {
    const account = await db.Account.findOne({ email });

    if (!account || !account.isVerified || !bcrypt.compareSync(password, account.passwordHash)) {
        throw 'Email or password is incorrect';
    }

    // authentication successful so generate jwt and refresh tokens
    const jwtToken = generateJwtToken(account);
    const refreshToken = generateRefreshToken(account, ipAddress);

    // save refresh token
    await refreshToken.save();

    // return basic details and tokens
    return {
        ...basicDetails(account),
        jwtToken,
        refreshToken: refreshToken.token
    };
}

async function refreshToken({ token, ipAddress }) {
    const refreshToken = await getRefreshToken(token);
    const { account } = refreshToken;

    // replace old refresh token with a new one and save
    const newRefreshToken = generateRefreshToken(account, ipAddress);
    refreshToken.revoked = Date.now();
    refreshToken.revokedByIp = ipAddress;
    refreshToken.replacedByToken = newRefreshToken.token;
    await refreshToken.save();
    await newRefreshToken.save();

    // generate new jwt
    const jwtToken = generateJwtToken(account);

    // return basic details and tokens
    return {
        ...basicDetails(account),
        jwtToken,
        refreshToken: newRefreshToken.token
    };
}

async function revokeToken({ token, ipAddress }) {
    const refreshToken = await getRefreshToken(token);

    // revoke token and save
    refreshToken.revoked = Date.now();
    refreshToken.revokedByIp = ipAddress;
    await refreshToken.save();
}

async function register(params, origin) {
    // validate
    if (await db.Account.findOne({ email: params.email.toLowerCase() })) {
        // send already registered error in email to prevent account enumeration
        return await sendAlreadyRegisteredEmail(`${params.firstName} ${params.lastName}`, params.email.toLowerCase(), origin);
    }

    console.log("Account Register", params);
    // create account object
    let account = new db.Account(params);
    account.email = account.email.toLowerCase();
    account.verificationToken = randomTokenString();

    // hash password
    account.passwordHash = hash(params.password);

    // save account
    await account.save();

    // send email
    await sendVerificationEmail(account, origin);
}

async function resendVerifyEmail({ email }, origin) {
    const account = await db.Account.findOne({ email: email });
    // validate
    if (account) {
        // recreate verification token
        account.verificationToken = randomTokenString();
        // save account
        await account.save();
         
        // send email
        await sendVerificationEmail(account, origin);
    }
}

async function verifyEmail({ token }) {
    const account = await db.Account.findOne({ verificationToken: token });

    if (!account) throw 'Verification failed';

    account.verified = Date.now();
    account.verificationToken = undefined;
    await account.save();
}

async function forgotPassword({ email }, origin) {
    const account = await db.Account.findOne({ email });

    // always return ok response to prevent email enumeration
    if (!account) return;

    // create reset token that expires after 7 days
    account.resetToken = {
        token: randomTokenString(),
        expires: new Date(Date.now() + 7*24*60*60*1000)
    };
    await account.save();

    // send email
    await sendPasswordResetEmail(account, origin);
}

async function validateResetToken({ token }) {
    const account = await db.Account.findOne({
        'resetToken.token': token,
        'resetToken.expires': { $gt: Date.now() }
    });

    if (!account) throw 'Invalid token';
}

async function resetPassword({ token, password }) {
    const account = await db.Account.findOne({
        'resetToken.token': token,
        'resetToken.expires': { $gt: Date.now() }
    });

    if (!account) throw 'Invalid token';

    // update password and remove reset token
    account.passwordHash = hash(password);
    account.passwordReset = Date.now();
    account.resetToken = undefined;
    await account.save();
    await sendSuccessfullResetPassword(account);
}

async function getAll() {
    const accounts = await db.Account.find();
    return accounts.map(x => basicDetails(x));
}

async function getById(id) {
    const account = await getAccount(id);
    return basicDetails(account);
}

async function create(params) {
    console.log("params", params);
    // validate
    if (await db.Account.findOne({ email: params.email })) {
        throw 'Email "' + params.email + '" is already registered';
    }

    const account = new db.Account(params);
    account.verified = Date.now();

    // hash password
    account.passwordHash = hash(params.password);

    // save account
    await account.save();

    return basicDetails(account);
}

async function update(id, params) {
    const account = await getAccount(id);

    // validate (if email was changed)
    if (params.email && account.email !== params.email && await db.Account.findOne({ email: params.email })) {
        throw 'Email "' + params.email + '" is already taken';
    }

    // hash password if it was entered
    if (params.password) {
        params.passwordHash = hash(params.password);
    }

    // copy params to account and save
    Object.assign(account, params);
    account.updated = Date.now();
    await account.save();

    return basicDetails(account);
}

async function _delete(id) {
    const account = await getAccount(id);
    await account.remove();
}

// helper functions

async function getAccount(id) {
    if (!db.isValidId(id)) throw 'Account not found';
    const account = await db.Account.findById(id);
    if (!account) throw 'Account not found';
    return account;
}

async function getRefreshToken(token) {
    const refreshToken = await db.RefreshToken.findOne({ token }).populate('account');
    if (!refreshToken || !refreshToken.isActive) throw 'Invalid token';
    return refreshToken;
}

function hash(password) {
    return bcrypt.hashSync(password, 10);
}

function generateJwtToken(account) {
    // create a jwt token containing the account id that expires in 1h
    return jwt.sign({ sub: account.id, id: account.id }, config.secret, { expiresIn: '1h' });
}

function generateRefreshToken(account, ipAddress) {
    // create a refresh token that expires in 7 days
    return new db.RefreshToken({
        account: account.id,
        token: randomTokenString(),
        expires: new Date(Date.now() + 7*24*60*60*1000),
        createdByIp: ipAddress
    });
}

function randomTokenString() {
    return crypto.randomBytes(40).toString('hex');
}

function basicDetails(account) {
    const { id, title, firstName, lastName, email, contactNumber, role, created, updated, isVerified } = account;
    return { id, title, firstName, lastName, email, contactNumber, role, created, updated, isVerified };
}

async function sendVerificationEmail(account, origin) {
    const template = pug.compileFile('_helpers/emails/verification_email.pug');
    let verifyUrl;  
    let message;
    if (origin) {
        verifyUrl = `${origin}/account/verify-email?token=${account.verificationToken}&email=${account.email}`;
        message = `<p>Click on <a href=${verifyUrl}>link</a>, or copy and paste the below URL in your browser</p>
                   <a href="${verifyUrl}">${verifyUrl}</a>`;
    } else {
        message = `<p>Please use the below token to verify your email address with the <code>/account/verify-email</code> api route:</p>
                   <p><code>${account.verificationToken}</code></p>`;
    }

    const emailData = {
        name: `${account.firstName} ${account.lastName}`,
        dynamicHtml: `${message}`,
        link: `<a href=${verifyUrl}>link</a>`,
      };

    const html = template(emailData);

    await sendEmail({
        to: account.email,
        subject: 'Sign-up Verification - Verify Email',
        html: `${html}`,
        attachments: setAttachments(),
    });
}

async function sendAlreadyRegisteredEmail(name, email, origin) {
    const template = pug.compileFile('_helpers/emails/alreadyregistered_email.pug');

    let message;
    if (origin) {
        message = `If you don't know your password please visit the <a href="${origin}/account/forgot-password">forgot password</a> page.
                   Your email <strong>${email}</strong> is already registered.`;
    } else {
        message = `If you don't know your password you can reset it via the <code>/account/forgot-password</code> api route.
                   Your email <strong>${email}</strong> is already registered.`;
    }

    const emailData = {
        name: `${name}`,
        dynamicHtml: `${message}`,
      };

    const html = template(emailData);  

    await sendEmail({
        to: email,
        subject: 'Email Already Registered',
        html: `${html}`,
        attachments: setAttachments(),
    });
}

async function sendPasswordResetEmail(account, origin) {
    const template = pug.compileFile('_helpers/emails/resetpassword_email.pug');
    let resetUrl;  
    let message;
    if (origin) {
        resetUrl = `${origin}/account/reset-password?token=${account.resetToken.token}`;
        message = `<p>Click on <a href=${resetUrl}>link</a>, or copy and paste the below URL in your browser</p>
                   <a style="font-size: 11px;" href="${resetUrl}">${resetUrl}</a>`;
    } else {
        message = `<p>Please use the below token to reset your password with the <code>/account/reset-password</code> api route:</p>
                   <p><code>${account.resetToken.token}</code></p>`;
    }

    const emailData = {
        name: `${account.firstName} ${account.lastName}`,
        dynamicHtml: `${message}`,
        link: `<a href=${resetUrl}>link</a>`
      };

    const html = template(emailData);

    await sendEmail({
        to: account.email,
        subject: 'Reset Password Email',
        html: `${html}`,
        attachments: setAttachments(),       
    });
}

async function sendSuccessfullResetPassword(account) {
    const template = pug.compileFile('_helpers/emails/successresetpassword_email.pug');
      
    const emailData = {
        name: `${account.firstName} ${account.lastName}`,
      };

    const html = template(emailData);

    await sendEmail({
        to: account.email,
        subject: 'Successfully Password Reset',
        html: `${html}`,
        attachments: setAttachments(),       
    });
}

function setAttachments() {
    return [];
    // return [
    //     {
    //       filename: 'email.png',
    //       path: 'assets/email.png', // Replace with the actual path to your image file
    //       cid: 'uniqueBottomImageName',
    //     },
    //     {
    //       filename: 'NO_GREY_LOGO.png',
    //       path: 'assets/NO_GREY_LOGO.png', // Replace with the actual path to your image file
    //       cid: 'headerImageName',
    //     }
    //   ];
    // // {
    // //     filename: 'emailbackground.png',
    // //     path: 'assets/emailbackground.png',
    // //     cid: 'emailbackground.png',
    // // }
}