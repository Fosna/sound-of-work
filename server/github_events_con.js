var request = require("request");
var logger = require("./logger.js");


function stripData(data) {
    var stripedData = [];
    var pushEventCounter = 0;
    var IssueCommentEventCounter = 0;
    var IssuesEventCounter = 0;
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
                    'url': data.repo.url
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
                'url': data.payload.pull_request.html_url
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
};

// https://api.github.com/repos/Healthcasts/healthcasts-docdx/events
// Healthcasts/healthcasts-docdx
// https://api.github.com/events


var options = {
    url: 'https://api.github.com/repos/Fosna/git-playground/events',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 5 Build/LMY48B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/43.0.2357.65 Mobile Safari/537.36',
        'Authorization': 'token ' + 'afb9b1d7e6740e8243a7a4dc5caf593400dde02a'
    }
};

console.log(options.url);
console.log(options.headers.Authorization);

request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        var data = JSON.parse(body);
        var stripedData = stripData(data);  // Keep only useful keys
        console.log(stripedData);

    } else {
        logger.error("GitHub status code: " + response.statusCode);
    }
});

console.log('ant');

