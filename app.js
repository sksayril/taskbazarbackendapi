require("dotenv").config()
require("./utilities/database")
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');

// Initialize Cron Jobs and Migration Utilities
const { startCronJobs } = require('./utilities/cronJobs');
const { fixAllUserReferCodes } = require('./utilities/fixReferCodes');

var app = express();

// Enable CORS for all routes
app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/admin', adminRouter);

// Start cron jobs and run migration when database is connected
const mongoose = require('mongoose');
mongoose.connection.once('open', async () => {
  console.log('Database connected. Checking user refer code lengths...');
  try {
    await fixAllUserReferCodes();
  } catch (err) {
    console.error('Error migrating user refer codes:', err);
  }
  console.log('Starting cron jobs...');
  startCronJobs();
});

module.exports = app;
