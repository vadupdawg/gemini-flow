"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTools = exports.UpdateTaskStatusTool = exports.GetAllTasksTool = exports.AddToDoTool = exports.RunShellCommandTool = exports.WriteFileTool = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
class WriteFileTool {
    constructor() {
        this.name = 'writeFile';
        this.description = 'Writes content to a file.';
    }
    execute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fullPath = path.resolve(process.cwd(), args.path);
                const dir = path.dirname(fullPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                fs.writeFileSync(fullPath, args.content);
                return { success: true, path: fullPath };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
    }
}
exports.WriteFileTool = WriteFileTool;
class RunShellCommandTool {
    constructor() {
        this.name = 'runShellCommand';
        this.description = 'Executes a shell command.';
    }
    execute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                (0, child_process_1.exec)(args.command, (error, stdout, stderr) => {
                    if (error) {
                        resolve({ success: false, error: error.message, stdout, stderr });
                        return;
                    }
                    resolve({ success: true, stdout, stderr });
                });
            });
        });
    }
}
exports.RunShellCommandTool = RunShellCommandTool;
class AddToDoTool {
    constructor(toDoManager) {
        this.toDoManager = toDoManager;
        this.name = 'addToDo';
        this.description = 'Adds a new task to the to-do list.';
    }
    execute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const newToDo = this.toDoManager.addTask(args.task, args.agent, args.dependencies);
            return { success: true, todo: newToDo };
        });
    }
}
exports.AddToDoTool = AddToDoTool;
class GetAllTasksTool {
    constructor(toDoManager) {
        this.toDoManager = toDoManager;
        this.name = 'getAllTasks';
        this.description = 'Gets the current to-do list.';
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            const todos = this.toDoManager.getAllTasks();
            return { success: true, todos };
        });
    }
}
exports.GetAllTasksTool = GetAllTasksTool;
class UpdateTaskStatusTool {
    constructor(toDoManager) {
        this.toDoManager = toDoManager;
        this.name = 'updateTaskStatus';
        this.description = 'Updates the status of a task.';
    }
    execute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.toDoManager.updateTaskStatus(args.taskId, args.status, args.result);
            return { success: true };
        });
    }
}
exports.UpdateTaskStatusTool = UpdateTaskStatusTool;
const getTools = (toDoManager) => ({
    writeFile: new WriteFileTool(),
    runShellCommand: new RunShellCommandTool(),
    addToDo: new AddToDoTool(toDoManager),
    getAllTasks: new GetAllTasksTool(toDoManager),
    updateTaskStatus: new UpdateTaskStatusTool(toDoManager),
});
exports.getTools = getTools;
