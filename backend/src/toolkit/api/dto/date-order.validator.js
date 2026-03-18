"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsAfterOrEqual = IsAfterOrEqual;
const class_validator_1 = require("class-validator");
function IsAfterOrEqual(property, validationOptions) {
    return (target, propertyName) => {
        (0, class_validator_1.registerDecorator)({
            name: 'isAfterOrEqual',
            target: target.constructor,
            propertyName: propertyName.toString(),
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value, args) {
                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = args.object[relatedPropertyName];
                    if (!value || !relatedValue) {
                        return true;
                    }
                    const currentDate = new Date(String(value));
                    const relatedDate = new Date(String(relatedValue));
                    if (Number.isNaN(currentDate.getTime()) || Number.isNaN(relatedDate.getTime())) {
                        return true;
                    }
                    return currentDate.getTime() >= relatedDate.getTime();
                },
            },
        });
    };
}
//# sourceMappingURL=date-order.validator.js.map