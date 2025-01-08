import { Octokit } from "@octokit/rest";
import { context, getOctokit } from "@actions/github";
import * as core from "@actions/core";

async function run() {
  try {
    const githubToken = core.getInput("github-token", { required: true });
    const octokit = getOctokit(githubToken);

    const { repository, ref } = context.payload;

    if (!repository || !ref) {
      core.setFailed("Repository or ref not found in context.");
      return;
    }

    const branchName = ref.replace("refs/heads/", "");
    const owner = repository.owner.login;
    const repo = repository.name;

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
