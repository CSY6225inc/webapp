const express = require('express')
const { initalizeDatabase, HealthCheck, sequelize } = require('./models');
const app = express();

require("dotenv").config();

const { healthRoute } = require("./routes/healthroutes")


app.use(express.urlencoded({ extended: true }));

initalizeDatabase();

app.use(healthRoute);

app.listen(process.env.PORT, () => {
    console.log(`Server runs on port ${process.env.PORT}`);
})

module.exports = app;