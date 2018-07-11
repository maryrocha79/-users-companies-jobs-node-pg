const jsonwebtoken = require('jsonwebtoken');

function checkLoggedIn(req, res, next) {
  try {
    const token = req.headers.authorization;
    const decodedToken = jsonwebtoken.verify(token, 'SECRETK');
    if (decodedToken.company_id) {
      console.log('is a company');
      req.company_id = decodedToken.company_id;
    } else if (decodedToken.user_id) {
      console.log('is a user');
      req.company_id = decodedToken.company_id;
    }
    return next();
  } catch (err) {
    // console.log('ERR?', err);
    return res.json({ message: 'Unauthorized' });
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
    if (decodedToken.user_id === +req.params.id) {
      return next();
    } else {
      return res.json({ message: 'Unauthorized' });
    }
  } catch (err) {
    return res.json({ message: 'Unauthorized' });
  }
}

function checkCorrectCompany(req, res, next) {
  try {
    const token = req.headers.authorization;
    const decodedToken = jsonwebtoken.verify(token, 'SECRETK');
    if (decodedToken.company_id === +req.params.id) {
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
