// exports
module.exports = app => {

  app.log('The Rusty Git loaded successfully!');

  app.on('pull_request', async context => {
    // Auto invite user
    sendInvite(context, app)
  });
}

// Send user an invite to the org
const sendInvite = (context, app) => {
  const details = { username: context.payload.pull_request.user.login, org: context.payload.organization.login };
  context.github.orgs.getMembership(details)
    .then(res => app.log.error(
      `${res.data.user.login}'s membership is: ${res.data.state}, holding the role: ${res.data.role}`))
    .catch((err) => {
      app.log.warn(`${res.data.user.login} is not a member, lets send them an invite!`)
      context.github.orgs.addOrUpdateMembership(details);
    });
}


// For more information on building apps:
// https://probot.github.io/docs/

// To get your app running against GitHub, see:
// https://probot.github.io/docs/development/