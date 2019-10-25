import DbService from './dbSevice';
import config from 'config';
let Twitter = require("node-twitter-api");
var url = require('url');
let twitter = new Twitter({
    consumerKey: config.get('twitter.consumerKey'),
    consumerSecret: config.get('twitter.consumerSecret'),
    callback: config.get('twitter.callbackUrl')
});
let requestSecretKey;
let connection: any;
let response = {
    status: "",
    code: 0,
    payload: {}
}
class UserService {
    public context: any;
    private dbService: DbService;

    constructor(context) {
        this.context = context;
        this.dbService = new DbService(context);
    }

    public async login(res: any, next: any) {
        try {
            console.log(new Date()+"Inside Service Login");
            twitter.getRequestToken(function (err, requestToken, requestSecret) {
                if (err)
                    return err;
                else {
			console.log(requestToken);
                    requestSecretKey = requestSecret;
                    res.redirect(config.get('url.twitterAuth') + requestToken, next);
                }
            });
        } catch (error) {
            response.status = 'Internal Server Error';
            response.code = 500;
            response.payload = error;
            res.send(response)
        }
    }

    public async tweets(userId) {
        try {
            console.log(new Date()+"Inside Service Get Tweets");
            await this.databseConnection();
            let tweets: any = await connection.collection('tweets').findOne({ _id: parseInt(userId) })
            response.status = "ok";
            response.code = 200;
            response.payload = tweets
            return response;
        } catch (error) {
            response.status = "Internal Server Error";
            response.code = 500;
            response.payload = error
            return response;
        }
    }

    public async databseConnection() {
        try {
            if (!connection) {
                connection = await this.dbService.getDatabaseConnection("twitterDb");
                console.log(new Date()+"Connected to Database");
            }
        } catch (error) {
            throw error;
        }
    }

    public async searchBy(hashtag: string, location: string) {
        try {
            console.log(new Date()+"Inside Service Search Tweets");
            return new Promise(async (resolve, reject) => {
                let params;
                if (hashtag.length && location.length) {
                    params = { q: hashtag + ' ' + location }

                }
                else if (location.length) {
                    params = { q: location }
                }
                else if (hashtag.length) {
                    params = { q: hashtag }
                }
                return await twitter.search(params, twitter.accessToken, twitter.accessSecret, async (err, data) => {
                    if (err)
                        return err;
                    else {
                        response.status = "ok";
                        response.code = 200;
                        response.payload = {
                            tweets: data
                        };
                        resolve(response);

                    }
                });
            });
        }
        catch (error) {
            response.status = "Internal Server Error";
            response.code = 500;
            response.payload = error
        }

    }
    public async userStat(userId) {
        try {
            console.log(new Date()+"Inside Service User Tweets");
            await this.databseConnection();
            let summary: any = await connection.collection('summary').findOne({ _id: parseInt(userId) })
            let highestURL = {
                domain: '',
                count: 0
            };
            let highestUsr = {
                name: '',
                count: 0
            };
            let count;
            let keys = Object.keys(summary.tweets);
            await keys.forEach(element => {
                if (summary.tweets[element].count > highestURL.count) {
                    highestURL.domain = element;
                    highestURL.count = summary.tweets[element].count;
                }

            });
            keys = Object.keys(summary.user);
            await keys.forEach(element => {
                if (summary.user[element].count > highestUsr.count) {
                    highestUsr.name = summary.user[element].name;
                    highestUsr.count = summary.user[element].count;
                }
            });
            response.status = "ok";
            response.code = 200;
            response.payload = {
                userSummary: summary.user,
                tweetSummary: summary.tweets,
                maxUsedDomain: highestURL,
                maxSharedByUser: highestUsr
            };


            return response;
        } catch (error) {
            response.status = "Internal Server Error";
            response.code = 500;
            response.payload = error
        }


    }
    public async callback(requestToken: string, verifier: string) {
        try{
            console.log(new Date()+"Inside Service Twitter Callback");
            return new Promise(async (resolve, reject) => {
                twitter.getAccessToken(requestToken, requestSecretKey, verifier, async (err, accessToken, accessSecret) => {
                    if (err)
                        console.log(err);
                    else {
			console.log(new Date(),"access token recieved");
                        twitter.accessToken = accessToken;
                        twitter.accessSecret = accessSecret;
                        twitter.requestToken = requestToken;
                        twitter.verifier = verifier;
                    }
                    return await twitter.verifyCredentials(accessToken, accessSecret, async (err, user) => {
                        if (err)
                            console.log(err);
                        else {
				console.log(new Date(),"Credential Verified");
                            let date = new Date();
                            date.setDate(date.getDate() - 7);
                            let params = {
                                user_id: user.id,
                                count: 200
                            };
    
                            return await twitter.getTimeline("home_timeline", params, twitter.accessToken, twitter.accessSecret, async (err, data) => {
                                if (err)
                                    return err;
                                else {
                                    let tweets = [];
                                    let tweetData = {
                                        _id: user.id,
                                        tweets: {},
                                        user: {}
                                    };
					console.log(new Date(),"Got Timeline");
                                    await data.map((tweet) => {
                                        //console.log("Text:", tweet.text, "Count: ", tweet.entities.urls.length)
    
                                        if (tweet.entities.urls.length) {
                                            tweet.entities.urls.map((urlData) => {
    
    
                                                let hostname = url.parse(urlData.expanded_url).hostname;
                                                if (tweetData.tweets.hasOwnProperty(hostname)) {
                                                    tweetData.tweets[hostname].count++;
                                                }
                                                else {
                                                    tweetData.tweets[hostname] = {
                                                        count: 1,
                                                        url: urlData.url
                                                    }
                                                }
                                            });
                                            if (tweetData.user.hasOwnProperty(tweet.user.id)) {
                                                tweetData.user[tweet.user.id].count++;
                                            }
                                            else {
                                                tweetData.user[tweet.user.id] = {
                                                    count: 1,
                                                    name: tweet.user.name
                                                }
                                            }
                                            tweets.push(tweet);
                                        }
                                    })
                                    let userData = {
                                        _id: user.id,
                                        name: user.name,
                                        tweet: tweets
                                    }
					                await this.databseConnection();    
                                    await connection.collection("tweets").updateOne({ _id: user.id }, { $set: userData }, { upsert: true });
                                    await connection.collection("summary").updateOne({ _id: user.id }, { $set: tweetData }, { upsert: true });
                                    let redirect = config.get('url.baseUrl') + config.get('url.stat') + user.id;
                                    resolve(redirect);
                                }
                            });
                        }
    
                    });
                });
            });
        }
        catch(error){
            response.status = "Internal Server Error";
            response.code = 500;
            response.payload = error
            throw response;
        }
    }
}

export default UserService;
