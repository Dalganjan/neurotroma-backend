const jwt = require('express-jwt');
const { secret } = require('config.json');
const accountService = require('_airtable/account.service');
const airtableService = require('_airtable/airtable.service');

module.exports = authorize;

function authorize(roles = []) {
    // roles param can be a single role string (e.g. Role.User or 'User') 
    // or an array of roles (e.g. [Role.Admin, Role.User] or ['Admin', 'User'])
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return [
        // authenticate JWT token and attach user to request object (req.user)
        jwt({ secret, algorithms: ['HS256'] }),

        // authorize based on user role
        async (req, res, next) => {
            const account = await accountService.getUserById(req.user.id);
            const refreshTokens = await airtableService.getRecordByFilters('RevokedTokens', `{accountId} = '${req.user.id}'`);
            const nonExpiredTokens = refreshTokens.filter((token) => token.fields.isExpired === 'false');
            
            if (!account || (roles.length && !roles.includes(account.fields.role))) {
                // account no longer exists or role not authorized
                return res.status(401).json({ message: 'Unauthorized' });
            }

            // authentication and authorization successful
            req.user.role = account.fields.role;
            req.user.ownsToken = token => !!nonExpiredTokens.find(({ fields }) => fields.Token === token);
            next();
        }
    ];
}