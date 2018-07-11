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

// POST /companies - this should create a new company
router.post('', async function(req, res, next) {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const data = await db.query(
      'insert into companies (name,logo,handle,password) values($1,$2,$3,$4) returning *',
      [req.body.name, req.body.logo, req.body.handle, hashedPassword]
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

// GET /companies/:id - this should return a single company found by its id
router.get('/:id', checkLoggedIn, async function(req, res, next) {
  try {
    const companyData = await db.query('select * from companies where id=$1', [
      req.params.id
    ]);
    const users = await db.query(
      'select users.id from users where current_company_id=$1',
      [req.params.id]
    );
    const jobs = await db.query(
      'select jobs.id from jobs where company_id=$1',
      [req.params.id]
    );

    companyData.rows[0].users = users.rows.map(val => val.id);
    companyData.rows[0].jobs = jobs.rows.map(val => val.id);
    return res.json(companyData.rows[0]);
  } catch (err) {
    return next(err);
  }
});
// PATCH /companies/:id - this should update an existing company and return the updated company
router.patch('/:id', checkCorrectCompany, async function(req, res, next) {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const data = await db.query(
      'update companies set name=$1,logo=$2,handle=$3,password=$4 where id=$5 returning *',
      [
        req.body.name,
        req.body.logo,
        req.body.handle,
        hashedPassword,
        req.params.id
      ]
    );
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});
// DELETE /companies/:id - this should remove an existing company and return the deleted company
router.delete('/:id', checkCorrectCompany, async function(req, res, next) {
  try {
    const data = await db.query(
      'delete from companies where id=$1 returning *',
      [req.params.id]
    );
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.post('/auth', async (req, res, next) => {
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
          company_id: foundCompany.rows[0].id
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
