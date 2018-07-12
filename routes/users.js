const express = require('express');
const router = express.Router();
const db = require('../db/index');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const { checkCorrectUser, checkLoggedIn } = require('../middleware/auth');
const validate = require('jsonschema').validate;
const usersSchema = require('../schema/usersSchema');

router.get('', checkLoggedIn, async function(req, res, next) {
  try {
    // get all the users
    const data = await db.query('select * from users');
    return res.json(data.rows);
  } catch (err) {
    return next(err);
  }
});

router.get('/:username', checkLoggedIn, async function(req, res, next) {
  try {
    const data = await db.query('select * from users where username=$1', [
      req.params.username
    ]);
    const applied_to = await db.query(
      'select * from jobs_users where username=$1 ',
      [req.params.username]
    );
    data.rows[0].applied_to = applied_to.rows.map(val => val.id);
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.post('', async function(req, res, next) {
  try {
    const validation = validate(req.body, usersSchema);
    if (!validation.valid) {
      const errors = validation.errors.map(err => err.stack);
      // errors is an array of all the errors
      return next(errors);
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const data = await db.query(
      'insert into users (first_name,last_name,username,password,email,photo,current_company) values ($1,$2,$3,$4,$5,$6,$7)',
      [
        req.body.first_name,
        req.body.last_name,
        req.body.username,
        hashedPassword,
        req.body.email,
        req.body.photo,
        req.body.current_company
      ]
    );
    // delete data.rows[0].password;
    return res.json(data.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      const conflict = new Error('That username is taken');
      conflict.status = 409;
      return next(conflict);
    }
    return next(err);
  }
});

router.patch('/:username', checkCorrectUser, async function(req, res, next) {
  try {
    const validation = validate(req.body, usersSchema);
    if (!validation.valid) {
      const errors = validation.errors.map(err => err.stack);
      // errors is an array of all the errors
      return next(errors);
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const data = await db.query(
      'update users set username=$1,password=$2,email=$3, photo=$4,current_company=$5  where username=$6 returning *',
      [
        req.body.username,
        hashedPassword,
        req.body.email,
        req.body.photo,
        req.body.current_company,
        req.params.username
      ]
    );
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.delete('/:username', checkCorrectUser, async function(req, res, next) {
  try {
    const data = await db.query(
      'delete from users where username=$1 returning *',
      [req.params.username]
    );
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

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
    return next(err);
  }
});

module.exports = router;
