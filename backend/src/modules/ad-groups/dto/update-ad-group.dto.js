"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAdGroupDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_ad_group_dto_1 = require("./create-ad-group.dto");
class UpdateAdGroupDto extends (0, swagger_1.PartialType)((0, swagger_1.OmitType)(create_ad_group_dto_1.CreateAdGroupDto, ['campaignId'])) {
}
exports.UpdateAdGroupDto = UpdateAdGroupDto;
//# sourceMappingURL=update-ad-group.dto.js.map