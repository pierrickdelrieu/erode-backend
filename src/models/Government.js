// Model
module.exports = (sequelize, DataTypes) => {
    const Government = sequelize.define('Government', {
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

        //At which hour the message has to be deleted
        timeDelete: {
            type: DataTypes.DATE,
            unique: false
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            get(){
                return moment(this.getDataValue('created_at'))
                .utcOffset(this.getDataValue('offset'))
            }
        }
    }, {
        //don't add the attribute updatedAt
        updatedAt: false,
    });
    return Government;
}