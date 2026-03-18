import { ISessionStore, TenantId, CommandHistoryEntry } from '../core/contracts';
import { IFileSystem } from '../core/file-system';
export declare class FileSessionStore implements ISessionStore {
    private readonly filePath;
    private readonly fs;
    private data;
    private initialized;
    constructor(fs?: IFileSystem);
    private ensureInitialized;
    private save;
    getLastTenantId(): Promise<TenantId | null>;
    setLastTenantId(tenantId: TenantId): Promise<void>;
    getCache<T>(key: string): Promise<T | null>;
    setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
    addToHistory(entry: CommandHistoryEntry): Promise<void>;
    getHistory(limit: number): Promise<ReadonlyArray<CommandHistoryEntry>>;
}
