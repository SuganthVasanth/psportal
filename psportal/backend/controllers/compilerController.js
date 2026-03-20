const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");

const TEMP_PREFIX = "code-runner-";
const COMPILE_TIMEOUT_MS = 5000;
const RUN_TIMEOUT_MS = 3000;
const MAX_CODE_LENGTH = 50000;
const MAX_INPUT_LENGTH = 10000;

function runWithTimeout(child, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("Time Limit Exceeded"));
    }, timeoutMs);
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal });
    });
  });
}

function runCompile(dir) {
  return new Promise((resolve, reject) => {
    const isWin = process.platform === "win32";
    const gcc = spawn("gcc", ["code.c", "-o", isWin ? "code.exe" : "code.out"], {
      cwd: dir,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    gcc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    runWithTimeout(gcc, COMPILE_TIMEOUT_MS)
      .then(({ code }) => {
        if (code !== 0) {
          reject(new Error(stderr || "Compilation failed"));
        } else {
          resolve();
        }
      })
      .catch(reject);
  });
}

function runProgram(dir, inputStr) {
  return new Promise((resolve, reject) => {
    const isWin = process.platform === "win32";
    const exe = isWin ? "code.exe" : "./code.out";
    const child = spawn(exe, [], {
      cwd: dir,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    if (inputStr && inputStr.length > 0) {
      child.stdin.write(inputStr, (err) => {
        if (err) {
          child.kill("SIGKILL");
          reject(err);
          return;
        }
        child.stdin.end();
      });
    } else {
      child.stdin.end();
    }
    runWithTimeout(child, RUN_TIMEOUT_MS)
      .then(() => {
        const err = stderr.trim();
        if (err) {
          resolve({ output: stdout.trim(), runtimeError: err });
        } else {
          resolve({ output: stdout.trim() });
        }
      })
      .catch((err) => {
        if (err.message === "Time Limit Exceeded") reject(err);
        else reject(new Error(stderr || err.message || "Runtime Error"));
      });
  });
}

exports.run = async (req, res) => {
  let dir = null;
  try {
    const { code, input } = req.body || {};
    if (typeof code !== "string") {
      return res.status(400).json({ success: false, error: "Missing or invalid 'code' in request body." });
    }
    if (code.length > MAX_CODE_LENGTH) {
      return res.status(400).json({ success: false, error: `Code exceeds maximum length (${MAX_CODE_LENGTH} characters).` });
    }
    const inputStr = typeof input === "string" ? input : "";
    if (inputStr.length > MAX_INPUT_LENGTH) {
      return res.status(400).json({ success: false, error: `Input exceeds maximum length (${MAX_INPUT_LENGTH} characters).` });
    }

    dir = fs.mkdtempSync(path.join(os.tmpdir(), TEMP_PREFIX));
    const codePath = path.join(dir, "code.c");
    fs.writeFileSync(codePath, code, "utf8");

    await runCompile(dir);
    const result = await runProgram(dir, inputStr);

    if (result.runtimeError) {
      return res.json({
        success: false,
        error: result.runtimeError,
        output: result.output || undefined,
        errorType: "Runtime Error",
      });
    }
    res.json({
      success: true,
      output: result.output || "",
    });
  } catch (err) {
    const msg = err.message || "Execution failed";
    let errorType = "Runtime Error";
    if (msg.includes("Compilation") || msg.includes("error:") || msg.includes("undefined reference")) {
      errorType = "Compilation Error";
    } else if (msg === "Time Limit Exceeded") {
      errorType = "Time Limit Exceeded";
    }
    res.json({
      success: false,
      error: msg,
      errorType,
    });
  } finally {
    if (dir && fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch (_) {
        // ignore cleanup errors
      }
    }
  }
};
