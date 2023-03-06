import process from "process"
import { spawn } from "child_process"

process.chdir("../")

const envKeys = [
  "DATABASE_URL",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
];

const buildArgs = envKeys.flatMap(e => ["--build-arg", `${e}=${process.env[e]}`])

console.log("Starting docker build")
const docker = spawn("docker", ["build", "-t", "mm-t3", ...buildArgs, "."], {
  stdio: "inherit"
})

docker.on('close', (code) => {
  if (code != 0)
    console.log(`child process exited with code ${code}`);
});
