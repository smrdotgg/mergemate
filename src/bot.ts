import { Octokit } from "@octokit/rest";
import { context, getOctokit } from "@actions/github";
import * as core from "@actions/core";

async function run() {
  try {
    const githubToken = core.getInput("github-token", { required: true });
    console.log(`github token length = ${githubToken.length}`);
    const octokit = getOctokit(githubToken);

    const { repository, ref } = context.payload;

    if (!repository || !ref) {
      core.setFailed("Repository or ref not found in context.");
      return;
    }
    const branchName = ref.replace("refs/heads/", "");
    const owner = repository.owner.login;
    const repo = repository.name;

    const commit = await octokit.rest.repos.getCommit({
      owner,
      repo,
      ref,
    });
    const commitMessage = commit.data.commit.message;
    console.log(`Commit message = [${commitMessage}]`);

    // Check if the commit message contains #pr
    if (!commitMessage.toLowerCase().includes("#pr")) {
      core.info(
        "No #pr found in the latest commit message. Skipping PR creation.",
      );
      return;
    }

    // Create a pull request
    const pr = await octokit.rest.pulls.create({
      owner,

      repo,
      title: `Merge ${branchName} into main`,
      head: branchName,

      base: "main",
      body: "Automatically created PR by GitHub bot.",
    });

    core.info(`Created PR #${pr.data.number}: ${pr.data.html_url}`);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`Error: ${error.message}`);
    } else {
      core.setFailed("An unknown error occurred");
    }
  }
}

run();

//
// make it so this only creates the PR if #pr is present in the latest commit
// import { Octokit } from "@octokit/rest";
// import { context, getOctokit } from "@actions/github";
// import * as core from "@actions/core";
//
// async function run() {
//   try {
//     const githubToken = core.getInput("github-token", { required: true });
//     console.log(`github token length = ${githubToken.length}`);
//     const octokit = getOctokit(githubToken);
//
//     const { repository, ref, sha } = context.payload;
//
//     if (!repository || !ref || !sha) {
//       core.setFailed("Repository, ref, or sha not found in context.");
//       return;
//     }
//
//     const branchName = ref.replace("refs/heads/", "");
//     const owner = repository.owner.login;
//     const repo = repository.name;
//
//     // Get the latest commit message
//     const commit = await octokit.rest.repos.getCommit({
//       owner,
//       repo,
//       ref: sha,
//     });
//
//     const commitMessage = commit.data.commit.message;
//
//     // Check if the commit message contains #pr
//     if (!commitMessage.toLowerCase().includes("#pr")) {
//       core.info(
//         "No #pr found in the latest commit message. Skipping PR creation.",
//       );
//     }
//
//     // Create a pull request
//     const pr = await octokit.rest.pulls.create({
//       owner,
//       repo,
//       title: `Merge ${branchName} into main`,
//       head: branchName,
//       base: "main",
//       body: "Automatically created PR by GitHub bot.",
//     });
//
//     core.info(`Created PR #${pr.data.number}: ${pr.data.html_url}`);
//   } catch (error) {
//     if (error instanceof Error) {
//       core.setFailed(`Error: ${error.message}`);
//     } else {
//       core.setFailed("An unknown error occurred");
//     }
//   }
// }
//
// run();
