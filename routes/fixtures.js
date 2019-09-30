const router = require('express').Router();
const Fixtures = require('../model/Fixture');
const Team = require('../model/Team');
const jwt = require('jsonwebtoken');
const redis = require('redis');
const { fixtureValidation } = require('../validation/validation');

//redis setup
const redisClient = redis.createClient(process.env.REDIS_PORT_HEROKU);
var redisFixtureKey = null;

//Add Fixtures
router.post('/fixtures/add', verifyToken, (req, res) => {
    //authenticate user
    jwt.verify(req.token, process.env.ADMIN_TOKEN_SECRET, async (err, data) => {
        if (err) {
            return res.status(403).json({ message: 'Unauthorized' })
        } else {
            //validate request
            const { error } = fixtureValidation(req.body);
            if (error) {
                return res.status(400).json({ message: error.details[0].message });
            }

            //check if home team is equal to away team
            if (req.body.homeTeam === req.body.awayTeam) {
                return res.status(400).json({ message: 'Oops!!! You cannnot have a team play themself' })
            }

            //check if home team exists
            const homeExists = await Team.findOne({ name: req.body.homeTeam });
            if (!homeExists) {
                return res.status(400).json({ message: 'Home Team Does not Exist' })
            }

            //check if away team exists
            const awayExists = await Team.findOne({ name: req.body.awayTeam });
            if (!awayExists) {
                return res.status(400).json({ message: 'Away Team Does not Exists' })
            }

            //check if Fixture is in database and status is completed
            const FixtureExist = await Fixtures.findOne({ homeTeam: req.body.homeTeam, awayTeam: req.body.awayTeam, status: 'completed' });
            if (FixtureExist) {
                return res.status(400).json({ message: 'Fixture Already Exists' });
            }

            //delete fixture in database if status is pending
            await Fixtures.findOneAndRemove({ homeTeam: req.body.homeTeam, awayTeam: req.body.awayTeam, status: 'pending' });

            //set status to completed or pending if scores are supplied
            if ((req.body.homeScore !== null) && (req.body.awayScore !== null)) {
                var status = 'completed';
            } else {
                status = 'pending';
            }

            //add Fixture to database if all checks fails
            const Fixture = new Fixtures({
                homeTeam: req.body.homeTeam,
                awayTeam: req.body.awayTeam,
                homeScore: req.body.homeScore,
                awayScore: req.body.awayScore,
                matchDay: req.body.matchDay,
                status: status
            });

            try {
                const savedFixture = await Fixture.save();
                res.status(200).json({
                    fixture: savedFixture,
                    message: 'Created Successfully'
                });
            } catch (error) {
                res.status(500).json(error);
            }
        }
    })

});


//Robust View Fixtures search with matchday or home team or away team
router.get('/fixtures/view', cache, async (req, res) => {
    //return Fixture using match day
    if (req.query.matchDay && req.query.homeTeam && req.query.awayTeam) {
        await Fixtures.find({ matchDay: req.query.matchDay, homeTeam: { $regex: req.query.homeTeam }, awayTeam: { $regex: req.query.awayTeam } })
            .then(f => { 
                redisClient.SETEX(redisFixtureKey, 30, Buffer.from(JSON.stringify(f).toString('base64')));
                return res.status(200).json(f) 
            })
            .catch(err => {
                return res.status(500).json(err)
            })
    }
    else if (req.query.homeTeam && req.query.matchDay) {
        await Fixtures.find({ matchDay: req.query.matchDay, homeTeam: { $regex: req.query.homeTeam } })
            .then(f => {
                redisClient.SETEX(redisFixtureKey, 30, Buffer.from(JSON.stringify(f).toString('base64')));
                return res.status(200).json(f)
            })
            .catch(err => {
                return res.status(500).json(err.errmsg)
            })
    }
    else if (req.query.awayTeam && req.query.matchDay) {
        await Fixtures.find({ matchDay: req.query.matchDay, awayTeam: { $regex: req.query.awayTeam } })
            .then(f => {
                redisClient.SETEX(redisFixtureKey, 30, Buffer.from(JSON.stringify(f).toString('base64')));
                return res.status(200).json(f)
            })
            .catch(err => {
                return res.status(500).json(err)
            })
    }
    else if (req.query.matchDay) {
        await Fixtures.find({ matchDay: req.query.matchDay })
            .then(f => { 
                redisClient.SETEX(redisFixtureKey, 30, Buffer.from(JSON.stringify(f).toString('base64')));
                return res.status(200).json(f) 
            })
            .catch(err => {
                return res.status(500).json(err)
            })
    }
    else if (req.query.homeTeam) {
        await Fixtures.find({ homeTeam: { $regex: req.query.homeTeam } })
            .then(f => {
                redisClient.SETEX(redisFixtureKey, 30, Buffer.from(JSON.stringify(f).toString('base64')));
                return res.status(200).json(f)
            })
            .catch(err => {
                res.status(500).json(err)
            })
    }
    else if (req.query.awayTeam) {
        await Fixtures.find({ awayTeam: { $regex: req.query.awayTeam } })
            .then(f => {
                redisClient.SETEX(redisFixtureKey, 30, Buffer.from(JSON.stringify(f).toString('base64')));
                return res.status(200).json(f)
            })
            .catch(err => {
                return res.status(500).json(err)
            })
    }
    else {
        return res.status(400).json({ message: 'Fixture does not exist' });
    }
});

