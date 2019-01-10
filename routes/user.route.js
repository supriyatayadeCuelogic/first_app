const express = require('express');
const router = express.Router();

// Require the controllers WHICH WE DID NOT CREATE YET!!
const usrCntl = require('../controllers/user.controller');


// a simple test url to check that all of our files are communicating correctly.
router.get('/test', usrCntl.test);
router.post('/create', usrCntl.create);
router.get('/:id',usrCntl.getUser);
router.post('/login',usrCntl.login);

module.exports = router;