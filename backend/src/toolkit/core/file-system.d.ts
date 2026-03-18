export interface IFileSystem {
    exists(path: string): boolean;
    readFile(path: string): Promise<string>;
    writeFile(path: string, content: string): Promise<void>;
    mkdir(path: string): Promise<void>;
    rename(oldPath: string, newPath: string): Promise<void>;
    rm(path: string): Promise<void>;
}
export declare class NodeFileSystem implements IFileSystem {
    exists(path: string): boolean;
    readFile(path: string): Promise<string>;
    writeFile(path: string, content: string): Promise<void>;
    mkdir(path: string): Promise<void>;
    rename(oldPath: string, newPath: string): Promise<void>;
    rm(path: string): Promise<void>;
}
