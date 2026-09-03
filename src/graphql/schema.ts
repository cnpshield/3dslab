/**
 * GraphQL Schema Definitions for EMV 3DS Protocol Lab
 *
 * Provides a formal query & mutation contract for querying protocol scenarios,
 * steps, field specifications, security invariants, and managing state permalinks.
 */

export const typeDefs = `#graphql
  enum ProtocolVersion {
    V2_1_0
    V2_2_0
    V2_3_1
  }

  enum TransStatus {
    Y
    A
    N
    U
    R
    C
    D
    I
    S
  }

  enum ThemeMode {
    LIGHT
    DARK
  }

  type Participant {
    id: ID!
    name: String!
    fullName: String!
    role: String!
    stroke: String!
  }

  type StepGroup {
    id: ID!
    title: String!
    description: String!
    color: String!
  }

  type FieldReference {
    fieldName: String!
    dataType: String!
    requiredIn: [String!]!
    description: String!
    normativeRef: String
  }

  type ProtocolStep {
    id: ID!
    num: String!
    name: String!
    groupId: ID!
    source: ID!
    target: ID!
    shortDesc: String!
    wireProtocol: String!
    criticality: String!
    userExperience: String!
    purpose: String!
  }

  type ScenarioConfig {
    protocolVersion: String!
    methodPath: String!
    dsRouting: String!
    transStatus: String!
    challengeOutcome: String!
    challengePresentation: String!
  }

  type ScenarioPreset {
    id: ID!
    label: String!
    summary: String!
    scenario: ScenarioConfig!
  }

  type SavedStateResult {
    token: ID!
    url: String!
    createdAt: String!
    scenario: ScenarioConfig!
    currentStepIndex: Int
    theme: ThemeMode
    securityLensEnabled: Boolean
    hiddenGroups: [String!]
    canvasOrientation: String
    readingMode: Boolean
    focusPhase: Boolean
  }

  input SaveStateInput {
    scenario: ScenarioInput!
    currentStepIndex: Int
    theme: ThemeMode
    securityLensEnabled: Boolean
    hiddenGroups: [String!]
    canvasOrientation: String
    readingMode: Boolean
    focusPhase: Boolean
  }

  input ScenarioInput {
    protocolVersion: String!
    methodPath: String!
    dsRouting: String!
    transStatus: String!
    challengeOutcome: String!
    repeatChallenge: Boolean
    errorPath: String
    challengePreference: String
    challengeMandated: String
    challengePresentation: String
  }

  type Query {
    scenarios: [ScenarioPreset!]!
    scenario(id: ID!): ScenarioPreset
    steps(version: String): [ProtocolStep!]!
    step(id: ID!): ProtocolStep
    participants: [Participant!]!
    fields(query: String): [FieldReference!]!
    savedState(token: ID!): SavedStateResult
  }

  type Mutation {
    saveState(input: SaveStateInput!): SavedStateResult!
    applyPreset(presetId: ID!): ScenarioPreset!
  }
`;
