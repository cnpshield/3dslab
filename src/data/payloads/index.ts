/**
 * Versioned payload registry — single entry point for the lab UI and the
 * spec-conformance test suite.
 *
 * The shape is:
 *   payloads[messageType][version] = VersionedPayload
 *
 *   getPayload(messageType, version, scenario) returns the message body
 *   for the given combination, calling the versioned builder.
 *
 * Each `VersionedPayload` records the field-level provenance (so the
 * inspector can show "this field was added in v2.3.1, anchored to
 * Table B.1 of the EMV 3DS v2.3.1 Core Spec and corroborated by
 * `differences_v220_v231.rst`").
 */

import type { ProtocolVersion, Scenario } from '../../types';
import { AReq_FIELDS } from './meta/fieldProvenance';
import { buildAReq_v210 } from './areq/v210';
import { buildAReq_v220 } from './areq/v220';
import { buildAReq_v231 } from './areq/v231';
import { ARes_FIELDS } from './meta/fieldProvenance';
import { buildARes_v210 } from './ares/v210';
import { buildARes_v220 } from './ares/v220';
import { buildARes_v231 } from './ares/v231';
import { CReq_FIELDS } from './meta/fieldProvenance';
import { buildCReq_v210 } from './creq/v210';
import { buildCReq_v220 } from './creq/v220';
import { buildCReq_v231 } from './creq/v231';
import { CRes_FIELDS } from './meta/fieldProvenance';
import { buildCRes_v210 } from './cres/v210';
import { buildCRes_v220 } from './cres/v220';
import { buildCRes_v231 } from './cres/v231';
import { RReq_FIELDS } from './meta/fieldProvenance';
import { buildRReq_v210 } from './rreq/v210';
import { buildRReq_v220 } from './rreq/v220';
import { buildRReq_v231 } from './rreq/v231';
import { RRes_FIELDS, Erro_FIELDS, OReq_FIELDS, ORes_FIELDS } from './meta/fieldProvenance';
import { buildRRes_v210, buildRRes_v220, buildRRes_v231 } from './rres';
import { buildErro_v210, buildErro_v220, buildErro_v231 } from './erro';
import { buildOReq_v231 } from './oreq/v231';
import { buildORes_v231 } from './ores/v231';

import type { MessageType, SupportedPayloadVersion, VersionedPayload } from './types';
import { listFieldsFor } from './types';
import { FIELD_PROVENANCE } from './meta/fieldProvenance';

export type { MessageType, SupportedPayloadVersion, VersionedPayload, FieldProvenance, FieldProvenanceSource, PayloadBuilder } from './types';
export { resolveFieldAt, listFieldsFor, PAYLOAD_VERSION_ORDER } from './types';
export { FIELD_PROVENANCE, AReq_FIELDS, ARes_FIELDS, CReq_FIELDS, CRes_FIELDS, RReq_FIELDS, RRes_FIELDS, Erro_FIELDS, OReq_FIELDS, ORes_FIELDS } from './meta/fieldProvenance';

/**
 * The full registry: every (messageType, version) combination the lab
 * supports, paired with the field-level provenance.
 */
