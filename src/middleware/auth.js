require("dotenv").config()
const jwt = require("jsonwebtoken");
const {User} = require("../models");
const crypto = require("crypto")
function decypherMessage(contentEnciphered,tagcode){
    const childPython = spawn('python', ['..\\..\\CipherAlgo\\decipher-obf.py', contentEnciphered.toString(), tagcode]);   
    return new Promise((resolve) => {
        childPython.stdout.on('data', (data) => {
            return resolve(data.toString());
        });
    })
}

async function verifyToken(req,res,next){
    const token = req.body.token || req.query.token || req.headers["x-access-token"];
    if(!token){
        return res.status(403).send({
            message: "A token is required"
        });
    } 
    try{
        //We create the hash for our token
        const sha256Hasher = crypto.createHmac("sha256",process.env.TOKEN_KEY);
        //We hash our token in order to retrieve its hash in the database
        const tokenHashed = sha256Hasher.update(token).digest("hex");
        const user = await User.findOne({
            where: {
                token: tokenHashed
            }
        }).then((user) => {
            if(user){
                const userJson = user.toJSON()
                req.user = userJson
                return next();
            }
            else{
                return res.status(401).send({
                    message: "Invalid token"
                })
            }
        })
        
        // const decoded = jwt.verify(token,process.env.TOKEN_KEY);
        // req.user = decoded;
        
    }
    catch(err){
        return res.status(401).send({
            message: "Invalid token"
        })
    }
    
}

module.exports = verifyToken;