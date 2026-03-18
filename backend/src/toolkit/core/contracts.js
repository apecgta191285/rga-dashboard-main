"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiConnectionError = exports.DatabaseConnectionError = exports.ValidationError = exports.CommandNotFoundError = exports.InvalidCommandNameError = exports.InvalidTenantIdError = exports.ToolkitError = exports.Result = void 0;
exports.createTenantId = createTenantId;
exports.createCommandName = createCommandName;
function createTenantId(id) {
    if (typeof id !== 'string') {
        throw new InvalidTenantIdError(`Invalid tenant ID: ${id}`);
    }
    const normalized = id.trim();
    if (!normalized || normalized.length > 128 || /\s/.test(normalized)) {
        throw new InvalidTenantIdError(`Invalid tenant ID: ${id}`);
    }
    return normalized;
}
function createCommandName(name) {
    if (!name || !/^[a-z0-9-]+$/.test(name)) {
        throw new InvalidCommandNameError(`Command name must be lowercase alphanumeric with hyphens: ${name}`);
    }
    return name;
}
exports.Result = {
    success(value) {
        return { kind: 'success', value };
    },
    failure(error) {
        return { kind: 'failure', error };
    },
    match(result, handlers) {
        if (result.kind === 'success') {
            return handlers.success(result.value);
        }
        return handlers.failure(result.error);
    }
};
class ToolkitError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.ToolkitError = ToolkitError;
class InvalidTenantIdError extends ToolkitError {
    constructor() {
        super(...arguments);
        this.code = 'INVALID_TENANT_ID';
        this.isRecoverable = false;
    }
}
exports.InvalidTenantIdError = InvalidTenantIdError;
class InvalidCommandNameError extends ToolkitError {
    constructor() {
        super(...arguments);
        this.code = 'INVALID_COMMAND_NAME';
        this.isRecoverable = false;
    }
}
exports.InvalidCommandNameError = InvalidCommandNameError;
class CommandNotFoundError extends ToolkitError {
    constructor() {
        super(...arguments);
        this.code = 'COMMAND_NOT_FOUND';
        this.isRecoverable = true;
    }
}
exports.CommandNotFoundError = CommandNotFoundError;
class ValidationError extends ToolkitError {
    constructor(message, fieldErrors) {
        super(message);
        this.fieldErrors = fieldErrors;
        this.code = 'VALIDATION_ERROR';
        this.isRecoverable = true;
    }
}
exports.ValidationError = ValidationError;
class DatabaseConnectionError extends ToolkitError {
    constructor() {
        super(...arguments);
        this.code = 'DB_CONNECTION_FAILED';
        this.isRecoverable = true;
    }
}
exports.DatabaseConnectionError = DatabaseConnectionError;
class ApiConnectionError extends ToolkitError {
    constructor() {
        super(...arguments);
        this.code = 'API_CONNECTION_FAILED';
        this.isRecoverable = true;
    }
}
exports.ApiConnectionError = ApiConnectionError;
//# sourceMappingURL=contracts.js.map