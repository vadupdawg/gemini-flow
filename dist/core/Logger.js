"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const chalk_1 = __importDefault(require("chalk"));
class Logger {
    static log(prefix, message) {
        console.log(`${chalk_1.default.blue.bold(prefix)} ${message}`);
    }
    static success(prefix, message) {
        console.log(`${chalk_1.default.green.bold(prefix)} ${message}`);
    }
    static error(prefix, message) {
        console.error(`${chalk_1.default.red.bold(prefix)} ${message}`);
    }
    static warn(prefix, message) {
        console.warn(`${chalk_1.default.yellow.bold(prefix)} ${message}`);
    }
    static security(prefix, command, confirmationPrompt) {
        console.log(`\n${chalk_1.default.red.bold(prefix)} Agent wants to execute the following command:\n\n  ${chalk_1.default.cyan(command)}\n`);
        return `${chalk_1.default.red.bold(prefix)} ${confirmationPrompt}`;
    }
}
exports.Logger = Logger;
