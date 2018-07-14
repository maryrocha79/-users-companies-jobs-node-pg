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
});

//GET get a list of companies
describe('GET /companies', () => {
  test('gets a list of companies when a user is loggedIn', async () => {
    const response = await request(app)
      .get('/companies')
      .set('authorization', auth.token);
    expect(response.body).toHaveLength(1);
  });
  test('shows an error if token is not authorized', async () => {
    const response = await request(app)
      .get('/companies')
      .set('authorization', '');
    expect(response.status).toBe(401);
  });
  test('gets a list of companies when a company is loggedIn', async () => {
    const response = await request(app)
      .get('/companies')
      .set('authorization', auth.company_token);
    expect(response.body).toHaveLength(1);
  });
});

// GET gets one company by handle
describe('GET /companies/:handle', () => {
  test('gets a company by handle', async () => {
    const response = await request(app)
      .get(`/companies/${auth.current_company_handle}`)
      .set('authorization', auth.token);
    expect(response.body.email).toBe('testcompanyemail');
  });
  test('gets a company by handle', async () => {
    const response = await request(app)
      .get(`/companies/${auth.current_company_handle}`)
      .set('authorization', auth.company_token);
    expect(response.body.employees).toHaveLength(0);
  });
});

//POST creates a company
describe('POST/companies', () => {
  test('succesfully create a company', async () => {
    const response = await request(app)
      .post('/companies')
      .send({
        handle: 'NewCompany1',
        password: 'NewSecret',
        name: 'NewHooli',
        email: 'NewCompany@yahoo.com',
        logo:
          'https://assets-cdn.github.com/images/modules/logos_page/GitHub-Mark.png'
      });
    // .set('authorization', auth.company_token);
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('NewHooli');
    expect(response.body.handle).toBe('NewCompany1');
  });
  test('can not create a handle that already exists', async () => {
    const response = await request(app)
      .post('/companies')
      .send({
        handle: 'testcompany',
        password: 'NewSecret',
        name: 'NewHooli',
        email: 'NewCompany@yahoo.com',
        logo:
          'https://assets-cdn.github.com/images/modules/logos_page/GitHub-Mark.png'
      });
    // .set('authorization', auth.company_token);
    expect(response.status).toBe(409);
  });
});

//PATCH updates a company
describe('PATCH/companies/:handle', () => {
  test('succesfully patch own company', async () => {
    const response = await request(app)
      .patch(`/companies/${auth.current_company_handle}`)
      .send({
        handle: 'testcompany1',
        password: 'secret',
        name: 'Hooli',
        email: 'newemail@yahoo.com',
        logo: 'testlogo'
      })
      .set('authorization', auth.company_token);
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Hooli');
  });
});

//DELETE deletes a company
describe('DELETE/companies/:handle', () => {
  test('succesfully deletes own company', async () => {
    const response = await request(app)
      .delete(`/companies/${auth.current_company_handle}`)
      .set('authorization', auth.company_token);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      name: 'testcompanyname',
      email: 'testcompanyemail',
      handle: 'testcompany'
    });
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
