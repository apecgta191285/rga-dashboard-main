"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceLocator = exports.TOKENS = void 0;
exports.initializeContainer = initializeContainer;
exports.disposeContainer = disposeContainer;
require("reflect-metadata");
const tsyringe_1 = require("tsyringe");
const client_1 = require("@prisma/client");
exports.TOKENS = {
    Logger: Symbol('Logger'),
    Config: Symbol('Config'),
    CommandRegistry: Symbol('CommandRegistry'),
    SessionStore: Symbol('SessionStore'),
    PrismaClient: Symbol('PrismaClient'),
    VerificationService: Symbol('VerificationService'),
    ReportWriter: Symbol('ReportWriter'),
};
class ServiceLocator {
    static resolve(token) {
        return tsyringe_1.container.resolve(token);
    }
    static register(token, implementation) {
        tsyringe_1.container.register(token, { useClass: implementation }, { lifecycle: tsyringe_1.Lifecycle.Singleton });
    }
    static registerInstance(token, instance) {
        tsyringe_1.container.registerInstance(token, instance);
    }
}
exports.ServiceLocator = ServiceLocator;
function initializeContainer(config) {
    tsyringe_1.container.registerInstance(exports.TOKENS.Config, config);
    const prisma = new client_1.PrismaClient({
        log: config.logging.level === 'debug' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
    });
    tsyringe_1.container.registerInstance(exports.TOKENS.PrismaClient, prisma);
}
async function disposeContainer() {
    const prisma = tsyringe_1.container.resolve(exports.TOKENS.PrismaClient);
    await prisma.$disconnect();
    tsyringe_1.container.clearInstances();
}
//# sourceMappingURL=container.js.map