
import config from 'config';
import { MongoClient } from 'mongodb';
import restify from 'restify';
import User from './route/user'
/**
 * Initialize Server
 */
const server = restify.createServer({
  name: config.get('appName'),
});
server.use(restify.plugins.queryParser());
server.use(
    function crossOrigin(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        return next();
    }
);

const mongodbUrl = config.get('mongodb.url');
const mongodbDbName = config.get('mongodb.database');


/**
 * Start Server, Connect to DB & Require Routes
 */
server.listen(config.get('port'), async() => {

    try {

      const mongoConnection = await MongoClient.connect(mongodbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      const mongodb = await mongoConnection.db(mongodbDbName);
      const context = {
        mongodb,
        server,
        restify
      };
      User(context);
      console.log(`Server is listening on port ${config.port}`);
    } catch (error) {
     console.log("Error: ",error); 
    }
});
