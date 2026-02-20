import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
} from 'class-validator';

export function IsAfterOrEqual(
    property: string,
    validationOptions?: ValidationOptions,
): PropertyDecorator {
    return (target: object, propertyName: string | symbol) => {
        registerDecorator({
            name: 'isAfterOrEqual',
            target: target.constructor,
            propertyName: propertyName.toString(),
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: unknown, args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints as [string];
                    const relatedValue = (args.object as Record<string, unknown>)[relatedPropertyName];

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
