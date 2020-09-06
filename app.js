const Promise = require('bluebird');
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
app.set('views', './resources/templates')

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

app.get('/', (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect('/authenticated');
  }
  res.render('index');
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

app.get('/authenticated', authenticatedGuard, async (req, res, next) => {
    res.render('authenticated/index', {
      user: req.user
    });
});

app.get('/authenticated/characters', authenticatedGuard, async (req, res, next) => {
  try {
    const characters = await characterService.getUsersCharacters(req.user.token);
    res.render('authenticated/characters', {
      user: req.user,
      characters
    });
  } catch (e) {
    next(e);
  }
});

app.get('/signature', async (req, res, next) => {
  try {
    const { characterName, realmName } = req.query;
    const character = await characterService.getCharacter(characterName, realmName);
    const characterMedia = await characterService.getCharacterMedia(character);
    const { filename, data } = await signatureService.generateImage(character, characterMedia);
    res.set('Content-Type', 'image/png');
    res.set('Content-Disposition', `inline; filename='${filename}'`);
    res.send(data);
  } catch (err) {
    next(err);
  }
});

app.use(function (req, res, next) {
  res.format({
    'text/plain': function () {
      res.status(404).send('Resource not found');
    },
    'application/json': function () {
      res.status(404).json({ message: 'Resource not found' });
    },
    'default': function () {
      res.status(404).send('Resource not found');
    }
  });
});

app.use((err, req, res, next) => {
  res.format({
    'text/plain': function () {
      res.status(500).send(err.toString());
    },
    'text/html': function () {
      res
        .status(500)
        .render('error', {
          err
        });
    },
    'application/json': function () {
      res.status(500).json({
        data: null,
        error: err
      });
    }
  });
});

module.exports = async () => {
  await oauthClient.getToken();
  return Promise.resolve(app);
};
