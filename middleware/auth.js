const jsonwebtoken = require('jsonwebtoken');
const APIError = require('../APIError');

function checkLoggedIn(req, res, next) {
  try {
    const token = req.headers.authorization;
    const decodedToken = jsonwebtoken.verify(token, 'SECRETK');
    if (decodedToken.handle) {
      console.log('is a company');
      req.handle = decodedToken.handle;
    } else if (decodedToken.username) {
      console.log('is a user');
      req.username = decodedToken.username;
    }
    return next();
  } catch (err) {
    // console.log('ERR?', err);
    return next(new APIError(401, 'Unauthorized', 'You are Unauthorized'));
  }
}

function checkCorrectUser(req, res, next) {
  try {
    const token = req.headers.authorization;
    const decodedToken = jsonwebtoken.verify(token, 'SECRETK');
    if (decodedToken.username === req.params.username) {
      return next();
    } else {
      const forbiddenError = new APIError(
        403,
        'forbidden',
        'You are not the right person to do that.'
      );
      return next(forbiddenError);
    }
  } catch (err) {
    return next(new APIError(401, 'Unauthorized', 'You are Unauthorized'));
  }
}

//change to handle with status codes like in checkcorrectuser
function checkCorrectCompany(req, res, next) {
  try {
    const token = req.headers.authorization;
    const decodedToken = jsonwebtoken.verify(token, 'SECRETK');
    if (decodedToken.handle === req.params.handle) {
      return next();
    } else {
      const forbiddenError = new APIError(
        403,
        'Unauthorized',
        'You are not the right company to do that.'
      );
      return next(forbiddenError);
    }
  } catch (err) {
    return next(new APIError(401, 'Unauthorized', 'You are Unauthorized'));
  }
}

module.exports = {
  checkCorrectUser,
  checkLoggedIn,
  checkCorrectCompany
  // checkLoggedInCompany
};
