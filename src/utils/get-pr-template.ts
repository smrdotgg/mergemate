import { Octokit } from "@octokit/rest";

export async function getPullRequestTemplate(octokit: Octokit, owner: string, repo: string): Promise<string> {
  const pathsToCheck = [
    "pull_request_template.md",
    ".github/pull_request_template.md",
    ".github/pull_request_template/"
  ];

  for (const path of pathsToCheck) {
    try {

      if (path.endsWith("/")) {
        // Check for multiple templates in the directory
        const { data: templates } = await octokit.rest.repos.getContent({

          owner,
          repo,
          path,
        });

        if (Array.isArray(templates)) {
          let concatenatedBody = "";
          for (const template of templates) {

            if (template.type === "file" && template.name.toLowerCase().endsWith(".md")) {
              const { data: fileContent } = await octokit.rest.repos.getContent({

                owner,
                repo,
                path: template.path,
              });
              concatenatedBody += `[[[ ${template.name} ]]]\n\n${Buffer.from(fileContent.content, 'base64').toString('utf-8')}\n\n`;
            }
          }
          if (concatenatedBody) {
            return concatenatedBody;
          }
        }
      } else {
        // Check for a single template file
        const { data: directoryContent } = await octokit.rest.repos.getContent({
          owner,

          repo,
          path: path.split("/").slice(0, -1).join("/") || ".", // Get the directory path
        });


        if (Array.isArray(directoryContent)) {
          const templateFile = directoryContent.find(
            (file) => file.type === "file" && file.name.toLowerCase() === "pull_request_template.md"
          );

          if (templateFile) {
            const { data: fileContent } = await octokit.rest.repos.getContent({
              owner,
              repo,
              path: templateFile.path,
            });
            return Buffer.from(fileContent.content, 'base64').toString('utf-8');

          }
        }
      }
    } catch (error) {
      // Template not found in this path, continue to the next one
      continue;
    }
  }

  return "could not find the pull request template";
}
