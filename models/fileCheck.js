const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const FileCheck = sequelize.define('File', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    fileName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    uploadDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    contentType: DataTypes.STRING,
    contentLength: DataTypes.INTEGER,
    etag: DataTypes.STRING
});

module.exports = FileCheck;