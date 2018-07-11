const { Client } = require('pg');

let dbName = 'users-companies-jobs-db';
if (process.env.NODE_ENV === 'test') {
  dbName = 'users-companies-jobs-db-test';
}

const client = new Client({
  connectionString: `postgresql://localhost/${dbName}`
});

client.connect();

module.exports = client;

// run this anywhere
// createdb users-companies-jobs-db-test
