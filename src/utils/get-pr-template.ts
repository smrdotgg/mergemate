import { Octokit } from "@octokit/rest";

export async function getPullRequestTemplate(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<string> {
  const pathsToCheck = [
    "pull_request_template.md",
    ".github/pull_request_template.md",
    ".github/pull_request_template/",
  ];

  console.log(
    `Starting to search for pull request template in repository: ${owner}/${repo}`,
  );

  for (const path of pathsToCheck) {
    console.log(`Checking path: ${path}`);

    try {
      if (path.endsWith("/")) {
        // Check for multiple templates in the directory
        console.log(`Checking directory for multiple templates: ${path}`);
        const { data: templates } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path,
        });

        if (Array.isArray(templates)) {
          console.log(`Found ${templates.length} items in directory: ${path}`);
          let concatenatedBody = "";
          for (const template of templates) {
            if (
              template.type === "file" &&
              template.name.toLowerCase().endsWith(".md")
            ) {
              console.log(`Found markdown file: ${template.name}`);
              const { data: fileContent } = await octokit.rest.repos.getContent(
                {
                  owner,
                  repo,
                  path: template.path,
                },
              );
              concatenatedBody += `[[[ ${template.name} ]]]\n\n${Buffer.from((fileContent as any).content, "base64").toString("utf-8")}\n\n`;
            }
          }
          if (concatenatedBody) {
            console.log(
              `Returning concatenated template from directory: ${path}`,
            );
            return concatenatedBody;
          }
        }
      } else {
        // Check for a single template file

        console.log(`Checking for single template file: ${path}`);
        const { data: directoryContent } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: path.split("/").slice(0, -1).join("/") || ".", // Get the directory path
        });

        if (Array.isArray(directoryContent)) {
          console.log(
            `Found ${directoryContent.length} items in directory: ${path}`,
          );
          const templateFile = directoryContent.find(
            (file) =>
              file.type === "file" &&
              file.name.toLowerCase() === "pull_request_template.md",
          );

          if (templateFile) {
            console.log(
              `Found pull request template file: ${templateFile.name}`,
            );
            const { data: fileContent } = await octokit.rest.repos.getContent({
              owner,
              repo,
              path: templateFile.path,
            });

            return Buffer.from((fileContent as any).content, "base64").toString(
              "utf-8",
            );
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          `Template not found in path: ${path}. Error: ${error.message}`,
        );
      } else {
        console.error(`Template not found in path: ${path}. Uknown Error`);
      }
      // Template not found in this path, continue to the next one
      continue;
    }
  }

  console.log(
    "Could not find the pull request template in any of the specified paths.",
  );
  return "could not find the pull request template";
}
