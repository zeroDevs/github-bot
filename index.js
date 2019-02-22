// exports
module.exports = app => {

  app.log('The Rusty Git loaded successfully!');

  app.on('pull_request', async context => {
    // Auto invite user
    sendInvite(context, app)
  });

  // Get an express router to expose new HTTP endpoints
  const router = app.route('/')

  // Use any middleware
  router.use(require('express').static('public'))

  // Add a new route
  router.get('/logs', (req, res) => {
    // res.sendFile('./log.txt');
    res.sendFile('log.txt', { root: __dirname });
  })
}

// Send user an invite to the org
const sendInvite = (context, app) => {
  const details = { username: context.payload.pull_request.user.login, org: context.payload.organization.login };
  context.github.orgs.getMembership(details)
    .then(res => {
      app.log.error(`${res.data.user.login}'s membership is: ${res.data.state}, holding the role: ${res.data.role}`)
      saveLog(`${res.data.user.login}'s membership is: ${res.data.state}, holding the role: ${res.data.role}`)
    })
    .catch((err) => {
      app.log.warn(`${details.username} is not a member, lets send them an invite!`)
      saveLog(`${details.username} is not a member, lets send them an invite!`)
      context.github.orgs.addOrUpdateMembership(details);
      const issueComment = context.issue({ body: 'Congrats on making your first Pull Request in the Zero To Mastery Organization! You have been sent an invitation to join the organization, please check your emails' });
      return context.github.issues.createComment(issueComment);
    });
};

saveLog = (message) => {
  const dateTime = '[' + getDateTime() + '] ';
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