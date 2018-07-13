const express = require('express');
const router = express.Router();
const db = require('../db/index');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const {
  checkCorrectUser,
  checkLoggedIn,
  checkCorrectCompany
} = require('../middleware/auth');
const validate = require('jsonschema').validate;
const companiesSchema = require('../schema/companiesSchema');
const APIError = require('../APIError');

// POST /companies - this should create a new company
router.post('', async function(req, res, next) {
  try {
    const validation = validate(req.body, companiesSchema);
    if (!validation.valid) {
      const errors = validation.errors.map(err => err.stack);
      // errors is an array of all the errors
      return next(errors);
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const data = await db.query(
      'insert into companies (name,email,logo,handle,password) values($1,$2,$3,$4,$5) returning *',
      [
        req.body.name,
        req.body.email,
        req.body.logo,
        req.body.handle,
        hashedPassword
      ]
    );
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

// GET /companies - this should return a list of all the company objects
router.get('', checkLoggedIn, async function(req, res, next) {
  try {
    const data = await db.query('select * from companies');
    return res.json(data.rows);
  } catch (err) {
    return next();
  }
});

// GET /companies/:handle - this should return a single company found by its id
router.get('/:handle', checkLoggedIn, async function(req, res, next) {
  try {
    const companyData = await db.query(
      'select * from companies where handle=$1',
      [req.params.handle]
    );
    const employees = await db.query(
      'select users.username from users where current_company=$1',
      [req.params.handle]
    );
    const jobs = await db.query('select jobs.id from jobs where company=$1', [
      req.params.handle
    ]);

    companyData.rows[0].employees = employees.rows.map(val => val.username);
    companyData.rows[0].jobs = jobs.rows.map(val => val.id);
    return res.json(companyData.rows[0]);
  } catch (err) {
    return next(err);
  }
});
// PATCH /companies/:handle - this should update an existing company and return the updated company
router.patch('/:handle', checkCorrectCompany, async function(req, res, next) {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const data = await db.query(
      'update companies set email=$1,logo=$2,handle=$3,password=$4,name=$5 where handle=$6 returning *',
      [
        req.body.email,
        req.body.logo,
        req.body.handle,
        hashedPassword,
        req.body.name,
        req.params.handle
      ]
    );
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});
// DELETE /companies/:handle - this should remove an existing company and return the deleted company
router.delete('/:handle', checkCorrectCompany, async function(req, res, next) {
  try {
    const data = await db.query(
      'delete from companies where handle=$1 returning *',
      [req.params.handle]
    );
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
