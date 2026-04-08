import { spawn } from "node:child_process";

const [, , target, ...commandArgs] = process.argv;

if (!target || commandArgs.length === 0) {
  console.error("Usage: node scripts/run-with-build-target.mjs <target> <command...>");
  process.exit(1);
}

const env = {
  ...process.env,
  NANOPASTE_BUILD_TARGET: target,
};

const child = spawn(commandArgs[0], commandArgs.slice(1), {
  stdio: "inherit",
  shell: true,
  env,
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
