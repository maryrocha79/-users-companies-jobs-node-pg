const express = require('express');
const router = express.Router();
const db = require('../db/index');
const jsonwebtoken = require('jsonwebtoken');
const { checkCorrectUser, checkLoggedIn } = require('../middleware/auth');

// POST /jobs - this route creats a new job
router.post('', async function(req, res, next) {
  try {
    const data = await db.query(
      'insert into jobs (title,salary,equity,company_id) values($1,$2,$3,$4) returning *',
      [req.body.title, req.body.salary, req.body.equity, req.body.company_id]
    );
    return res.json(data.rows[0]);
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
router.patch('/:id', async function(req, res, next) {
  try {
    const data = await db.query(
      'update jobs set title=$1,salary=$2,equity=$3,company_id=$4 where id=$5 returning *',
      [
        req.body.title,
        req.body.salary,
        req.body.equity,
        req.body.company_id,
        req.params.id
      ]
    );
    return res.json(data.rows);
  } catch (err) {
    return next(err);
  }
});
// DELETE /jobs/:id - this route lets you delete a job posting
router.delete('/:id', async function(req, res, next) {
  try {
    const data = await db.query('delete from jobs where id=$1 returning *', [
      req.params.id
    ]);
    return res.json({ deleted: data.rows[0] });
  } catch (err) {
    return next(err);
  }
});
module.exports = router;
