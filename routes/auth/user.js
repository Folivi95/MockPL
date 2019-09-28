const router = require('express').Router();
const User = require('../../model/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { registerValidation, loginValidation} = require('../../validation/validation');

//Registration API
router.post('/user/register', async (req, res) => {
    //validate request before posting to database
    const {error} = registerValidation(req.body);
    if (error) {
        return res.status(400).json({message: error.details[0].message});
    }

    //check if user is in database to prevent registering a user twice
    const emailExist = await User.findOne({email: req.body.email});
    if (emailExist) {
        return res.status(400).json({message: 'Email Already Exists'});
    }

    //Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
        adminFlag: req.body.adminFlag
    });

    try {
        const savedUser = await user.save();
        res.status(200).json({
            user: user._id,
            message: 'Created Successfully'
        });
    } catch (error) {
        res.status(400).json({message: error});
    }
});


//Login API
router.post('/user/login', async (req,res) => {
    //validate data before posting request
    const {error} = loginValidation(req.body);
    if (error) {
        return res.status(400).json({message: error.details[0].message});
    }

    //check if user is in database
    const user = await User.findOne({email: req.body.email});
    //if user does not exist
    if (!user) {
        return res.status(400).send('Oops!!! Email is not registered');
    }
    
    //check if password is correct
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) {
        return res.status(400).json({message: 'Incorrect Password'});
    }

    //create and assign token
    const token = jwt.sign({_id: user._id}, process.env.USER_TOKEN_SECRET);
    res.header('bearer-token', token).json({bearerToken: token});
});

module.exports = router;