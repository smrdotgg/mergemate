import { Octokit } from "@octokit/rest";

export async function getPullRequestTemplate(
  octokit: Octokit,
  owner: string,
  repo: string,
  token: string,
  ref: string,
): Promise<string> {
  const pathsToCheck = [
    "/pull_request_template.md",
    "/.github/pull_request_template.md",
  ];
  let content: string | null = null;

  for (const path of pathsToCheck) {
    const fileContent = await checkFileContents(owner, repo, token, path, ref);
    if (fileContent){
      content = fileContent;
      break;
    }
  }
  if (content) return content;
  return "could not find the pull request template";
}

function checkFileContents(
  username: string,
  repo: string,
  token: string,
  path: string,
  ref: string,
) {
  console.log(`fetchgin :::  https://api.github.com/repos/${username}/${repo}/contents${path}?ref=${ref}`)
  return fetch(
    `https://api.github.com/repos/${username}/${repo}/contents${path}`,
    {
      headers: {
        Accept: "application/vnd.github.raw+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  )
    .then((response) => {
      if (!response.ok) {
        return null;
      }
      return response.text();
    })
    .catch((error) => {
      console.error("Error:", error);
      return null;
    });
}
