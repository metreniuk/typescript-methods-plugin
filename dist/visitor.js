"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MethodsVisitor = void 0;
var change_case_all_1 = require("change-case-all");
var MethodsVisitor = /** @class */ (function () {
    function MethodsVisitor() {
        var _this = this;
        this.typeImportsPath = "./types";
        this.mutations = new Set();
        this.subscriptions = new Set();
        this.queries = new Set();
        this.getImports = function () {
            var queriesImports = Array.from(_this.queries).map(function (_a) {
                var name = _a.name;
                return [
                    name + "Query",
                    name + "QueryVariables",
                    name + "Document",
                ];
            });
            var mutationsImports = Array.from(_this.mutations).map(function (_a) {
                var name = _a.name;
                return [
                    name + "Mutation",
                    name + "MutationVariables",
                    name + "Document",
                ];
            });
            var subscriptionsImports = Array.from(_this.subscriptions).map(function (_a) {
                var name = _a.name;
                return [
                    name + "Subscription",
                    name + "SubscriptionVariables",
                    name + "Document",
                ];
            });
            var imports = queriesImports
                .concat(mutationsImports)
                .concat(subscriptionsImports)
                .reduce(function (acc, x) { return __spreadArray(__spreadArray([], acc), x); }, []);
            return "\n      import { ApolloClient, NormalizedCacheObject } from '@apollo/client';\n      import {\n        " + imports.join(",\n") + "\n      } from '" + _this.typeImportsPath + "';\n\n      ";
        };
        this.getBaseClass = function () {
            var queries = Array.from(_this.queries);
            var mutations = Array.from(_this.mutations);
            var subscriptions = Array.from(_this.subscriptions);
            var base = "\n  export class GQLClient extends ApolloClient<NormalizedCacheObject>{\n    " + queries.map(_this.toQuery).join("\n") + "\n    " + mutations.map(_this.toMutation).join("\n") + "\n    " + subscriptions.map(_this.toSubscription).join("\n") + "\n  }      \n      ";
            return base;
        };
        this.toMutation = function (_a) {
            var name = _a.name, hasVariables = _a.hasVariables;
            name = change_case_all_1.pascalCase(name);
            var paramsDeclaration = _this.getParamsDeclaration({
                name: name,
                hasVariables: hasVariables,
                type: "mutation",
            });
            return "\n  mutate" + name + " = " + paramsDeclaration + " => {\n    return this.mutate<\n      " + name + "Mutation,\n      " + name + "MutationVariables\n      >({\n        mutation: " + name + "Document,\n        " + _this.getVarsAndOptions(hasVariables) + "\n    });\n  }";
        };
        this.toQuery = function (_a) {
            var name = _a.name, hasVariables = _a.hasVariables;
            name = change_case_all_1.pascalCase(name);
            var paramsDeclaration = _this.getParamsDeclaration({
                name: name,
                hasVariables: hasVariables,
                type: "query",
            });
            return "\n  query" + name + " = " + paramsDeclaration + " => {\n    return this.query<\n      " + name + "Query,\n      " + name + "QueryVariables\n      >({\n        query: " + name + "Document,\n        " + _this.getVarsAndOptions(hasVariables) + "\n    });\n  }";
        };
        this.toSubscription = function (_a) {
            var name = _a.name, hasVariables = _a.hasVariables;
            name = change_case_all_1.pascalCase(name);
            var paramsDeclaration = _this.getParamsDeclaration({
                name: name,
                hasVariables: hasVariables,
                type: "subscription",
            });
            return "\n  subscribe" + name + " = " + paramsDeclaration + " => {\n    return this.subscribe<\n      " + name + "Subscription,\n      " + name + "SubscriptionVariables\n      >({\n        query: " + name + "Document,\n        " + _this.getVarsAndOptions(hasVariables) + "\n    });\n  }";
        };
        this.getVarsAndOptions = function (hasVariables) {
            return hasVariables
                ? "variables,\n      ...options"
                : "...options";
        };
        this.getParamsDeclaration = function (ops) {
            var opName = _this.getOperationName(ops.type);
            return ops.hasVariables
                ? "(variables: " + ops.name + opName + "Variables, " + _this.getRequestOptions(ops.type) + ")"
                : "(" + _this.getRequestOptions(ops.type) + ")";
        };
        this.getRequestOptions = function (type) {
            var isMutation = type && type === "mutation";
            return isMutation
                ? "options?: { fetchPolicy: 'network-only' | 'no-cache' }"
                : "options?: { fetchPolicy: 'network-only' | 'cache-first' | 'no-cache' | 'cache-only' }";
        };
        this.getOperationName = function (type) {
            if (type === "query") {
                return "Query";
            }
            else if (type === "mutation") {
                return "Mutation";
            }
            else {
                return "Subscription";
            }
        };
        this.OperationDefinition = function (node) {
            var _a, _b;
            var name = (_a = node.name) === null || _a === void 0 ? void 0 : _a.value;
            var hasVariables = Boolean((_b = node.variableDefinitions) === null || _b === void 0 ? void 0 : _b.length);
            if (!name) {
                return "";
            }
            if (node.operation === "query") {
                _this.queries.add({ name: name, hasVariables: hasVariables });
            }
            else if (node.operation === "mutation") {
                _this.mutations.add({ name: name, hasVariables: hasVariables });
            }
            if (node.operation === "subscription") {
                _this.subscriptions.add({ name: name, hasVariables: hasVariables });
            }
            return "";
        };
    }
    return MethodsVisitor;
}());
exports.MethodsVisitor = MethodsVisitor;
//# sourceMappingURL=visitor.js.map