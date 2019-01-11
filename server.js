const express = require('express');
const bodyParser = require('body-parser');


require('dotenv').config();

const port = process.env.PORT || 3000;


const userRoutes = require('./routes/user.route');


// create express app
const app = express();


// Set up mongoose connection
const mongoose = require('mongoose');
let dev_db_url = 'mongodb://localhost:27017/first-app';
const mongoDB = process.env.MONGODB_URI || dev_db_url;
mongoose.connect(mongoDB, { useNewUrlParser: true });
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// parse requests of content-type - application/json
app.use(bodyParser.json())

// define a simple route
app.get('/', (req, res) => {
    res.json({"message": "First app"});
});

app.use('/users', userRoutes);

// listen for requests
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});