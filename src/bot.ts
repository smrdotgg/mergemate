import { Octokit } from "@octokit/rest";
import { context, getOctokit } from "@actions/github";
import * as core from "@actions/core";
import {getPullRequestTemplate} from "./utils/get-pr-template"


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
    console.log(`owner = ${owner}`)
    console.log(`repo = ${repo}`)
    console.log(`ref = ${ref}`)

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

    // Get the pull request template
    const prBody = await getPullRequestTemplate(octokit as any, owner, repo, githubToken, ref);

    // Create a pull request
    const pr = await octokit.rest.pulls.create({
      owner,

      repo,
      title: `Merge ${branchName} into main`,
      head: branchName,

      base: "main",
      body: prBody,
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
