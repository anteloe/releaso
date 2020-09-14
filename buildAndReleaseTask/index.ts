import tl = require("azure-pipelines-task-lib/task");
import { readFileAsync } from "./helpers/asyncReadFile";
import { ToolRunner } from "azure-pipelines-task-lib/toolrunner";

async function run() {
  try {
    const { fileGlobs, endpoint } = getInputData();
    const curl = getCurlRunner();

    console.log("serviceEndpoint", endpoint.url);
    console.log("username", `username:${endpoint.username}`);
    console.log("username", `username:${endpoint.password}`);
    console.log("fileGlobs", fileGlobs.join(","));

    const filePaths = tl.findMatch(process.cwd(), fileGlobs);

    filePaths.forEach(uploadRuleset);

    // ["**/*.ruleset"].forEach((glob: string) => {
    //   // curl --location --request POST $search_api \
    //   // --header 'Content-Type: text/plain' \
    //   // --data-raw "$content"

    //   // prettier-ignore
    //   curl
    //   .arg("--location")
    //   .arg("--request").arg("PUT").arg('{url}')
    //   .arg("--header").arg('Content-Type: text/plain')
    //   .arg('--data-raw').arg('{data}')
    // });
  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

async function uploadRuleset(filePath: string) {
  const content = await readFileAsync(filePath)

  console.log('file-path', filePath)
  console.log('file-content', content)
}

/** just gather and parse input data for this task */
function getInputData() {
  const fileGlobs: string[] = tl.getDelimitedInput("fileGlob", ",", true);
  const serviceEndpointId: string = tl.getInput("serviceEndpoint", true)!;

  // get service endpoint information
  const endpointUrl = tl.getEndpointUrl(serviceEndpointId, false);
  const { username, password } = tl.getEndpointAuthorization(
    serviceEndpointId,
    false
  )!.parameters;

  return {
    fileGlobs,
    endpoint: {
      url: endpointUrl,
      username: username,
      password: password,
    },
  };
}

function getCurlRunner(): ToolRunner {
  const curlPath = tl.which("curl");
  return tl.tool(curlPath);
}

run();