export const PAYLOADS: Record<MessageType, Partial<Record<SupportedPayloadVersion, VersionedPayload>>> = {
  AReq: {
    '2.1.0': {
      messageType: 'AReq',
      version: '2.1.0',
      builder: buildAReq_v210,
      fields: AReq_FIELDS,
      transport: 'jwt',
      citation: 'EMV 3DS v2.3.1 Core Spec Table B.1, filtered to v2.1.0 fields per `differences.rst`.',
    },
    '2.2.0': {
      messageType: 'AReq',
      version: '2.2.0',
      builder: buildAReq_v220,
      fields: AReq_FIELDS,
      transport: 'jwt',
      citation: 'EMV 3DS v2.3.1 Core Spec Table B.1, filtered to v2.2.0 fields per `differences.rst`.',
    },
    '2.3.1': {
      messageType: 'AReq',
      version: '2.3.1',
      builder: buildAReq_v231,
      fields: AReq_FIELDS,
      transport: 'detached-jws',
      citation: 'EMV 3DS v2.3.1 Core Spec Table B.1 (29 additions, 2 renames, 1 removal vs. v2.2.0).',
    },
  },
  ARes: {
    '2.1.0': {
      messageType: 'ARes',
      version: '2.1.0',
      builder: buildARes_v210,
      fields: ARes_FIELDS,
      transport: 'jwt',
      citation: 'EMV 3DS v2.3.1 Core Spec Table B.2, filtered to v2.1.0 fields.',
    },
    '2.2.0': {
      messageType: 'ARes',
      version: '2.2.0',
      builder: buildARes_v220,
      fields: ARes_FIELDS,
      transport: 'jwt',
      citation: 'EMV 3DS v2.3.1 Core Spec Table B.2, v2.2.0 additions per `differences.rst`.',
    },
    '2.3.1': {
      messageType: 'ARes',
      version: '2.3.1',
      builder: buildARes_v231,
      fields: ARes_FIELDS,
      transport: 'detached-jws',
      citation: 'EMV 3DS v2.3.1 Core Spec Table B.2 (11 additions, 3 renames, 2 type changes vs. v2.2.0).',
    },
  },
  CReq: {
    '2.1.0': {
      messageType: 'CReq',
      version: '2.1.0',
      builder: buildCReq_v210,
      fields: CReq_FIELDS,
      transport: 'form-post',
      citation: 'EMV 3DS v2.3.1 Core Spec Table B.3, v2.1.0 subset.',
    },
    '2.2.0': {
      messageType: 'CReq',
      version: '2.2.0',
      builder: buildCReq_v220,
      fields: CReq_FIELDS,
      transport: 'form-post',
      citation: 'EMV 3DS v2.3.1 Core Spec Table B.3, v2.2.0 additions per `differences.rst`.',
    },
    '2.3.1': {
      messageType: 'CReq',
      version: '2.3.1',
      builder: buildCReq_v231,
      fields: CReq_FIELDS,
      transport: 'form-post',
      citation: 'EMV 3DS v2.3.1 Core Spec Table B.3 (no field-level changes vs. v2.2.0).',
    },
  },
  CRes: {
    '2.1.0': {
      messageType: 'CRes',
      version: '2.1.0',
      builder: buildCRes_v210,
      fields: CRes_FIELDS,
      transport: 'form-post',
      citation: 'EMV 3DS v2.3.1 Core Spec Table B.4 / B.5, v2.1.0 subset.',
    },
    '2.2.0': {
      messageType: 'CRes',
      version: '2.2.0',
      builder: buildCRes_v220,
      fields: CRes_FIELDS,
      transport: 'form-post',
      citation: 'EMV 3DS v2.3.1 Core Spec Table B.4 / B.5, v2.2.0 additions per `differences.rst`.',
    },
    '2.3.1': {
      messageType: 'CRes',
      version: '2.3.1',
      builder: buildCRes_v231,
      fields: CRes_FIELDS,
      transport: 'form-post',
      citation: 'EMV 3DS v2.3.1 Core Spec Table B.4 / B.5 (cardholderInfo became an object).',
    },
  },
  RReq: {
    '2.1.0': {
      messageType: 'RReq',
      version: '2.1.0',
      builder: buildRReq_v210,
      fields: RReq_FIELDS,
      transport: 'jwt',
      citation: 'EMV 3DS v2.3.1 Core Spec Table B.8, v2.1.0 subset.',
    },
    '2.2.0': {
      messageType: 'RReq',
      version: '2.2.0',
      builder: buildRReq_v220,
      fields: RReq_FIELDS,
      transport: 'jwt',
      citation: 'EMV 3DS v2.3.1 Core Spec Table B.8, v2.2.0 additions per `differences.rst`.',
    },
    '2.3.1': {
      messageType: 'RReq',
      version: '2.3.1',
      builder: buildRReq_v231,
      fields: RReq_FIELDS,
      transport: 'detached-jws',
      citation: 'EMV 3DS v2.3.1 Core Spec Table B.8 (5 additions, 3 renames, 1 type change vs. v2.2.0).',
    },
  },
  RRes: {
    '2.1.0': {
      messageType: 'RRes',
      version: '2.1.0',
      builder: buildRRes_v210,
      fields: RRes_FIELDS,
      transport: 'jwt',
      citation: 'EMV 3DS v2.3.1 Core Spec Table B.9, v2.1.0 subset.',
    },
    '2.2.0': {
      messageType: 'RRes',
      version: '2.2.0',
      builder: buildRRes_v220,
      fields: RRes_FIELDS,
      transport: 'jwt',
      citation: 'EMV 3DS v2.3.1 Core Spec Table B.9, v2.2.0 (no changes).',
    },
    '2.3.1': {
      messageType: 'RRes',
      version: '2.3.1',
      builder: buildRRes_v231,
      fields: RRes_FIELDS,
      transport: 'detached-jws',
      citation: 'EMV 3DS v2.3.1 Core Spec Table B.9, v2.3.1 (no changes).',
    },
  },
  // PReq / PRes shapes follow the AReq / ARes patterns respectively. The
  // preauth flow is a thin handshake that the lab does not need to
  // version-control exhaustively; the inline payloads in flowData.ts
  // remain the source of truth.
  PReq: {},
  PRes: {},
  Erro: {
    '2.1.0': {
      messageType: 'Erro',
      version: '2.1.0',
      builder: buildErro_v210,
      fields: Erro_FIELDS,
      transport: 'jwt',
      citation: 'EMV 3DS v2.3.1 Core Spec Table A.10, v2.1.0 subset.',
    },
    '2.2.0': {
      messageType: 'Erro',
      version: '2.2.0',
      builder: buildErro_v220,
      fields: Erro_FIELDS,
      transport: 'jwt',
      citation: 'EMV 3DS v2.3.1 Core Spec Table A.10, v2.2.0 (no field-level delta vs. v2.1.0).',
    },
    '2.3.1': {
      messageType: 'Erro',
      version: '2.3.1',
      builder: buildErro_v231,
      fields: Erro_FIELDS,
      transport: 'detached-jws',
      citation: 'EMV 3DS v2.3.1 Core Spec Table A.10, v2.3.1 (no changes).',
    },
  },
  OReq: {
    '2.3.1': {
      messageType: 'OReq',
      version: '2.3.1',
      builder: buildOReq_v231,
      fields: OReq_FIELDS,
      transport: 'detached-jws',
      citation: 'EMV 3DS v2.3.1 Core Spec Table B.10 (operation-message sequence; not part of the authentication flow).',
    },
  },
  ORes: {
    '2.3.1': {
      messageType: 'ORes',
      version: '2.3.1',
      builder: buildORes_v231,
      fields: ORes_FIELDS,
      transport: 'detached-jws',
      citation: 'EMV 3DS v2.3.1 Core Spec Table B.11 (operation-message acknowledgement; not part of the authentication flow).',
    },
  },
};

