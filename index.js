const fs = require('fs')

// exports
module.exports = app => {

  app.on('pull_request', async context => {
    checkMembership(context, app)
  });

  // Create a log endpoint
  const router = app.route('/')
  router.use(require('express').static('public'))
  router.get('/logs', (req, res) => {
    res.sendFile('log.txt', { root: __dirname });
  })
}

checkMembership = (context, app) => {
  const details = { username: context.payload.pull_request.user.login, org: context.payload.organization.login};
  const time = context.payload.pull_request.created_at;
  context.github.orgs.getMembership(details)
    .then(res => createLog(time, `${res.data.user.login}'s membership is: ${res.data.state}, holding the role: ${res.data.role}`, app))
  
    .catch((err) => {
      createLog(time, `Sent an invitation to ${details.username}!`, app)
      context.github.orgs.addOrUpdateMembership(details);
      const issueComment = context.issue({ body: 'Congrats on making your first Pull Request in the Zero To Mastery Organization! You have been sent an invitation to join the organization, please check your emails' });
      return context.github.issues.createComment(issueComment);
    });
}

createLog = (time, message, app) => {
  // Log to heroku console
  app.log.error(message);

  // Log to text file
  const dateTime = `[${time.slice(0, time.indexOf("T"))}] [${time.slice((time.indexOf("T") + 1))}] - `;
  const text = dateTime + message + '\r\n';

  fs.appendFile('log.txt', text, function (err) {
    if (err) return console.log(err);
    console.log('successfully logged "' + text + '"');
  });
}


// For more information on building apps:
// https://probot.github.io/docs/

// To get your app running against GitHub, see:
// https://probot.github.io/docs/development/