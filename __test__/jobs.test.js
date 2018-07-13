process.env.NODE_ENV = 'test';
const db = require('../db');
const request = require('supertest');
const app = require('..');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const APIError = require('../APIError');

// global auth variable to store things for all the tests
const auth = {};

beforeAll(async () => {
  console.log('created users');

  await db.query(
    'CREATE TABLE companies (id SERIAL PRIMARY KEY, handle TEXT UNIQUE NOT NULL, password TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, logo TEXT )'
  );

  await db.query(
    `CREATE TABLE jobs (id SERIAL PRIMARY KEY, title TEXT, salary TEXT, equity FLOAT, company TEXT NOT NULL REFERENCES companies(handle) ON DELETE CASCADE)`
  );

  await db.query(`CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  photo TEXT,
  current_company TEXT REFERENCES companies (handle) ON DELETE SET NULL
)`);

  await db.query(`CREATE TABLE jobs_users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL REFERENCES users (username) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES jobs (id) ON DELETE CASCADE
)`);
});

beforeEach(async () => {
  // login a user, get a token, store the user ID and token
  const hashedPassword = await bcrypt.hash('secret', 1);
  await db.query("INSERT INTO users (username, password) VALUES ('test', $1)", [
    hashedPassword
  ]);
  const response = await request(app)
    .post('/user-auth')
    .send({
      username: 'test',
      password: 'secret'
    });
  auth.token = response.body.token;
  auth.current_username = jwt.decode(auth.token).username;

  // do the same for company "companies"
  const hashedCompanyPassword = await bcrypt.hash('secret', 1);
  await db.query(
    "INSERT INTO companies (name, email, handle, password) VALUES ('testcompanyname', 'testcompanyemail', 'testcompany', $1)",
    [hashedCompanyPassword]
  );
  const companyResponse = await request(app)
    .post('/companies-auth')
    .send({
      handle: 'testcompany',
      password: 'secret'
    });
  auth.company_token = companyResponse.body.token;
  auth.current_company_handle = jwt.decode(auth.company_token).handle;
  await db.query(
    "INSERT INTO jobs (title, equity, salary, company) VALUES ('FrontEng', '2.1', '130k', $1)",
    [auth.current_company_handle]
  );
});

// create a job
describe('POST/jobs', () => {
  test('succesfully post jobs', async () => {
    const response = await request(app)
      .post('/jobs')
      .send({
        title: 'Eng',
        salary: '300k',
        equity: 2.1
      })
      .set('authorization', auth.company_token);
    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Eng');
  });
});

// //jobs test

describe('GET /jobs', () => {
  test('gets a list of 1 jobs', async () => {
    const response = await request(app)
      .get('/jobs')
      .set('authorization', auth.token);
    expect(response.body).toHaveLength(1);
  });
});

afterEach(async () => {
  // delete the users and company users
  await db.query('DELETE FROM users');
  await db.query('DELETE FROM companies');
  await db.query('DELETE FROM jobs');
});

afterAll(async () => {
  await db.query('DROP TABLE IF EXISTS jobs_users');
  await db.query('DROP TABLE IF EXISTS jobs');
  await db.query('DROP TABLE IF EXISTS users');
  await db.query('DROP TABLE IF EXISTS companies');
  db.end();
});
