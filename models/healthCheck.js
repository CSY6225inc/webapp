const { DataTypes } = require('sequelize');
const sequelize = require("../config/db.config");

// const withDateNoTz = require('sequelize-date-no-tz-postgres');

// const DataTypesWithNoTz = withDateNoTz(DataTypes);
// sequelize.
// require('pg').types.setTypeParser(1114, stringValue => {
//     return new Date(stringValue + '+0000');
//     // e.g., UTC offset. Use any offset that you would like.
// });

const HealthCheck = sequelize.define('HealthCheck', {
    checkId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    datetime: {
        type: DataTypes.DATE,
        allowNull: false,
        // defaultValue: Sequelize.NOW mysql 
        defaultValue(){
            return new Date().toISOString().slice(0,19).replace('T',' ');
        },
        // get() {
        //     const value = this.getDataValue('datetime');
        //     // Convert to UTC if necessary (you can handle formatting here)
        //     return value ? value.toISOString() : null; // Returns ISO string in UTC
        // }
    },
 },
 {
    timestamps:false,
 }
);


module.exports = HealthCheck;