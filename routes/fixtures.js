const router = require('express').Router();
const Fixtures = require('../model/Fixture');
const jwt = require('jsonwebtoken');
const { fixtureValidation } = require('../validation/validation');

//Add Fixtures
router.post('/fixtures/add', async (req,res) => {
    //validate request
    const {error} = fixtureValidation(req.body);
    if (error) {
        return res.status(400).json({message: error.details[0].message});
    }

    //check if Fixture is in database and status is completed
    const FixtureExist = await Fixtures.findOne({homeTeam: req.body.homeTeam, awayTeam: req.body.awayTeam, status: 'completed'});
    if (FixtureExist) {
        return res.status(400).json({message: 'Fixture Already Exists'});
    }

    //delete fixture in database if status is pending
    await Fixtures.findOneAndRemove({homeTeam: req.body.homeTeam, awayTeam: req.body.awayTeam, status: 'pending'});

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
});


//View Fixtures with matchday or name
router.get('/fixtures/view', async (req, res) => {
    //return Fixture using match day
    if (req.query.matchDay) {
        await Fixtures.find({matchDay: req.query.matchDay})
            .then(f => {res.status(200).json(f)})
            .catch(err => {
                res.status(500).json(err)
            })
    }
    else if (req.query.name) {
        await Fixtures.find({$or: [{homeTeam: {$regex: req.query.name}}, {awayTeam: {$regex: req.query.name}}]})
                    .then(f => {
                        res.status(200).json(f)
                    })
                    .catch(err => {
                        res.status(500).json(err)
                    })
    }
    else {
        return res.status(400).json({message: 'Fixture does not exist'});
    }
});

//View all Fixtures
router.get('/fixtures', async (req, res) => {
    //return one Fixture if a query item exists or error message
    await Fixtures.find({})
            .then(fAll => {
                res.status(200).json(fAll)
            })
            .catch(err => {
                res.status(500).json(err)
            });
});

//Edit Fixture using matchDay
router.put('/fixtures/update', async (req, res) => {
    if (!req.query.matchDay) {
        return res.status(400).json({message: 'Missing matchDay Parameter or matchDay not Found'})
    }

    await Fixtures.findOneAndUpdate({matchDay: req.query.matchDay, homeTeam: req.body.homeTeam, awayTeam: req.body.awayTeam}, req.body, {new: true})
            .then(f => {
                res.status(201).json(f)
            })
            .catch(err => {
                res.status(500).json(err)
            });
    
});

//delete Fixture using matchDay
router.delete('/fixtures/delete', async (req, res) => {
    if (!req.query.matchDay) {
        return res.status(400).json({message: 'Missing matchDay Parameter or matchDay not Found'})
    }

    await Fixtures.findOneAndRemove({matchDay: req.query.matchDay, homeTeam: req.body.homeTeam, awayTeam: req.body.awayTeam})
            .then(f => {
                res.status(200).json({f, message: 'Deleted Successfully'})
            })
            .catch(err => {
                res.status(500).json(err)
            });
    
});

module.exports = router;
