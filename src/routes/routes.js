const AuthController = require('../controllers/AuthController.js');
const DeleteUserController = require('../controllers/DeleteUserController.js');
const MessagesController = require('../controllers/MessagesController.js');
const MessageController = require('../controllers/MessageController.js');
const InfoController = require('../controllers/InfoController.js');
const CheckTimeZone = require('../controllers/CheckTimeZone.js');
const Logout = require("../controllers/LogoutController.js");
const verifyToken = require("../middleware/auth.js");

module.exports = (app) => {
    // app.post('/register', AuthController.register);
    app.post('/login', AuthController.login);
    app.post('/deleteUser', verifyToken, DeleteUserController.delUser);
    app.post('/2fa/generate',verifyToken,AuthController.twoFAGenerate);
    app.post('/2fa/turn-on',verifyToken,AuthController.twoFAEnable);
    app.post('/2fa/auth',AuthController.twoFAAuthentification);
    app.post('/2fa/turn-off',verifyToken,AuthController.twoFADisable);
    app.post('/sendMessage',verifyToken,MessageController.sendMessage);
    app.post('/getInfo',verifyToken,InfoController.getInfo);
    app.post('/getMessages',verifyToken,MessagesController.getMessages);
    app.post('/getMessage',verifyToken,MessageController.getMessage);
    app.post('/checkTimeZone',verifyToken,CheckTimeZone.checkAndUpdateUtc);
    app.post('/logout',verifyToken,Logout.logout);
    //app.post("/deleteMessage",verifyToken,MessageController.deleteMessage);
}
