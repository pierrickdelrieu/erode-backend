const crypto = require("crypto")
const moment = require("moment");
const { Sequelize } = require(".");
// Model
module.exports = (sequelize, DataTypes) => {
    const Message = sequelize.define('Message', {
        id_message: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        usernameTarget: {
            type: DataTypes.STRING(20),
            unique: false
        },
        tagCodeTarget: {
            type: DataTypes.STRING(4),
            unique: false
        },
        content: {
            type: DataTypes.TEXT('long')
            
        },
        fromUsername: {
            type: DataTypes.STRING(20),
            unique: false
        },
        fromTagCode: {
            type: DataTypes.STRING(4),
            unique: false
        },
        publicKey: {
            type: DataTypes.TEXT('long'),
            unique: false
        },
        privateKey: {
            type: DataTypes.TEXT('long'),
            unique: false
        },
        createdAt: false,
        // createdAt: {
        //     type: 'timestamp with time zone',
        //     defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        //     allowNull: false,
        //     get(){
        //         return moment(this.getDataValue('created_at'))
        //         .utcOffset(this.getDataValue('offset'))
        //     }
        // },
        // //At which hour the message has to be deleted
        // timeDelete: {
        //     type: 'timestamp with time zone',
        //     defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        //     unique: false,
        //     allowNull: false,
        //     get(){
        //         return moment(this.getDataValue('created_at'))
        //         .utcOffset(this.getDataValue('offset'))
        //     }
        // }
        createdAt: {
            type: DataTypes.DATE,
            
            allowNull: false
        },
        timeDelete: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
        //don't add the attribute updatedAt
        updatedAt: false,
    });
    return Message;
}