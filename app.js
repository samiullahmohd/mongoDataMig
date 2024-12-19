// const { spawn } = require("child_process");

// // Spawn a Python process to run the Python script
// const pythonProcess = spawn("python", ["test.py"]);

// // Capture the output of the Python script
// pythonProcess.stdout.on("data", (data) => {
//   console.log(`Output: ${data.toString()}`);
// });

// pythonProcess.stderr.on("data", (data) => {
//   console.error(`Error: ${data.toString()}`);
// });

// pythonProcess.on("close", (code) => {
//   console.log(`Python script finished with code ${code}`);
// });

const { PythonShell } = require("python-shell");

async function runPythonScript() {
  try {
    const results = await PythonShell.run("test.py", null);
    console.log("Python script output:", results.join("\n"));
  } catch (err) {
    console.error("Error running Python script:", err);
  }
}

runPythonScript();