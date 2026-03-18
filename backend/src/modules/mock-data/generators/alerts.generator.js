"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOCK_ALERT_TEMPLATES = void 0;
exports.generateMockAlerts = generateMockAlerts;
exports.generateAlertForDB = generateAlertForDB;
const client_1 = require("@prisma/client");
exports.MOCK_ALERT_TEMPLATES = [
    {
        alertType: 'CRITICAL_ROAS',
        severity: client_1.AlertSeverity.CRITICAL,
        message: 'แคมเปญ {campaignName} มี ROAS วิกฤต ({value}) ต่ำกว่าเกณฑ์ ({threshold})',
        campaignName: 'Google Search - Brand Keywords',
        platform: client_1.AdPlatform.GOOGLE_ADS,
        value: 0.3,
        threshold: 1.0,
        isRead: false,
    },
    {
        alertType: 'LOW_ROAS',
        severity: client_1.AlertSeverity.WARNING,
        message: 'แคมเปญ {campaignName} มี ROAS ต่ำ ({value}) ต่ำกว่าเกณฑ์ ({threshold})',
        campaignName: 'Facebook Lead Gen',
        platform: client_1.AdPlatform.FACEBOOK,
        value: 0.8,
        threshold: 1.5,
        isRead: false,
    },
    {
        alertType: 'OVERSPEND',
        severity: client_1.AlertSeverity.WARNING,
        message: 'แคมเปญ {campaignName} ใช้งบเกิน {value}% ของงบที่ตั้งไว้',
        campaignName: 'TikTok Awareness',
        platform: client_1.AdPlatform.TIKTOK,
        value: 125,
        threshold: 100,
        isRead: false,
    },
    {
        alertType: 'NO_CONVERSIONS',
        severity: client_1.AlertSeverity.INFO,
        message: 'แคมเปญ {campaignName} ไม่มี conversion มา {value} วันแล้ว',
        campaignName: 'LINE Shopping Promo',
        platform: client_1.AdPlatform.LINE_ADS,
        value: 7,
        threshold: 3,
        isRead: true,
    },
    {
        alertType: 'CTR_DROP',
        severity: client_1.AlertSeverity.WARNING,
        message: 'CTR ของ {campaignName} ลดลง {value}% จากสัปดาห์ก่อน',
        campaignName: 'Display Remarketing',
        platform: client_1.AdPlatform.GOOGLE_ADS,
        value: 45,
        threshold: 20,
        isRead: false,
    },
    {
        alertType: 'INACTIVE_CAMPAIGN',
        severity: client_1.AlertSeverity.INFO,
        message: 'แคมเปญ {campaignName} ไม่มี activity มา {value} วัน',
        campaignName: 'FB Video Views',
        platform: client_1.AdPlatform.FACEBOOK,
        value: 14,
        threshold: 7,
        isRead: true,
    },
    {
        alertType: 'LOW_ROAS',
        severity: client_1.AlertSeverity.WARNING,
        message: 'แคมเปญ {campaignName} มี ROAS ต่ำ ({value})',
        campaignName: 'Google Shopping',
        platform: client_1.AdPlatform.GOOGLE_ADS,
        value: 0.9,
        threshold: 1.5,
        isRead: false,
    },
    {
        alertType: 'OVERSPEND',
        severity: client_1.AlertSeverity.CRITICAL,
        message: 'แคมเปญ {campaignName} ใช้งบเกิน {value}% - หยุดอัตโนมัติแล้ว',
        campaignName: 'Brand Awareness Campaign',
        platform: client_1.AdPlatform.FACEBOOK,
        value: 150,
        threshold: 100,
        isRead: false,
    },
];
function generateMockAlerts(count = 8) {
    const alerts = [...exports.MOCK_ALERT_TEMPLATES];
    return alerts
        .sort(() => Math.random() - 0.5)
        .slice(0, count)
        .map(alert => ({
        ...alert,
        message: alert.message
            .replace('{campaignName}', alert.campaignName)
            .replace('{value}', alert.value.toString())
            .replace('{threshold}', alert.threshold.toString()),
    }));
}
function generateAlertForDB(tenantId, ruleId, template) {
    const message = template.message
        .replace('{campaignName}', template.campaignName)
        .replace('{value}', template.value.toString())
        .replace('{threshold}', template.threshold.toString());
    return {
        tenantId,
        ruleId,
        alertType: template.alertType,
        severity: template.severity,
        title: `Mock Alert - ${template.alertType}`,
        message,
        metadata: {
            campaignName: template.campaignName,
            platform: template.platform,
            value: template.value,
            threshold: template.threshold,
        },
        status: template.isRead ? client_1.AlertStatus.ACKNOWLEDGED : client_1.AlertStatus.OPEN,
    };
}
//# sourceMappingURL=alerts.generator.js.map