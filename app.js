const Promise = require('bluebird');
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redis = require('redis');
const morgan = require('morgan');
const authenticatedGuard = require('./middleware/authenticated-guard');
const passport = require('./oauth/passport');
const OauthClient = require('./oauth/client');
const CharacterService = require('./services/CharacterService');
const SignatureService = require('./services/SignatureService');

const redisSessionStore = new RedisStore({
    client: redis.createClient({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    })
});

const oauthClient = new OauthClient();
const characterService = new CharacterService(oauthClient);
const signatureService = new SignatureService();

const app = express();

app.set('view engine', 'pug');
app.set('views', path.resolve('./resources/templates'));
app.locals.basedir = app.get('views');

app.use((req, res, next) => {
    res.locals = {
        ...res.locals,
        projectName: process.env.PROJECT_NAME || 'Node WoW OAuth Example'
    };
    next();
});

app.use(cookieParser());

app.use(morgan('combined'));

app.use(session({
    name: 'node-wow-oauth-example-session',
    secret: 'node-wow-oauth-example-session-secret',
    saveUninitialized: true,
    resave: true,
    store: redisSessionStore,
}));

app.use(passport.initialize());

app.use(passport.session());

app.use((req, res, next) => {
    if (req.isAuthenticated()) {
        res.locals.currentUser = req.user;
    }
    next();
});

app.get('/',
    (req, res, next) => {
        if (req.isAuthenticated()) {
            return res.redirect('/authenticated');
        }
        next();
    },
    (req, res, next) => {
        res.render('pages/index');
    });

app.get('/about', (req, res, next) => {
    return res.redirect('https://github.com/viglucci/node-wow-oauth-example');
});

app.get('/login', (req, res) => {
    res.redirect('/login/oauth/battlenet');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/login/oauth/battlenet', passport.authenticate('bnet'));

app.get('/oauth/battlenet/callback',
    passport.authenticate('bnet', { failureRedirect: '/' }),
    function (req, res) {
        res.redirect('/authenticated');
    });

app.use('/authenticated', authenticatedGuard);

app.get('/authenticated', async (req, res, next) => {
    res.render('pages/authenticated/index');
});

app.get('/authenticated/characters', async (req, res, next) => {
    try {
        const characters = await characterService.getUsersCharactersList(req.user.token);
        res.render('pages/authenticated/characters', {
            characters
        });
    } catch (e) {
        next(e);
    }
}, (err, req, res, next) => {
    console.error(err);
    res.render("pages/error-characters");
});

app.get('/authenticated/characters/:realmSlug/:characterName/signature', async (req, res, next) => {
    try {
        const { characterName, realmSlug } = req.params;
        const character = await characterService.getCharacter(characterName, realmSlug);
        const characterMedia = await characterService.getCharacterMedia(character);
        const { filename, data } = await signatureService.generateImage(character, characterMedia);
        res.set('Content-Type', 'image/png');
        res.set('Content-Disposition', `inline; filename='${filename}'`);
        res.send(data);
    } catch (err) {
        next(err);
    }
}, (err, req, res, next) => {
    console.error(err);
    const { characterName, realmSlug } = req.params;
    res.render("pages/error-signature", {
        characterName,
        realmSlug
    });
});

// 404 not found error handler
app.use(function (req, res, next) {
    res.format({
        'text/html': function () {
            res
                .status(404)
                .render('pages/errors/404');
        },
        'application/json': function () {
            res.status(404).json({
                data: null,
                error: {
                    message: 'Resource not found'
                }
            });
        }
    });
});

// Server errors error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.format({
        'text/html': function () {
            res
                .status(500)
                .render('pages/errors/500', {
                    err
                });
        },
        'application/json': function () {
            if (process.env.NODE_ENV === 'development') {
                res.status(500).json({
                    data: null,
                    error: err
                });
            } else {
                res.status(500).json({
                    data: null
                });
            }
        }
    });
});

module.exports = async () => {
    await oauthClient.getToken();
    return Promise.resolve(app);
};
