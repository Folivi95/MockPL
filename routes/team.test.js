const request = require('supertest');
const teamRoute = require('../routes/teams');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

//connect to mongoDB



//Testing get teams
describe('Test the Get All Teams method', () => {
    beforeAll(() => {
        mongoose.set('useUnifiedTopology', true);
        mongoose.set('useFindAndModify', false);
        mongoose.connect(process.env.DB_CONNECT,
            { useNewUrlParser: true },
            () => console.log('Successfully Connected to DB'));
    });
    test('Status should be 200', async () => {
        const response = await request(teamRoute).get('/api/v1/teams');
        expect(response.statusCode).toBe(200);
    });
});
