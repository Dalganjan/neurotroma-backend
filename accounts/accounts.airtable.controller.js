const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const authorize = require('_middleware/authorize')
const Role = require('_helpers/role');
const accountService = require('./account.airtable.service');

// routes
router.post('/authenticate', authenticateSchema, authenticate);
router.post('/refresh-token', refreshToken);
router.post('/register', registerSchema, register);
router.post('/revoke-token', authorize(), revokeTokenSchema, revokeToken);

module.exports = router;

function authenticateSchema(req, res, next) {
    const schema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function authenticate(req, res, next) {
    const { email, password } = req.body;
    accountService.authenticate({ email, password })
        .then(({ refreshToken, ...account }) => {
            setTokenCookie(res, refreshToken);
            res.json(account);
        })
        .catch(next);
}

function refreshToken(req, res, next) {
    const token = req.cookies.refreshToken || req.headers['Authorization'];
    accountService.refreshToken({ token })
        .then(({ refreshToken, ...account }) => {
            setTokenCookie(res, refreshToken);
            res.json(account);
        })
        .catch(next);
}

function registerSchema(req, res, next) {
    const schema = Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        contactNumber: Joi.string().pattern(/^(?:\+\d{1,3}\s*)?\d{10,15}$/).required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
        role: Joi.string().valid(Role.Assistant, Role.PromptAdmin).required(),
    });
    validateRequest(req, next, schema);
}

function register(req, res, next) {
    accountService.register(req.body, req.get('origin'))
        .then(() => res.status(201).json({ message: 'Registration successful, please perfom login now' }))
        .catch(next);
}

function setTokenCookie(res, token) {
    // create cookie with refresh token that expires in 1 day
    const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now() + 24*60*60*1000)
    };
    res.cookie('refreshToken', token, cookieOptions);
}

function revokeTokenSchema(req, res, next) {
    const schema = Joi.object({
        token: Joi.string().empty('')
    });
    validateRequest(req, next, schema);
}

function revokeToken(req, res, next) {
    const token = req.body.token || req.cookies.refreshToken || getTokenFromAuthorisation(req.headers['authorization']);

    if (!token) return res.status(400).json({ message: 'Token is required' });

    if (!req.user.ownsToken(token)) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    accountService.revokeToken(token)
      .then(() => res.json({ message: 'Logout successfully' }))
      .catch(next);
}

function getTokenFromAuthorisation(bearerToken) {
    return bearerToken.split(' ')[1];
}