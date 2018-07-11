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

router.get('/:id', checkLoggedIn, async function(req, res, next) {
  try {
    const data = await db.query('select * from users where id=$1', [
      req.params.id
    ]);
    const jobs = await db.query(
      'select jobs.id from jobs join jobs_users on jobs.id=jobs_users.job_id join users on users.id=jobs_users.user_id where users.id=$1 ',
      [req.params.id]
    );
    data.rows[0].jobs = jobs.rows.map(val => val.id);
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
      'insert into users (first_name,last_name,username,password,email,photo,current_company_id) values ($1,$2,$3,$4,$5,$6,$7)',
      [
        req.body.first_name,
        req.body.last_name,
        req.body.username,
        hashedPassword,
        req.body.email,
        req.body.photo,
        req.body.current_company_id
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

router.patch('/:id', checkCorrectUser, async function(req, res, next) {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const data = await db.query(
      'update users set username=$1,password=$2,email=$3, photo=$4,current_company_id=$5  where id=$6 returning *',
      [
        req.body.username,
        hashedPassword,
        req.body.email,
        req.body.photo,
        req.body.current_company_id,
        req.params.id
      ]
    );
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', checkCorrectUser, async function(req, res, next) {
  try {
    const data = await db.query('delete from users where id=$1 returning *', [
      req.params.id
    ]);
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.post('/auth', async (req, res, next) => {
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
          user_id: foundUser.rows[0].id
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
