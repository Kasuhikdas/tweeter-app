import UserService from '../service/userServices';
import { userInfo } from 'os';
const routes = (context) => {

    const userService = new UserService(context);

    context.server.get('/', context.restify.plugins.serveStatic({
        directory: './public',
        default: 'index.html'
    }));

    context.server.get('/stat', context.restify.plugins.serveStatic({
        directory: './public',
        default: 'stat.html'
    }));

    context.server.get('/search', context.restify.plugins.serveStatic({
        directory: './public',
        default: 'search.html'
    }));

    context.server.get('/user/request-token', async (req, res, next) => {
        try {
            console.log(new Date()+"Inside Route Request Token");
            let response = await userService.login(res, next);
        } catch (error) {
            return next(error);
        }
    });
    context.server.get("/access-token", async (req, res, next) => {
        try {
            console.log(new Date()+"Inside Route twitter access-token");
            let requestToken = req.query.oauth_token,
                verifier = req.query.oauth_verifier;
            let response = await userService.callback(requestToken, verifier);
            res.redirect(response, next);
        } catch (error) {
            return next(error);
        }
    });

    context.server.get('/user/userstat', async (req, res, next) => {
        try {
            console.log(new Date()+"Inside Route User Statistic");
            var userId = req.query.userId
            let response = await userService.userStat(userId);
            res.send(response);
        } catch (error) {
            return next(error);
        }
    });

    context.server.get('/user/tweets', async (req, res, next) => {
        try {
            console.log(new Date()+"Inside Route Get Tweets ");
            var userId = req.query.userId
            let response = await userService.tweets(userId);
            res.send(response);
        } catch (error) {
            return next(error);
        }
    });

    context.server.get('/user/search', async (req, res, next) => {
        try {
            console.log(new Date()+"Inside Route Search Tweets");
            var hashTag = req.query.hashtag
            var location = req.query.location
            let response = await userService.searchBy(hashTag, location);
            res.send(response);
        } catch (error) {
            
            return next(error);
        }
    });
};

export default routes;
