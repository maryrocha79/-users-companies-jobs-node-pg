const express = require('express');
const router = express.Router();
const db = require('../db/index');
const bcrypt = require('bcrypt');
const { checkCorrectUser, checkLoggedIn } = require('../middleware/auth');
const validate = require('jsonschema').validate;
const usersSchema = require('../schema/usersSchema');
const APIError = require('../APIError');

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
      return next(
        new APIError(
          400,
          'Bad Request',
          validation.errors.map(e => e.stack).join('. ')
        )
      );
    }
    const foundUsername = await db.query(
      'SELECT * from users WHERE username = $1',
      [req.body.username]
    );
    if (!foundUsername.rows[0]) {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const data = await db.query(
        'INSERT INTO users (first_name, last_name, username, password, email, photo, current_company) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
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
      return res.json(data.rows[0]);
    } else {
      return next(new APIError(409, 'Conflict', 'Username is already taken'));
    }
  } catch (err) {
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

module.exports = router;
