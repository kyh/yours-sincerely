require('dotenv').config();

jest.setTimeout(30000);

require('../server/api/users/user.model');

const mongoose = require('mongoose');
const keys = require('../server/config/keys');

mongoose.Promise = global.Promise;
mongoose.connect(keys.mongoURI);
