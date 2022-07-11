/**
 * We've created a file called config.js, which contains all the config variables
 * such as the database crendentials and the database which we're using in this project
 */


/**
 * This file contains a module which we export, so we can manipulate it easily, as we do for other modules.
 * port : Our API is listening on port 8000, or in the environment variable port (for instance, the Heroku port as we host our project)
 * database : which database we use (for instance, ours is called todolistdb, we can see it in mysql workbench)
 * user and password : your credentials to log yourself in the database
 * options : we inform which type of database we use (mysql), which host do we use, and where is stored our database
 */
 module.exports = {

    port: process.env.PORT || 1000,
    db: {
        database: process.env.DB_NAME || 'erode',
        user: process.env.DB_USER || 'erode_admin', /* You have to enter your database username*/
        password: process.env.PASS_DB ||'3e92CPa*aKko', /* You have to enter your database password */
        options: {
            dialect: process.env.DIALECT || 'mysql',
            host: process.env.HOST || 'delrieu.synology.me',
            port: 3307
        }
    },
    authentication: {
        jwtSecret: process.env.JWT_SECRET || 'secret'
    }
}