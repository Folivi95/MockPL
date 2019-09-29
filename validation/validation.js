const Joi = require('@hapi/joi');

//Registration Validation
const registerValidation = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(6).required(),
        email: Joi.string().min(6).required().email(),
        password: Joi.string().min(6).required()
    });

    return schema.validate(data);
}

//Login Validation
const loginValidation = (data) => {
    const schema = Joi.object({
        email: Joi.string().min(6).required().email(),
        password: Joi.string().min(6).required()
    });

    return schema.validate(data);
}

//team validation
const teamValidation = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(3).required(),
        position: Joi.number().required()
    })

    return schema.validate(data);
}

//fixture validation
const fixtureValidation = (data) => {
    const schema = Joi.object({
        homeTeam: Joi.string().min(3).required(),
        awayTeam: Joi.string().min(3).required(),
        homeScore: Joi.string().allow(null),
        awayScore: Joi.string().allow(null),
        matchDay: Joi.number().required()
    })

    return schema.validate(data);
}


module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
module.exports.teamValidation = teamValidation;
module.exports.fixtureValidation = fixtureValidation;
