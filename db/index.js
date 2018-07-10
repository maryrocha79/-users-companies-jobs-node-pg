const { Client } = require('pg');
const client = new Client({
  connectionString: 'prostgresql://localhost/users-companies-jobs-db'
});

client.connect();
module.exports = client;
