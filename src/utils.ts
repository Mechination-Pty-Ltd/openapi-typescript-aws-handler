import { OpenAPIV3_1 } from "openapi-types";

export function deref<X extends {}>(x: X|OpenAPIV3_1.ReferenceObject|undefined, spec: OpenAPIV3_1.Document): X|undefined {
    if (!x) {
        return undefined;
    }
    if ('$ref' in x) {
        console.log("Dereferencing ", x.$ref);
        // We only support internal component references.
        if (!x.$ref.startsWith('#/components/')) {
            return undefined;
        }
        const sv = x.$ref.split('/');
        if (!spec.components) {
            throw new Error("Specification has no components");
        }
        if (sv.length != 4) {
            throw new Error("Reference must have exactly 4 items")
        }
        if (sv[0] != '#') {
            throw new Error("We only support local refs right now");
        }
        if (sv[1] != 'components') {
            throw new Error("We only support component refs right now.");
        }
        const type = sv[2];
        const ref = sv[3];
        switch (type) {
            case 'callbacks':
                return deref((spec.components.callbacks ?? {})[ref] as X|OpenAPIV3_1.ReferenceObject, spec);
            case 'examples':
                return deref((spec.components.examples ?? {})[ref] as X|OpenAPIV3_1.ReferenceObject, spec);
            case 'headers':
                return deref((spec.components.headers ?? {})[ref] as X|OpenAPIV3_1.ReferenceObject, spec);
            case 'links':
                return deref((spec.components.links ?? {})[ref] as X|OpenAPIV3_1.ReferenceObject, spec);
            case 'parameters':
                return deref((spec.components.parameters ?? {})[ref] as X|OpenAPIV3_1.ReferenceObject, spec);
            case 'pathItems':
                return deref((spec.components.pathItems ?? {})[ref] as X|OpenAPIV3_1.ReferenceObject, spec);
            case 'requestBodies':
                return deref((spec.components.requestBodies ?? {})[ref] as X|OpenAPIV3_1.ReferenceObject, spec);
            case 'responses':
                return deref((spec.components.responses ?? {})[ref] as X|OpenAPIV3_1.ReferenceObject, spec);
            case 'schemas':
                return deref((spec.components.schemas ?? {})[ref] as X|OpenAPIV3_1.ReferenceObject, spec);
            case 'securitySchemas':
                return deref((spec.components.securitySchemes ?? {})[ref] as X|OpenAPIV3_1.ReferenceObject, spec);
            default:
                throw new Error("Invalid reference type " + type);
        }
    }

    
    return x;
}