/**
 * Look up the versioned payload for a given (messageType, version) pair.
 * Throws if the combination is not registered — that is a programming
 * error, not a runtime condition.
 */
export function getVersionedPayload(
  messageType: MessageType,
  version: ProtocolVersion,
): VersionedPayload {
  const slot = PAYLOADS[messageType] as Partial<Record<SupportedPayloadVersion, VersionedPayload>>;
  // v2.4.0 is not modelled yet; the lab exposes it in the UI as a
  // "preview" placeholder. We fall back to v2.3.1 in that case so the
  // inspector still renders something useful.
  const target = (version === '2.4.0' ? '2.3.1' : version) as SupportedPayloadVersion;
  const entry = slot[target];
  if (!entry) {
    throw new Error(
      `No versioned payload registered for ${messageType} @ ${version}. ` +
        `Available: ${Object.keys(slot).join(', ') || 'none'}.`,
    );
  }
  return entry;
}

/**
 * Resolve a payload for the given (messageType, scenario). Honours
 * `scenario.protocolVersion`. Returns a fresh object on every call so
 * callers can mutate it (e.g. `getDynamicPayload` overlays scenario
 * fields like `transStatus`).
 */
export function getPayload(
  messageType: MessageType,
  scenario: Scenario,
): Record<string, unknown> {
  const entry = getVersionedPayload(messageType, scenario.protocolVersion);
  return JSON.parse(JSON.stringify(entry.builder(scenario)));
}

/**
 * Conformance helper: returns the list of field names the registry says
 * should be on the wire for the given (messageType, version) pair.
 * Used by the spec-conformance test suite to assert "no extra keys,
 * no missing keys" against a synthetic payload.
 */
export function expectedFields(
  messageType: MessageType,
  version: ProtocolVersion,
): string[] {
  const entry = getVersionedPayload(messageType, version);
  return listFieldsFor(messageType, entry.version, FIELD_PROVENANCE).map((f) => f.field);
}
