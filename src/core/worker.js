const { parentPort, workerData } = require('worker_threads');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Worker ID from parent
const workerId = workerData.workerId;

// Send ready signal
parentPort.postMessage({ type: 'ready', workerId });

// Listen for tasks
parentPort.on('message', async (message) => {
  if (message.type === 'execute') {
    await executeTask(message.task);
  }
});

/**
 * Execute a task based on its type
 */
async function executeTask(task) {
  const { id, type, data } = task;
  
  try {
    let result;
    
    switch (type) {
      case 'gemini':
        result = await executeGeminiTask(data);
        break;
      
      case 'tool':
        result = await executeToolTask(data);
        break;
      
      case 'analysis':
        result = await executeAnalysisTask(data);
        break;
      
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
    
    // Send result back to parent
    parentPort.postMessage({
      type: 'result',
      taskId: id,
      result
    });
    
  } catch (error) {
    // Send error back to parent
    parentPort.postMessage({
      type: 'error',
      taskId: id,
      error: error.message
    });
  }
}

/**
 * Execute a Gemini AI task
 */
async function executeGeminiTask(data) {
  const { apiKey, prompt, systemPrompt, model = 'gemini-pro' } = data;
  
  if (!apiKey) {
    throw new Error('API key is required for Gemini tasks');
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({ model });
  
  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
  
  try {
    const result = await geminiModel.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    throw new Error(`Gemini API error: ${error.message}`);
  }
}

/**
 * Execute a tool task (file operations, shell commands, etc.)
 */
async function executeToolTask(data) {
  const { tool, args } = data;
  
  switch (tool) {
    case 'readFile':
      return readFileTask(args);
    
    case 'writeFile':
      return writeFileTask(args);
    
    case 'runCommand':
      return runCommandTask(args);
    
    case 'searchFiles':
      return searchFilesTask(args);
    
    default:
      throw new Error(`Unknown tool: ${tool}`);
  }
}

/**
 * Execute an analysis task
 */
async function executeAnalysisTask(data) {
  const { type, target, options } = data;
  
  switch (type) {
    case 'codeAnalysis':
      return analyzeCode(target, options);
    
    case 'dependencyAnalysis':
      return analyzeDependencies(target, options);
    
    case 'performanceAnalysis':
      return analyzePerformance(target, options);
    
    default:
      throw new Error(`Unknown analysis type: ${type}`);
  }
}

// Tool implementations

function readFileTask({ filePath }) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
}

function writeFileTask({ filePath, content }) {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true, path: filePath };
  } catch (error) {
    throw new Error(`Failed to write file: ${error.message}`);
  }
}

function runCommandTask({ command, cwd }) {
  try {
    const options = {};
    if (cwd) options.cwd = cwd;
    
    const output = execSync(command, options).toString();
    return { success: true, output };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      output: error.stdout ? error.stdout.toString() : ''
    };
  }
}

function searchFilesTask({ pattern, directory = '.', recursive = true }) {
  const results = [];
  
  function searchDir(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && recursive) {
        searchDir(fullPath);
      } else if (stat.isFile()) {
        if (pattern instanceof RegExp ? pattern.test(file) : file.includes(pattern)) {
          results.push(fullPath);
        }
      }
    }
  }
  
  try {
    searchDir(directory);
    return results;
  } catch (error) {
    throw new Error(`Search failed: ${error.message}`);
  }
}

// Analysis implementations

function analyzeCode(filePath, options = {}) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const analysis = {
      filePath,
      lineCount: lines.length,
      characterCount: content.length,
      functions: [],
      complexity: 0
    };
    
    // Basic function detection
    const functionPattern = /function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\(/g;
    let match;
    while ((match = functionPattern.exec(content)) !== null) {
      analysis.functions.push(match[1] || match[2]);
    }
    
    // Basic complexity estimation (cyclomatic complexity)
    const complexityPatterns = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /for\s*\(/g,
      /while\s*\(/g,
      /case\s+/g,
      /catch\s*\(/g
    ];
    
    for (const pattern of complexityPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        analysis.complexity += matches.length;
      }
    }
    
    return analysis;
  } catch (error) {
    throw new Error(`Code analysis failed: ${error.message}`);
  }
}

function analyzeDependencies(packageJsonPath, options = {}) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    return {
      name: packageJson.name,
      version: packageJson.version,
      dependencies: Object.keys(packageJson.dependencies || {}),
      devDependencies: Object.keys(packageJson.devDependencies || {}),
      totalDeps: Object.keys({
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      }).length
    };
  } catch (error) {
    throw new Error(`Dependency analysis failed: ${error.message}`);
  }
}

function analyzePerformance(scriptPath, options = {}) {
  try {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    // Run the script
    const result = execSync(`node ${scriptPath}`, { encoding: 'utf-8' });
    
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    
    return {
      executionTime: endTime - startTime,
      memoryUsed: endMemory.heapUsed - startMemory.heapUsed,
      output: result.substring(0, 1000) // First 1000 chars
    };
  } catch (error) {
    throw new Error(`Performance analysis failed: ${error.message}`);
  }
}

// Log function for debugging
function log(message) {
  parentPort.postMessage({
    type: 'log',
    data: message
  });
}