//View all Fixtures
router.get('/fixtures', verifyToken, cache, (req, res) => {
    //authenticate normal user
    jwt.verify(req.token, process.env.USER_TOKEN_SECRET, async (err, data) => {
        if (err) {
            //authenticate admin user
            jwt.verify(req.token, process.env.ADMIN_TOKEN_SECRET, async (err, data) => {
                if (err) {
                    res.status(403).json({ message: 'Unauthorised' })
                } else {
                    //return one Fixture if a query item exists or error message
                    await Fixtures.find({})
                        .then(fAll => {
                            redisClient.SETEX(redisFixtureKey, 30, Buffer.from(JSON.stringify(fAll).toString('base64')));
                            res.status(200).json(fAll)
                        })
                        .catch(err => {
                            res.status(500).json(err)
                        });
                }
            });
            //res.status(403).json({ message: 'Unauthorised' })
        } else {
            //return one Fixture if a query item exists or error message
            await Fixtures.find({})
                .then(fAll => {
                    redisClient.SETEX(redisFixtureKey, 30, Buffer.from(JSON.stringify(fAll).toString('base64')));
                    res.status(200).json(fAll)
                })
                .catch(err => {
                    res.status(500).json(err)
                });
        }
    });
});

//Edit Fixture using matchDay
router.put('/fixtures/update', verifyToken, (req, res) => {
    //authenticate userr
    jwt.verify(req.token, process.env.ADMIN_TOKEN_SECRET, async (err, data) => {
        if (err) {
            return res.status(403).json({ message: 'Unauthorized' })
        } else {
            if (!(req.query.matchDay && req.query.homeTeam && req.query.awayTeam)) {
                return res.status(400).json({ message: 'Missing matchDay||homeTeam||awayTeam Parameter' })
            }

            await Fixtures.findOneAndUpdate({ matchDay: req.query.matchDay, homeTeam: req.query.homeTeam, awayTeam: req.query.awayTeam }, req.body, { new: true })
                .then(fixture => {
                    res.status(201).json({ fixture, message: 'Fixture Updated Successfully' })
                })
                .catch(err => {
                    res.status(500).json(err)
                });
        }
    })
});

//delete Fixture using matchDay
router.delete('/fixtures/delete', verifyToken, (req, res) => {
    //authenticate user
    jwt.verify(req.token, process.env.ADMIN_TOKEN_SECRET, async (err, data) => {
        if (err) {
            return res.status(403).json({ message: 'Unauthorized' })
        } else {
            if (!(req.query.matchDay && req.query.homeTeam && req.query.awayTeam)) {
                return res.status(400).json({ message: 'Missing matchDay||homeTeam||awayTeam Parameter' })
            }

            await Fixtures.findOneAndRemove({ matchDay: req.query.matchDay, homeTeam: req.query.homeTeam, awayTeam: req.query.awayTeam })
                .then(fixture => {
                    res.status(200).json({ fixture, message: 'Deleted Successfully' })
                })
                .catch(err => {
                    res.status(500).json(err)
                });

        }
    })
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
    redisClient.GET(redisFixtureKey, (err, data) => {
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
