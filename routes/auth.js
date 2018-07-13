const express = require('express');
const router = express.Router();
const db = require('../db/index');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');

router.post('/user-auth', async (req, res, next) => {
  try {
    const foundUser = await db.query('select * from users where username=$1', [
      req.body.username
    ]);
    if (foundUser.rows.length === 0) {
      return res.json({ message: 'Invalid username' });
    }
    const foundPassword = await bcrypt.compare(
      req.body.password,
      foundUser.rows[0].password
    );
    if (foundPassword === false) {
      return res.json({ message: 'Invalid Password' });
    } else {
      const token = jsonwebtoken.sign(
        {
          username: foundUser.rows[0].username
        },
        'SECRETK'
      );
      return res.json({ token });
    }
  } catch (err) {
    //  return next(new APIError(401, 'Unauthorized', 'You are Unauthorized'));
    return next(err);
  }
});

router.post('/companies-auth', async (req, res, next) => {
  try {
    const foundCompany = await db.query(
      'select * from companies where handle=$1',
      [req.body.handle]
    );
    if (foundCompany.rows.length === 0) {
      return res.json({ message: 'Invalid handle' });
    }
    const foundPassword = await bcrypt.compare(
      req.body.password,
      foundCompany.rows[0].password
    );
    if (foundPassword === false) {
      return res.json({ message: 'Invalid Password' });
    } else {
      const token = jsonwebtoken.sign(
        {
          handle: foundCompany.rows[0].handle
        },
        'SECRETK'
      );
      return res.json({ token });
    }
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
