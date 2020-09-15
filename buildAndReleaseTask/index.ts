import tl = require("azure-pipelines-task-lib/task");
import path = require("path");
import { ToolRunner } from "azure-pipelines-task-lib/toolrunner";

const toolingProxyEndpoint = "/api/querqy";

async function run() {
  try {
    const { fileGlobs, endpoint: {url, username, password} } = getInputData();
    const endpointUrl = url + toolingProxyEndpoint

    const filePaths = tl.findMatch(process.cwd(), fileGlobs);
    console.log("uploading files:\n", filePaths.map(p => "- " + path.basename(p)).join("\n"));

    // base64(username:password)
    const usernamePassword = username + ":" + password
    const authBuffer = Buffer.alloc(usernamePassword.length, usernamePassword, 'utf-8')
    const auth = authBuffer.toString('base64')

    const uploads = filePaths.map(async (filePath) => {
      const fileName = path.basename(filePath);
      const curl = getCurlRunner();

      // prettier-ignore
      curl
        .arg("--location")      // handle redirects
        .arg("--silent")        // do not show progress
        .arg("--show-error")    // show errors
        .arg("--request").arg("PUT").arg(endpointUrl)
        .arg("--header").arg('Content-Type: text/plain')
        .arg('--header').arg(`Authorization: Basic ${auth}`)
        .arg("--header").arg(`X-Filename: ${fileName}`)
        .arg('--data').arg(`@${filePath}`);

      return await curl.exec();
    });

    // await all requests
    const codes = await Promise.all(uploads);

    // throw an error if a request went wrong.
    if(codes.find(code => code !== 0) !== null){
      throw new Error('error uploading ruleset(s)')
    }
  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
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
