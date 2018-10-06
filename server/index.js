#!/usr/bin/env nodejs

var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var request = require("request");  // To make HTTP requests at the server side

var server = require('http').Server(app);

var helmet = require('helmet');  // To change response headers

var path = require('path');

const logger = require('./logger');
const argv = require('minimist')(process.argv.slice(2));
const isDev = process.env.NODE_ENV !== 'production';

// Get the intended port number, use port 8000 if not provided
const port = argv.port || process.env.PORT || 8000;
server.listen(port, (err) => {
  if (err) {
    return logger.error(err.message);
  }
});
if (isDev)
  logger.appStarted(port, 'http://localhost');
else
  logger.appStarted(port);

// Apply security middlewares
app.use(helmet());
app.use(bodyParser.json());

// Remove x-powered-by header
app.disable('x-powered-by');

// server static files
app.use('/static', express.static('app'));

// Load main web page
app.get('/', function (req, res) {
  res.sendFile(path.resolve('app/index.html'));
});

app.get('/monkey', function (req, res) {
  res.send('monkey' + Date.now());
});

app.post('/events', function (req, res) {
  var owner = 'Fosna';
  var repo = 'git-playground';

  const {
    oAuthKey
  } = req.body;

  fetchDataFromGithub(owner, repo, oAuthKey, function (data) {
    res.json(data);
  },
    function (e) {
      logger.error(e.toString());
      res.status(500).send(e.message);
    });
});

// Function to get events from GitHub API
function fetchDataFromGithub(owner, repo, oAuthKey, next, err) {
  var options = {
    url: 'https://api.github.com/repos/Fosna/git-playground/events',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 5 Build/LMY48B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/43.0.2357.65 Mobile Safari/537.36',
      'Authorization': `token ${oAuthKey}`
    }
  };

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var data = JSON.parse(body);

      var stripedData = stripData(data);  // Keep only useful keys
      next(stripedData);
    } else {
      logger.error("GitHub status code: " + response.statusCode);
      err("GitHub status code: " + response.statusCode);
    }
  });

}

function stripData(data) {
  var stripedData = [];
  var pushEventCounter = 0;

  data.forEach(function (data) {
    if (data.type == 'PushEvent') {
      if (pushEventCounter > 3) return;
      if (data.payload.size != 0) {
        stripedData.push({
          'id': data.id,
          'type': data.type,
          'user': data.actor.display_login,
          'user_avatar': data.actor.avatar_url + 'v=3&s=64',
          'repo_id': data.repo.id,
          'repo_name': data.repo.name,
          'payload_size': data.payload.size,
          'message': data.payload.commits[0].message,
          'created': data.created_at,
          'url': data.repo.url,
          'branch': data.payload.ref
        });
        pushEventCounter++;
      }
    } else if (data.type == 'IssueCommentEvent') {
      stripedData.push({
        'id': data.id,
        'type': data.type,
        'user': data.actor.display_login,
        'user_avatar': data.actor.avatar_url + 'v=3&s=64',
        'repo_id': data.repo.id,
        'repo_name': data.repo.name,
        'payload_size': 0,
        'message': data.body,
        'created': data.created_at,
        'url': data.payload.comment.html_url
      });
    } else if (data.type == 'PullRequestEvent') {
      if (data.payload.pull_request.merged) data.payload.action = 'merged';
      stripedData.push({
        'id': data.id,
        'type': data.type,
        'user': data.actor.display_login,
        'user_avatar': data.actor.avatar_url + 'v=3&s=64',
        'repo_id': data.repo.id,
        'repo_name': data.repo.name,
        'action': data.payload.action,  // opened, reopened, closed, merged
        'message': data.payload.pull_request.title,
        'created': data.created_at,
        'url': data.payload.pull_request.html_url,
        'base': data.payload.pull_request.base.ref,
        'head': data.payload.pull_request.head.ref,
      });
    } else if (data.type == 'IssuesEvent') {
      stripedData.push({
        'id': data.id,
        'type': data.type,
        'user': data.actor.display_login,
        'user_avatar': data.actor.avatar_url + 'v=3&s=64',
        'repo_id': data.repo.id,
        'repo_name': data.repo.name,
        'action': data.payload.action,  // opened, reopened, closed
        'message': data.payload.issue.title,
        'created': data.created_at,
        'url': data.payload.issue.html_url
      });
    }
  });
  return stripedData;
}
