# Threat Model — EMV 3-D Secure Protocol Lab

> **Scope.** This document describes the threats the lab is designed to
> surface and the threats the lab itself introduces. It is a reference
> tool for protocol analysis; it is not a production threat
> model for a payment system. A clear scope statement is the first
> step towards a credible threat model.

## 1. What this lab is

The lab is a single-page, client-side React/Vite application that
visualises the EMV 3-D Secure v2.x protocol flows. It ships:

- A scenario engine that lets the user pick a branch (frictionless,
  challenge, decoupled, opt-out, information-only, SPC, error paths).
- A versioned payload registry (`src/data/payloads/`) with
  field-level provenance for AReq, ARes, CReq, CRes, RReq, RRes, Erro,
  OReq, ORes across v2.1.0 / v2.2.0 / v2.3.1.
- A JWS / JSON inspector that validates pasted real-world payloads
  against the registry. Validation runs locally; no payload leaves
  the browser.
- A snapshot/share-URL feature that captures the active scenario
  state in a single, schema-validated JSON document.
- A triple-state theme (Dark / Light / Security) where the Security
  theme is a high-contrast green-on-black that aids in incident
  triage on a projector.

## 2. What this lab is NOT

- It is not a 3DS Server, a Directory Server, or an Access Control
  Server. The lab does not open network sockets and does not accept
  or send 3DS traffic.
- It is not a payment authorisation system. The
  `authenticationValue` and `eci` values displayed in the inspector
  are synthetic and watermarked (e.g. `AAABBiiihH8DAAAAAABiSBI=`).
  They are not CAVVs.
- It is not a credential store. The lab does not persist cardholder
  data; the only state that survives a reload is the scenario
  (browser localStorage is intentionally not used for the synthetic
  PAN `4000123456789010`).

## 3. Threats the lab surfaces

The lab is designed to help a researcher reason about the following
classes of threats. Each is a wire-level concern; the lab models the
attack surface, not the exploit.

### 3.1 Field-shape drift across protocol versions

**Threat.** A 3DS Server that "supports v2.x" might still emit v2.1.0
field names (e.g. `whiteListStatus`, `authenticationType`) when the
issuer is a v2.3.1-only participant, or vice versa. The wire-format
mismatch causes silent rejections or, worse, ARes interpretations
where the issuer treats `whiteListStatus: 'Y'` as a free-pass
attestation.

**How the lab helps.** The `protocolVersion` toggle in the header
re-renders every wire message from the versioned registry. The JWS
inspector flags fields that are out of place for the active version
(e.g. `whiteListStatus` in a v2.3.1 payload) and the field-provenance
registry at `src/data/payloads/meta/fieldProvenance.ts` records
`renamedFrom` / `renamedTo` so the researcher can trace every rename
in either direction.

### 3.2 Missing / extra keys on a wire message

**Threat.** A 3DS Server that adds a v2.3.1 field to a v2.1.0 AReq
risks a parser error in a strict v2.1.0 ACS; conversely, omitting a
v2.3.1 required field (e.g. `deviceChannel`) causes the ACS to fall
back to frictionless default behaviour, which has been used as a
liability-shift bypass in the wild.

**How the lab helps.** The test suite at
`src/data/payloads/__tests__/registry.test.ts` asserts that every
emitted payload contains exactly the field set the registry says
should be on the wire for the active version. The
`expectedFields(messageType, version)` helper is exposed for
extension.

### 3.3 Challenge opt-out as a liability-shift surface

**Threat.** When `transStatus = C` and the 3DS Requestor opts out of
the challenge, the 3DS Server emits a RReq with `transStatus = U` and
`transStatusReason = 24` (challenge skipped, requestor opt-out). The
issuer is then forced to choose: honour the opt-out (no liability
shift to the issuer) or reject the transaction. If the merchant's
acquirer is contractually obligated to honour issuer opt-outs, a
coordinated merchant ↔ acquirer can force the issuer to either absorb
fraud losses or reject the transaction outright.

**How the lab helps.** The `Opt-out` scenario preset surfaces this
path explicitly. The BranchMap view draws a separate lane for the
opt-out branch and the DetailsPanel annotates each step with the
`resultsStatus` and `challengeCancelationIndicator` values that
encode the opt-out semantics.

