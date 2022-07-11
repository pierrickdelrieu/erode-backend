const {User} = require('../models');

module.exports = {
    async getInfo(req, res){
        
        try{
            const user = await User.findOne({
                where: {
                    id_user: req.user.id_user
                }
            })
            res.status(200).send({
                username: req.user.username,
                tagcode: req.user.tagcode,
                is2FAEnabled: user.isDoubleFactorAuthenticatorEnabled,
                message: "Successful"
            })
        }catch(err){
            res.status(500).send({
                message: "Internal error"
            })
        }
    }
}