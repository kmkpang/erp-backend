const { User } = require('./model/userModel');
const sequelize = require('./database');

async function checkData() {
    try {
        await sequelize.authenticate();
        const count = await User.count();
        console.log(`Total Users in Neon DB: ${count}`);
        const users = await User.findAll({ attributes: ['userEmail', 'accessToken'] });
        console.log('User emails:', users.map(u => u.userEmail));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sequelize.close();
    }
}

checkData();
