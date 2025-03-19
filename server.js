const express = require('express')
const { initalizeDatabase, HealthCheck, sequelize } = require('./models');
const app = express();

require("dotenv").config();

const { healthRoute } = require("./routes/healthroutes")
const { fileRoutes } = require("./routes/fileroutes")

app.use(express.urlencoded({ extended: true }));

initalizeDatabase();
app.use("/v1/file",fileRoutes);
app.use(healthRoute);

const server = app.listen(process.env.PORT, () => {
    console.log(`Server runs on port ${process.env.PORT}`);
})

module.exports = server;