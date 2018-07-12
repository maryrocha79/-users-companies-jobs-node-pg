const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const userRoutes = require('./routes/users');
const companyRoutes = require('./routes/companies');
const jobRoutes = require('./routes/jobs');

app.use(bodyParser.json());
app.use(morgan('dev'));

app.use('/users', userRoutes);
app.use('/companies', companyRoutes);
app.use('/jobs', jobRoutes);

/* 
  error handler - for a handler with four parameters, 
  the first is assumed to be an error passed by another
  handler's "next"
 */
app.use((err, req, res, next) => {
  return res
    .status(err.status || 500)
    .json({ error: { message: err.message, status: err.status } });
});

module.exports = app;
