"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ops_logger_1 = require("../core/observability/ops-logger");
const ui_printer_1 = require("../core/observability/ui-printer");
const run_logger_1 = require("../core/observability/run-logger");
process.env.TOOLKIT_ENV = 'CI';
const opsLogger = new ops_logger_1.PinoOpsLogger('CI', { runId: 't7-test', command: 't7-scan' });
const printer = new ui_printer_1.ConsoleUiPrinter('CI');
const logger = new run_logger_1.RunLogger(printer, opsLogger);
logger.ops.info('User logged in', { password: 'SUPER_SECRET_PASSWORD', email: 'test@example.com' });
const err = new Error('Connection failed to postgres://admin:SECRET_DB_PASS@localhost:5432/mydb');
logger.ops.error('Database error', err);
logger.printer.error('Fatal error: Connection failed to postgres://admin:SECRET_DB_PASS@localhost:5432/mydb');
//# sourceMappingURL=t7-runner.js.map