### 3.4 Decoupled authentication as a timing side-channel

**Threat.** When the ACS returns `transStatus = D`, the 3DS Server
must poll (or wait for a callback) for the RReq. The timing of the
RReq delivery leaks information about the issuer's fraud-decision
latency, which is correlated with the issuer's confidence in the
authentication. An attacker who can observe RReq timing can
triangulate which issuer is processing the transaction.

**How the lab helps.** The `Decoupled D` scenario preset makes the
`threeDSRequestorDecMaxTime` parameter (v2.2.0+) visible in the
inspector. The field-provenance registry records that this field
was added in v2.2.0 to allow the 3DS Requestor to cap the wait,
and the lab's branch visualisation separates the decoupled
async lane from the synchronous challenge lane.

### 3.5 Device-binding as a fingerprint vector

**Threat.** The `deviceId` and `deviceBindingStatus` fields
(introduced in v2.3.1) allow the issuer to recognise a device
across transactions. In aggregate, this forms a fingerprint that
is not under the cardholder's control. PCI-DSS does not require
disclosure of device binding to the cardholder.

**How the lab helps.** The v2.3.1 AReq and RReq builders populate
`deviceId` and `deviceBindingStatus` with synthetic watermarked
values. The `Security Lens` overlay highlights every field that
qualifies as a fingerprint candidate (see
`src/data/emvcoFingerprint.ts::EMVCO_DEVICE_FIELDS`).

## 4. Threats the lab introduces

The lab is a reference tool. We are explicit about its own
attack surface.

### 4.1 Synthetic payload leakage

**Risk.** A researcher might copy a synthetic payload from the
inspector into a real 3DS environment by accident. The synthetic
values are recognisable: correlation IDs are
`8a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d`, PANs are
`4000123456789010`, and `authenticationValue` is the constant
`AAABBiiihH8DAAAAAABiSBI=`.

**Mitigation.** Every rendered payload is marked with a visible
"Synthetic payload" watermark in the inspector, and the README plus
`LICENSES/EMVCo-notice.md` state the reference-only status. Copying a
payload is an explicit user action via the inspector toolbar; nothing
is exported automatically. A future hardening pass will add a
checksum banner at the top of every inspector view.

### 4.2 Browser localStorage pollution

**Risk.** If the lab used `localStorage` to persist scenarios, a
researcher's fingerprint of saved scenarios would leak into
incognito mode transitions and into the browser's storage-clear
audit log.

**Mitigation.** Scenarios are persisted only in the URL query string
(via the share-URL feature) and in explicit download/uploads of
JSON snapshot files. No `localStorage` writes are performed.
`SECURITY.md` documents the data-handling policy.

### 4.3 Comparison-repo derivative data

**Risk.** v2.1.0 / v2.2.0 data is sourced from the
`3DSv2-api-documentation` re-typeset (3dsecure.io), which is itself
a paraphrase of the EMVCo Core Spec. Treating a paraphrase as
authoritative is a known risk for protocol analysis.

**Mitigation.** The `LICENSES/EMVCo-notice.md` file documents the
chain of custody. The field-provenance registry tags every
v2.1.0 / v2.2.0 field with a `comparison` source. The README
states explicitly that v2.3.1 is the authoritative anchor.

## 5. Out-of-scope threats

The following threats are *not* modelled in this lab. Researchers
extending the lab should add their own threat-model entries.

- **Replay attacks.** A captured AReq can be replayed against the
  same DS within `threeDSRequestorDecMaxTime`. The lab does not
  model replay windows.
- **3DS Method iframe abuse.** The 3DS Method iframe is a fingerprint
  channel; a malicious 3DS Server can use it to track cardholders
  across merchants. The lab surfaces the iframe shape in the
  `Step 4 — 3DS Method` step but does not enumerate fingerprinting
  attack vectors.
- **ACS / DS compromise.** The lab assumes honest-but-curious
  participants. A compromised ACS or DS is out of scope; that
  threat is documented in the EMVCo threat catalogue, not here.

## 6. Reporting a lab issue

If you find a security issue in the lab itself (not the protocol),
please follow the reporting process in `SECURITY.md`. We aim for a
90-day coordination window from the date of the report, with a
14-day pre-release patch review.
