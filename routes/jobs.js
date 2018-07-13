const express = require('express');
const router = express.Router();
const db = require('../db/index');
const jsonwebtoken = require('jsonwebtoken');
const {
  checkCorrectUser,
  checkLoggedIn,
  checkCorrectCompany
} = require('../middleware/auth');
const validate = require('jsonschema').validate;
const jobsSchema = require('../schema/jobsSchema');
const APIError = require('../APIError');

// POST /jobs - this route creats a new job
router.post('', checkLoggedIn, async function(req, res, next) {
  try {
    if (req.handle) {
      const validation = validate(req.body, jobsSchema);
      if (!validation.valid) {
        return next(
          new APIError(
            400,
            'Bad Request',
            validation.errors.map(e => e.stack).join('. ')
          )
        );
      }
      const data = await db.query(
        'insert into jobs (title,salary,equity,company) values($1,$2,$3,$4) returning *',
        [req.body.title, req.body.salary, req.body.equity, req.handle]
      );
      return res.json(data.rows[0]);
    } else {
      const forbiddenError = new APIError(
        403,
        'forbidden',
        'You are not the right person to do that.'
      );
      return next(forbiddenError);
    }
  } catch (err) {
    return next(err);
  }
});
// GET /jobs - this route should list all of the jobs.
router.get('', checkLoggedIn, async function(req, res, next) {
  try {
    const data = await db.query('select * from jobs');
    return res.json(data.rows);
  } catch (err) {
    return next(err);
  }
});
// GET /jobs/:id - this route should show information about a specific job
router.get('/:id', checkLoggedIn, async function(req, res, next) {
  try {
    const data = await db.query('select * from jobs where id = $1', [
      req.params.id
    ]);
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});
// PATCH /jobs/:id - this route should let you update a job by its ID
router.patch('/:id', checkLoggedIn, async function(req, res, next) {
  try {
    const foundJob = await db.query('select * from jobs where id=$1', [
      req.params.id
    ]);
    if ((foundJob.company = req.handle)) {
      const data = await db.query(
        'update jobs set title=$1,salary=$2,equity=$3,company=$4 where id=$5 returning *',
        [
          req.body.title,
          req.body.salary,
          req.body.equity,
          req.handle,
          req.params.id
        ]
      );
      return res.json(data.rows);
    } else {
      const forbiddenError = new APIError(
        403,
        'forbidden',
        'You are not the right person to do that.'
      );
      return next(forbiddenError);
    }
  } catch (err) {
    return next(err);
  }
});
// DELETE /jobs/:id - this route lets you delete a job posting
router.delete('/:id', checkLoggedIn, async function(req, res, next) {
  try {
    const foundJob = await db.query('select * from jobs where id=$1', [
      req.params.id
    ]);
    if ((foundJob.company = req.handle)) {
      const data = await db.query('delete from jobs where id=$1 returning *', [
        req.params.id
      ]);
      return res.json({ deleted: data.rows[0] });
    } else {
      const forbiddenError = new APIError(
        403,
        'forbidden',
        'You are not the right person to do that.'
      );
      return next(forbiddenError);
    }
  } catch (err) {
    return next(err);
  }
});

//Apply to a job by its id, the username is collected from the token. No POST body required.
router.post('/:id/apply', checkLoggedIn, async (req, res, next) => {
  try {
    const foundJob = await db.query('select * from jobs where id=$1', [
      req.params.id
    ]);
    if (req.username) {
      const data = await db.query(
        'insert into jobs_users (username,job_id) values($1,$2) returning *',
        [req.username, req.params.id]
      );
      return res.json(data.rows[0]);
    } else {
      const forbiddenError = new APIError(
        403,
        'forbidden',
        'You are not the right person to do that.'
      );
      return next(forbiddenError);
    }
  } catch (err) {
    return next(err);
  }
});

//Auth Required. Correct User/Company Required.. A user may withdraw their application, or a company may delete it.
router.delete('/:id/apply', checkLoggedIn, async (req, res, next) => {
  try {
    const foundJob = await db.query('select * from jobs where id=$1', [
      req.params.id
    ]);
    if (req.username) {
      const data = await db.query(
        'delete from jobs_users where username=$1 and job_id=$2 returning *',
        [req.username, req.params.id]
      );
      return res.json(data.rows[0]);
    } else {
      const data = await db.query(
        //which username are we deleting
        'delete  from jobs_users where username=$1 and job_id=$2 returning *',
        [req.handle, req.params.id]
      );
      return res.json(data.rows[0]);
    }
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
