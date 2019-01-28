module.exports = app => {

  app.log('The Rusty Git loaded successfully!');



  app.on('pull_request', async context => {

    // Auto invite user
    sendInvite(context, app)

    // Checks if auto merge should happen
    // If it should it will
    shouldMerge(context, app)

  });

  app.on('issues.opened', async context => {
    const issueComment = context.issue({ body: 'Thanks for opening this issue!' });
    return context.github.issues.createComment(issueComment);
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

// Checks if auto merge should take place
const shouldMerge = async (context, app) => {
  const files = await context.github.pullRequests.listFiles(context.issue())
  const data = files.data[0]
  console.log(data.filename, data.status, data.additions, data.deletions, data.changes)

  if(data.filename === "readme.md") mergePull(context, app)
}

// Merges PR if check is successfull
const mergePull = (context, app) => {
  app.log("Merging pull request!")
  context.github.pullRequests.merge(context.issue());
}







// For more information on building apps:
// https://probot.github.io/docs/

// To get your app running against GitHub, see:
// https://probot.github.io/docs/development/