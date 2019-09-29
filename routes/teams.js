const router = require('express').Router();
const Team = require('../model/Team');
const redis = require('redis');
const jwt = require('jsonwebtoken');
const { teamValidation } = require('../validation/validation');

//redis setup
const redisClient = redis.createClient(process.env.REDIS_PORT);
var redisKey = null;

//Add Teams
router.post('/teams/add', verifyToken, (req, res) => {
    //authenticate user
    jwt.verify(req.token, process.env.ADMIN_TOKEN_SECRET, async (err, data) => {
        if (err) {
            return res.status(403).json({ message: 'Unauthorized' })
        } else {
            //validate request
            const { error } = teamValidation(req.body);
            if (error) {
                return res.status(400).json({ message: error.details[0].message });
            }

            //check if team is in database
            const teamExist = await Team.findOne({ name: req.body.name });
            if (teamExist) {
                return res.status(400).json({ message: 'Team Already Exists' });
            }

            //check if position exists
            const positionExist = await Team.findOne({ position: req.body.position });
            if (positionExist) {
                return res.status(400).json({ message: 'A Team already Exists at that Position. Update the position and try again.' });
            }

            //add team to database if all checks fails
            const team = new Team({
                name: req.body.name,
                position: req.body.position
            });

            try {
                const savedTeam = await team.save();
                res.status(200).json({
                    team: savedTeam,
                    message: 'Created Successfully'
                });
            } catch (error) {
                res.status(500).json(error);
            }
        }
    })

});


//View teams with team name
router.get('/teams/view', cache, async (req, res) => {
    //return one team if a query item exists or error message
    if (req.query.name) {
        await Team.find({ name: { $regex: req.query.name } })
            .then(t => { 
                redisClient.SETEX(redisKey, 30, Buffer.from(JSON.stringify(t).toString('base64')));
                res.status(200).json(t) 
            })
            .catch(err => {
                res.status(500).json(err)
            })
    } else {
        return res.status(400).json({ message: 'Team does not exist' });
    }
});

//View all teams
router.get('/teams', verifyToken, cache, (req, res) => {
    //authenticate user
    jwt.verify(req.token, process.env.USER_TOKEN_SECRET, async(err,data) => {
        if (err) {
            return res.status(403).json({message: 'Unauthorised'})
        } else {
            //return one team if a query item exists or error message
            await Team.find({})
            .then(tAll => {
                redisClient.SETEX(redisKey, 30, Buffer.from(JSON.stringify(tAll).toString('base64')));
                res.status(200).json(tAll)
            })
            .catch(err => {
                res.status(500).json(err)
            });
        }
    })
});

//Edit Team
router.put('/teams/update', verifyToken, (req, res) => {
    jwt.verify(req.token, process.env.ADMIN_TOKEN_SECRET, async (err, data) => {
        if (err) {
            return res.status(403).json({ message: 'Unauthorized' })
        } else {
            if (!req.query.name) {
                return res.status(400).json({ message: 'Missing Name Parameter or Name not Found' })
            }

            await Team.findOneAndUpdate({ name: req.query.name }, req.body, { new: true })
                .then(t => {
                    res.status(201).json(t)
                })
                .catch(err => {
                    res.status(500).json(err)
                });
        }
    })

});

//delete Team
router.delete('/teams/delete', verifyToken, (req, res) => {
    //authenticate admin user
    jwt.verify(req.token, process.env.ADMIN_TOKEN_SECRET, async (err, data) => {
        if (err) {
            return res.status(403).json({ message: 'Unauthorized' })
        } else {
            if (!req.query.name) {
                return res.status(400).json({ message: 'Missing Name Parameter or Name not Found' })
            }

            await Team.findOneAndRemove({ name: req.query.name })
                .then(t => {
                    res.status(200).json({ t, message: 'Deleted Successfully' })
                })
                .catch(err => {
                    res.status(500).json(err)
                });
        }
    });

});

//verifyToken function middleware
function verifyToken(req, res, next) {
    //GET AUTH HEADER VALUE
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        const bearerToken = bearerHeader.split(' ');
        const bearer = bearerToken[1];
        req.token = bearer;
        next();
    } else {
        res.status(403).json({ message: 'Unauthorized' });
    }
}

function cache(req,res,next) {
    redisClient.get(redisKey, (err, data) => {
        if (err) {
            throw err
        }
        if (data !== null) {
            res.status(200).send(data);
        } else {
           next(); 
        }
    })
}

module.exports = router;
