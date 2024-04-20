module.exports = errorHandler;

function errorHandler(err, req, res, next) {
    switch (true) {
        case typeof err === 'string':
            // custom application error
            const is404 = err.toLowerCase().endsWith('not found');
            const statusCode = is404 ? 404 : 400;
            return res.status(statusCode).json({ message: err });
        case err.name === 'ValidationError':
            // mongoose validation error
            return res.status(400).json({ message: err.message });
        case err.name === 'UnauthorizedError':
            // jwt authentication error
            return res.status(401).json({ message: 'Unauthorized' });
        case typeof err.data === 'object':
            return res.status(400).json({message: getMessage(err.data.detail)});
        default:
            return res.status(500).json({ message: err.message });
    }
}

function getMessage(detail) {
   return detail.map(y => Object.values(y).length ? Object.values(y)[0] : "").filter(Boolean)
      .reduce(function(a,b){if(a.indexOf(b)<0)a.push(b);return a;},[]).toString();
}