/**
 * Client Execution Engine for GraphQL Queries & Mutations
 *
 * Provides a standard executeGraphQL(query, variables) endpoint
 * that resolves directly against the protocol schema.
 */

import { resolvers } from './resolvers';

export interface GraphQLResponse<T = Record<string, unknown>> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export async function executeGraphQL<T = Record<string, unknown>>(
  operation: string,
  variables: Record<string, unknown> = {}
): Promise<GraphQLResponse<T>> {
  try {
    const trimmed = operation.trim();
    const isMutation = trimmed.startsWith('mutation');

    if (isMutation) {
      if (trimmed.includes('saveState')) {
        const result = resolvers.Mutation.saveState(null, { input: variables.input as any });
        return { data: { saveState: result } as unknown as T };
      }
      if (trimmed.includes('applyPreset')) {
        const result = resolvers.Mutation.applyPreset(null, { presetId: variables.presetId as string });
        return { data: { applyPreset: result } as unknown as T };
      }
    } else {
      if (trimmed.includes('scenarios')) {
        const result = resolvers.Query.scenarios();
        return { data: { scenarios: result } as unknown as T };
      }
      if (trimmed.includes('scenario(')) {
        const result = resolvers.Query.scenario(null, { id: variables.id as string });
        return { data: { scenario: result } as unknown as T };
      }
      if (trimmed.includes('steps')) {
        const result = resolvers.Query.steps();
        return { data: { steps: result } as unknown as T };
      }
      if (trimmed.includes('savedState(')) {
        const result = resolvers.Query.savedState(null, { token: variables.token as string });
        return { data: { savedState: result } as unknown as T };
      }
      if (trimmed.includes('fields')) {
        const result = resolvers.Query.fields(null, { query: variables.query as string });
        return { data: { fields: result } as unknown as T };
      }
      if (trimmed.includes('participants')) {
        const result = resolvers.Query.participants();
        return { data: { participants: result } as unknown as T };
      }
    }

    return { errors: [{ message: 'Unsupported GraphQL operation or missing handler' }] };
  } catch (err: unknown) {
    return {
      errors: [{ message: err instanceof Error ? err.message : String(err) }],
    };
  }
}
