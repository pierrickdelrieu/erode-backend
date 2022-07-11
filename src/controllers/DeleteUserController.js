const {User,Message,Government} = require('../models');

module.exports = {
    async delUser(req,res) {
        try{
            const user = await User.destroy({
                where: {
                    id_user: req.user.id_user
                }
            })
            if(!user) {
                res.status(401).send({
                    message: "Invalid information"
                })
            }
            else{
                const message = await Message.destroy({
                    where: {
                        fromUsername: req.user.username,
                        fromTagCode: req.user.tagcode
                    }
                })
                const government = await Government.destroy({
                    where: {
                        fromUsername: req.user.username,
                        fromTagCode: req.user.tagcode
                    }
                })
                res.status(200).send({
                    message: "User deleted"
                })
            }
        }catch(err){
            res.status(500).send({
                message: "Internal error"
            })
        }
    }
}