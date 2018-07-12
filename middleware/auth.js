const jsonwebtoken = require('jsonwebtoken');

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
    return res.json({
      message: 'You need to authenticate before accessing this resource.'
    });
  }
}

// function checkLoggedInCompany(req, res, next) {
//   try {
//     const token = req.headers.authorization;
//     const decodedToken = jsonwebtoken.verify(token, 'SECRETK');
//     return next();
//   } catch (err) {
//     return res.json({ message: 'Unauthorized' });
//   }
// }

function checkCorrectUser(req, res, next) {
  try {
    const token = req.headers.authorization;
    const decodedToken = jsonwebtoken.verify(token, 'SECRETK');
    if (decodedToken.username === req.params.username) {
      return next();
    } else {
      const forbiddenError = new Error(
        'You are not the right person to do that.'
      );
      forbiddenError.status = 403;
      return next(forbiddenError);
    }
  } catch (err) {
    const unauthorizedError = new Error(
      'You are not authorized. You must login and use a token.'
    );
    unauthorizedError.status = 401;
    return next(unauthorizedError);
  }
}

function checkCorrectCompany(req, res, next) {
  try {
    const token = req.headers.authorization;
    const decodedToken = jsonwebtoken.verify(token, 'SECRETK');
    if (decodedToken.handle === req.params.handle) {
      return next();
    } else {
      return res.json({ message: 'Unauthorized' });
    }
  } catch (err) {
    return res.json({ message: 'Unauthorized' });
  }
}

module.exports = {
  checkCorrectUser,
  checkLoggedIn,
  checkCorrectCompany
  // checkLoggedInCompany
};
