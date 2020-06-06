const fs = require("fs");

// exports
module.exports = (app) => {
    app.on("pull_request", async (context) => {
        console.log(context.payload.action);
        if (context.payload.action === "opened") checkMembership(context, app);
        if (context.payload.pull_request.mergeable_state !== "clean") {
            announceMergeConflict(context, app);
            addLabel(context, "Conflict");
        }
    });

    // Create a log endpoint
    const router = app.route("/");
    router.use(require("express").static("public"));
    router.get("/logs", (req, res) => {
        res.sendFile("log.txt", { root: __dirname });
    });
};

addLabel = (context, labelName) => {
    const owner = context.pull_request.head.repo.owner;
    const repo = context.pull_request.head.repo;
    const issue_number = context.number;

    return context.github.issues.addLabels({
        owner,
        repo,
        issue_number,
        labels: [labelName],
    });
};

announceMergeConflict = (context, app) => {
    const issueComment = context.issue({
        body:
            "# ⚠️ **MERGE CONFLICT DETECTED!** \nA possible conflict has been detected, you will need to resolve this before your pull request can be merged. The most common reason conflicts occur, is when the contributor does not run `git pull origin master` before pushing their new changes. \n\nBefore we can merge the code, you will need to resolve the conflict, there are tons of guides on Google and Youtube to help you out. If you get stuck ask over on Discord.",
    });
    return context.github.issues.createComment(issueComment);
};

checkMembership = (context, app) => {
    const details = {
        username: context.payload.pull_request.user.login,
        org: context.payload.organization.login,
    };
    const time = context.payload.pull_request.created_at;
    context.github.orgs
        .getMembership(details)
        .then((res) =>
            createLog(
                time,
                `${res.data.user.login}'s membership is: ${res.data.state}, holding the role: ${res.data.role}`,
                app
            )
        )

        .catch((err) => {
            createLog(time, `Sent an invitation to ${details.username}!`, app);
            context.github.orgs.addOrUpdateMembership(details);
            const issueComment = context.issue({
                body:
                    "Congrats on making your first Pull Request in the Zero To Mastery Organization! You have been sent an invitation to join the organization, please check your emails. \n\n **ZTM Profile Badge** \nIf you'd like the ZTM Badge to show up on your profile, you will need to [follow this guide](https://help.github.com/en/github/setting-up-and-managing-your-github-user-account/publicizing-or-hiding-organization-membership)!",
            });
            return context.github.issues.createComment(issueComment);
        });
};

createLog = (time, message, app) => {
    // Log to heroku console
    app.log.error(message);

    // Log to text file
    const dateTime = `[${time.slice(0, time.indexOf("T"))}] [${time.slice(
        time.indexOf("T") + 1
    )}] - `;
    const text = dateTime + message + "\r\n";

    fs.appendFile("log.txt", text, function (err) {
        if (err) return console.log(err);
        console.log('successfully logged "' + text + '"');
    });
};

// For more information on building apps:
// https://probot.github.io/docs/

// To get your app running against GitHub, see:
// https://probot.github.io/docs/development/
