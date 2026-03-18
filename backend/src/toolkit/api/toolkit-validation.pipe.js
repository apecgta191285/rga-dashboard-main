"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOOLKIT_VALIDATION_PIPE_OPTIONS = void 0;
exports.createToolkitValidationPipe = createToolkitValidationPipe;
const common_1 = require("@nestjs/common");
exports.TOOLKIT_VALIDATION_PIPE_OPTIONS = {
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
};
function createToolkitValidationPipe() {
    return new common_1.ValidationPipe(exports.TOOLKIT_VALIDATION_PIPE_OPTIONS);
}
//# sourceMappingURL=toolkit-validation.pipe.js.map