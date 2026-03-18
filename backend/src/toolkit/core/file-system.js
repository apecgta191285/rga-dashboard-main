"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeFileSystem = void 0;
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
class NodeFileSystem {
    exists(path) {
        return (0, fs_1.existsSync)(path);
    }
    async readFile(path) {
        return (0, promises_1.readFile)(path, 'utf-8');
    }
    async writeFile(path, content) {
        return (0, promises_1.writeFile)(path, content, 'utf-8');
    }
    async mkdir(path) {
        await (0, promises_1.mkdir)(path, { recursive: true });
    }
    async rename(oldPath, newPath) {
        await (0, promises_1.rename)(oldPath, newPath);
    }
    async rm(path) {
        await (0, promises_1.rm)(path, { force: true });
    }
}
exports.NodeFileSystem = NodeFileSystem;
//# sourceMappingURL=file-system.js.map