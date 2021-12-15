import { OperationDefinitionNode } from "graphql"
import { pascalCase } from "change-case-all"

type OperationType = "query" | "mutation" | "subscription"
export class MethodsVisitor {
  private typeImportsPath = "./types"
  private mutations = new Set<{ name: string; hasVariables: boolean }>()
  private subscriptions = new Set<{ name: string; hasVariables: boolean }>()
  private queries = new Set<{ name: string; hasVariables: boolean }>()

  getImports = () => {
    let queriesImports = Array.from(this.queries).map(({ name }) => [
      `${name}Query`,
      `${name}QueryVariables`,
      `${name}Document`,
    ])
    let mutationsImports = Array.from(this.mutations).map(({ name }) => [
      `${name}Mutation`,
      `${name}MutationVariables`,
      `${name}Document`,
    ])
    let subscriptionsImports = Array.from(this.subscriptions).map(
      ({ name }) => [
        `${name}Subscription`,
        `${name}SubscriptionVariables`,
        `${name}Document`,
      ]
    )

    let imports = queriesImports
      .concat(mutationsImports)
      .concat(subscriptionsImports)
      .reduce((acc, x) => [...acc, ...x], [])

    return `
      import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
      import {
        ${imports.join(",\n")}
      } from '${this.typeImportsPath}';\n
      `
  }

  getBaseClass = () => {
    let queries = Array.from(this.queries)
    let mutations = Array.from(this.mutations)
    let subscriptions = Array.from(this.subscriptions)
    let base = `
  export class GQLClient extends ApolloClient<NormalizedCacheObject>{
    ${queries.map(this.toQuery).join("\n")}
    ${mutations.map(this.toMutation).join("\n")}
    ${subscriptions.map(this.toSubscription).join("\n")}
  }      
      `

    return base
  }

  toMutation = ({
    name,
    hasVariables,
  }: {
    name: string
    hasVariables: boolean
  }) => {
    name = pascalCase(name)
    let paramsDeclaration = this.getParamsDeclaration({
      name,
      hasVariables,
      type: "mutation",
    })

    return `
  mutate${name} = ${paramsDeclaration} => {
    return this.mutate<
      ${name}Mutation,
      ${name}MutationVariables
      >({
        mutation: ${name}Document,
        ${this.getVarsAndOptions(hasVariables)}
    });
  }`
  }

  toQuery = ({
    name,
    hasVariables,
  }: {
    name: string
    hasVariables: boolean
  }) => {
    name = pascalCase(name)
    let paramsDeclaration = this.getParamsDeclaration({
      name,
      hasVariables,
      type: "query",
    })
    return `
  query${name} = ${paramsDeclaration} => {
    return this.query<
      ${name}Query,
      ${name}QueryVariables
      >({
        query: ${name}Document,
        ${this.getVarsAndOptions(hasVariables)}
    });
  }`
  }

  toSubscription = ({
    name,
    hasVariables,
  }: {
    name: string
    hasVariables: boolean
  }) => {
    name = pascalCase(name)
    let paramsDeclaration = this.getParamsDeclaration({
      name,
      hasVariables,
      type: "subscription",
    })
    return `
  subscribe${name} = ${paramsDeclaration} => {
    return this.subscribe<
      ${name}Subscription,
      ${name}SubscriptionVariables
      >({
        query: ${name}Document,
        ${this.getVarsAndOptions(hasVariables)}
    });
  }`
  }

  private getVarsAndOptions = (hasVariables: boolean) => {
    return hasVariables
      ? `variables,
      ...options`
      : `...options`
  }

  private getParamsDeclaration = (ops: {
    name: string
    type: OperationType
    hasVariables: boolean
  }) => {
    let opName = this.getOperationName(ops.type)
    return ops.hasVariables
      ? `(variables: ${ops.name}${opName}Variables, ${this.getRequestOptions(
          ops.type
        )})`
      : `(${this.getRequestOptions(ops.type)})`
  }

  private getRequestOptions = (type?: OperationType) => {
    let isMutation = type && type === "mutation"
    return isMutation
      ? `options?: { fetchPolicy: 'network-only' | 'no-cache' }`
      : `options?: { fetchPolicy: 'network-only' | 'cache-first' | 'no-cache' | 'cache-only' }`
  }

  private getOperationName = (type: OperationType) => {
    if (type === "query") {
      return "Query"
    } else if (type === "mutation") {
      return "Mutation"
    } else {
      return "Subscription"
    }
  }

  public OperationDefinition = (node: OperationDefinitionNode): string => {
    let name = node.name?.value
    let hasVariables = Boolean(node.variableDefinitions?.length)
    if (!name) {
      return ""
    }

    if (node.operation === "query") {
      this.queries.add({ name, hasVariables })
    } else if (node.operation === "mutation") {
      this.mutations.add({ name, hasVariables })
    }
    if (node.operation === "subscription") {
      this.subscriptions.add({ name, hasVariables })
    }
    return ""
  }
}
