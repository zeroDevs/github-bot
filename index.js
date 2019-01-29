const fs = require('fs');


// base64 encode CODE_OF_CONDUCT and CONTRIBUTING 
const code_of_conduct = Buffer.from(fs.readFileSync('CODE_OF_CONDUCT.md', 'utf-8')).toString('base64');
const contributing = Buffer.from(fs.readFileSync('CONTRIBUTING.md', 'utf-8')).toString('base64');
const pr_template = Buffer.from(fs.readFileSync('PULL_REQUEST_TEMPLATE.md', 'utf-8')).toString('base64');
const issue_template = Buffer.from(fs.readFileSync('ISSUE_TEMPLATE.md', 'utf-8')).toString('base64');



// exports
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

  // repository.created event
  app.on('repository.created', async context => {

    // add contributing guidelines
    context.github.repos.createFile({
      owner: context.payload.repository.owner.login, 
      repo: context.payload.repository.name, 
      path: 'CONTRIBUTING.md', 
      message: 'Added contributing Guidelines', 
      content: contributing
    })

    // add code of conduct
    context.github.repos.createFile({
      owner: context.payload.repository.owner.login, 
      repo: context.payload.repository.name, 
      path: 'CODE_OF_CONDUCT.md', 
      message: 'Added code of conduct', 
      content: code_of_conduct
    })

    // add ISSUE_TEMPLATE
    context.github.repos.createFile({
      owner: context.payload.repository.owner.login, 
      repo: context.payload.repository.name, 
      path: 'ISSUE_TEMPLATE.md', 
      message: 'Added issue template', 
      content: issue_template
    })

    // add code of conduct
    context.github.repos.createFile({
      owner: context.payload.repository.owner.login, 
      repo: context.payload.repository.name, 
      path: 'PULL_REQUEST_TEMPLATE.md', 
      message: 'Added PR template', 
      content: pr_template
    })
  })


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
  if(data.filename === "contributors.md" && data.additions < 5 && data.deletions < 3) mergePull(context, app)

  const issueComment = context.issue({ body: 'Thanks for opening this pull request!' });
  return context.github.issues.createComment(issueComment);
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