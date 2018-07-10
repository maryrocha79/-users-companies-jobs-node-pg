const jsonwebtoken = require('jsonwebtoken');

function checkLoggedIn(req, res, next) {
  try {
    const token = req.headers.authorization;
    const decodedToken = jsonwebtoken.verify(token, 'SECRETK');
    return next();
  } catch (err) {
    // console.log('ERR?', err);
    return res.json({ message: 'Unauthorized' });
  }
}

function checkCorrectUser(req, res, next) {
  try {
    const token = req.headers.authorization;
    const decodedToken = jsonwebtoken.verify(token, 'SECRETK');
    if (decodedToken.user_id === +req.params.id) {
      return next();
    } else {
      return res.json({ message: 'Unauthorized' });
    }
  } catch (err) {
    return res.json({ message: 'Unauthorized' });
  }
}

function checkLoggedInCompany(req, res, next) {
  try {
    const token = req.headers.authorization;
    const decodedToken = jsonwebtoken.verify(token, 'SECRETK');
    return next();
  } catch (err) {
    return res.json({ message: 'Unauthorized' });
  }
}

module.exports = {
  checkCorrectUser,
  checkLoggedIn,
  checkCorrectCompany,
  checkLoggedInCompany
};
