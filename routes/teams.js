const router = require('express').Router();
const Team = require('../model/Team');
const jwt = require('jsonwebtoken');
const { teamValidation } = require('../validation/validation');

//Add Teams
router.post('/teams/add', async (req,res) => {
    //validate request
    const {error} = teamValidation(req.body);
    if (error) {
        return res.status(400).json({message: error.details[0].message});
    }

    //check if team is in database
    const teamExist = await Team.findOne({name: req.body.name});
    if (teamExist) {
        return res.status(400).json({message: 'Team Already Exists'});
    }

    //check if position exists
    const positionExist = await Team.findOne({position: req.body.position});
    if (positionExist) {
        return res.status(400).json({message: 'A Team already Exists at that Position. Update the position and try again.'});
    }

    //add team to database if all checks fails
    const team = new Team({
        name: req.body.name,
        position: req.body.position
    });

    try {
        const savedTeam = await team.save();
        res.status(200).json({
            team: team.name,
            message: 'Created Successfully'
        });
    } catch (error) {
        res.status(500).json(error);
    }
});


//View teams with team name
router.get('/teams/view', async (req, res) => {
    //return one team if a query item exists or error message
    if (req.query.name) {
        await Team.find({name: {$regex: req.query.name}})
            .then(t => {res.status(200).json(t)})
            .catch(err => {
                res.status(500).json(err)
            })
        return res.status(200).json
    }else {
        return res.status(400).json({message: 'Team does not exist'});
    }
});

//View all teams
router.get('/teams', async (req, res) => {
    //return one team if a query item exists or error message
    await Team.find({})
            .then(tAll => {
                res.status(200).json(tAll)
            })
            .catch(err => {
                res.status(500).json(err)
            });
});

//Edit Team
router.put('/teams/update', async (req, res) => {
    if (!req.query.name) {
        return res.status(400).json({message: 'Missing Name Parameter or Name not Found'})
    }

    await Team.findOneAndUpdate({name: req.query.name}, req.body, {new: true})
            .then(t => {
                res.status(201).json(t)
            })
            .catch(err => {
                res.status(500).json(err)
            });
    
});

//delete Team
router.delete('/teams/delete', async (req, res) => {
    if (!req.query.name) {
        return res.status(400).json({message: 'Missing Name Parameter or Name not Found'})
    }

    await Team.findOneAndRemove({name: req.query.name})
            .then(t => {
                res.status(200).json({t, message: 'Deleted Successfully'})
            })
            .catch(err => {
                res.status(500).json(err)
            });
    
});

module.exports = router;
