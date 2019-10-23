import config from 'config';
import { MongoClient } from 'mongodb';

const connections = {};

class DbService {
  public context: any;

  constructor(context) {
    this.context = context;
  }

  public async getDatabaseConnection(dbName) {
    return new Promise(async (resolve, reject) => {
      if (connections[dbName]) {
        resolve(connections[dbName]);
      } else {
        try {
          const mongoConnection = await MongoClient.connect(config.get('mongodb.url'), {
            useNewUrlParser: true,
            useUnifiedTopology: true
          });
          const mongodb = await mongoConnection.db(dbName);
          console.log(`Connected successfully  to  ${dbName}`);
          connections[dbName] = mongodb;
          // console.log(connections);
          resolve(connections[dbName]);
        } catch (error) {
          console.error('error in db connection');
        }
      }
    });
  }
}

export default DbService;
