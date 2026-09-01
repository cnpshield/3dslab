# Open-Source Rust 3DS Server with Local DS/ACS Simulators Plan

Source basis: `prism-uploads/EMVCo_3DS_CoreSpec_v2.3.1_20220831.pdf` and `prism-uploads/EMVCo_3DS_Specification_FAQs_8-April-2026.pdf`

This plan is for an open-source Rust codebase that implements a **merchant-side EMV 3-D Secure Server (3DSS)** plus **local mock Directory Server (DS) and mock Access Control Server (ACS) simulators** for testing, education, and research. It is intentionally written with a hard boundary between:

- What can be safely open sourced as protocol tooling, simulators, validators, and merchant-side orchestration.
- What cannot be honestly advertised as production-ready without EMVCo approval, PCI 3DS controls, scheme onboarding, Directory Server connectivity, and legal/commercial agreements.

The realistic positioning is:

> An open-source Rust merchant-side 3DS Server, protocol engine, browser-flow simulator, local DS/ACS testbed, and privacy/security research toolkit.

Not:

> A complete EMV 3DS ecosystem, a card-network Directory Server, an issuer ACS, or a drop-in certified production replacement for PAAY, Stripe, Adyen, or other commercial 3DS providers.

## 1. What the Core Spec Requires You to Model

The Core Specification defines the EMV 3DS components, messages, message validation requirements, browser/app flows, timeouts, and data elements. It does **not** define a proprietary issuer risk engine, a commercial card-network connection process, or a deployable compliance programme.

For a merchant-side 3DS Server codebase, the most important spec-grounded concepts are:

- `PReq` / `PRes`: Preparation messages used by the 3DS Server to obtain DS card-range information, active protocol-version information, and ACS metadata such as the ACS 3DS Method URL. This data is normally cached and consulted during later checkouts; it is not invented by the 3DS Server.
- `AReq` / `ARes`: Authentication request and response. The `AReq` is formed by the 3DS Server and sent through the DS to the ACS. The `ARes` is the ACS response routed back through the DS.
- `CReq` / `CRes`: Challenge request and response. In browser flows, the 3DS Server helps initiate the browser challenge by creating/posting the browser `CReq` through the Cardholder Browser to the ACS, and receives challenge completion data through browser/result handling.
- `RReq` / `RRes`: Result request and response. These are ACS-to-3DS-Server result messages routed via the DS after challenge or decoupled outcomes. They are not part of a completed frictionless-only browser flow.
- `threeDSServerTransID`: The 3DS Server transaction identifier that binds setup, 3DS Method, `AReq`, challenge, and result handling.
- `threeDSMethodData`: A Base64url-encoded JSON object posted through the browser to the ACS 3DS Method URL.
- `threeDSCompInd`: Indicator in `AReq` that reports whether the 3DS Method completed, failed/timed out, or was unavailable.
- `transStatus`: The ACS authentication result in `ARes` or later result messages.
- `ECI` and `Authentication Value (AV)`: Payment-system-specific authentication output values included where applicable for payment authentication.
- Browser device channel: `02-BRW`.

### 1.1 Message Ownership for This Project

| Message / flow | Real implementation in this project | Simulator role |
| --- | --- | --- |
| `PReq` | 3DS Server sends to DS to request preparation/card-range data | Mock DS receives and returns deterministic `PRes` |
| `PRes` | 3DS Server receives and caches DS-provided card-range / ACS metadata | Mock DS generates card ranges, protocol versions, and optional `threeDSMethodURL` |
| 3DS Method setup | 3DS Server gives merchant page `threeDSServerTransID`, notification URL, and ACS Method URL if available | Mock ACS serves the Method endpoint and posts completion notification |
| `AReq` | 3DS Server builds and sends authentication request | Mock DS validates/routes; mock ACS evaluates deterministic scenario |
| `ARes` | 3DS Server receives and processes authentication response | Mock ACS generates; mock DS forwards |
| Browser `CReq` | 3DS Server initiates browser challenge POST when `transStatus = C` | Mock ACS receives challenge request and serves challenge UI |
| Browser `CRes` / challenge completion | 3DS Server receives challenge completion/result information according to simulated flow | Mock ACS produces deterministic challenge completion |
| `RReq` | 3DS Server receives result request from ACS via DS after challenge/decoupled flows | Mock ACS/DS generate result path |
| `RRes` | 3DS Server responds to `RReq` | Mock DS/ACS verify local result path |
| `Erro` | 3DS Server parses, emits, and tests error handling | Mock DS/ACS generate malformed/error scenarios |

This table is the central boundary: **the product is the 3DS Server; DS and ACS exist only as local simulators unless separate real-world certification/onboarding happens.**


### 1.2 Critical 3DS Server Requirements Learned from the Core Spec

The Core Spec describes the 3DS Server as the functional interface between the 3DS Requestor Environment and the Directory Server. A correct implementation must therefore focus less on issuer-side risk scoring and more on **data collection, message construction, DS trust, validation, protection, routing, state handling, and result delivery back to the merchant environment**.

A serious Rust 3DS Server implementation should satisfy these requirement groups:

#### A. Component and Trust Requirements

- Provide the interface between the 3DS Requestor Environment and the DS.
- Collect the necessary data elements for 3DS messages from the merchant, browser, stored card/account context, SDK/client data, and transaction context.
- Authenticate the DS before trusting DS messages or metadata.
- Validate the DS, 3DS Requestor, and applicable client-side components/integrations.
- Ensure message contents are protected on the links where the protocol or deployment profile requires protection.
- Keep authorization separate from authentication; payment authorization is outside the core 3DS authentication flow even if a provider later links to an acquirer.

#### B. Preparation / Card-Range Requirements

- Implement `PReq` generation and `PRes` processing.
- Cache DS-provided card-range information; the 3DS Server must not invent ACS Method URLs, participating ranges, protocol versions, or ACS metadata.
- Support incremental card-range updates using DS-provided serial-number style state where applicable.
- Use cached `PRes` data during checkout to determine supported DS/ACS protocol versions and whether a 3DS Method URL exists.
- Treat missing card-range support, unsupported versions, and unavailable ACS Method URLs as explicit state-machine outcomes.

#### C. Browser-Based Setup Requirements

- For browser channel `02-BRW`, support the 3DS Method when an ACS Method URL is available.
- Generate and preserve a `threeDSServerTransID` that binds setup, Method execution, `AReq`, challenge, and result handling.
- Build `threeDSMethodData` as Base64url-encoded JSON containing at least the transaction identifier and the Method notification URL.
- Track Method outcomes accurately:
  - `Y`: completed or valid recent prior Method result reused.
  - `N`: Method invoked but did not complete successfully within the timeout.
  - `U`: Method unavailable because no ACS Method URL exists.
- Do not blur ACS-side browser collection with merchant-side SDK collection. The ACS controls its own Method URL; the merchant/3DSS should orchestrate the iframe and collect required browser fields for `AReq`.

#### D. AReq Construction Requirements

- Build exactly one `AReq` per authentication except for defined special cases such as 3DS Requestor-Initiated SPC behavior.
- Set the correct `messageType`, `messageVersion`, `deviceChannel`, `messageCategory`, transaction IDs, merchant/requestor fields, and browser/device fields.
- Include `threeDSCompInd` for browser flows.
- Include required browser fields for `02-BRW`; reject or fail fast when mandatory browser data is missing, malformed, stale, hard-coded, or inconsistent with the current transaction.
- Treat payment authentication and non-payment authentication separately; do not assume all fields apply to both message categories.
- Version-gate data elements so a field valid in one protocol version is not silently accepted in another.

#### E. ARes Processing Requirements

- Validate `ARes` before acting on it.
- Verify transaction identifiers, message type, version, DS/ACS relationship, and protocol status fields.
- Handle all `transStatus` outcomes explicitly:
  - `Y`: authenticated.
  - `A`: attempts processing performed.
  - `C`: challenge required.
  - `D`: decoupled authentication required where supported.
  - `N`: not authenticated.
  - `U`: unable to authenticate.
  - `R`: rejected.
- For payment authentication, propagate ECI and Authentication Value (AV) where present/applicable, but keep scheme-specific names such as CAVV/AAV outside the generic core model.
- Never treat a parseable `ARes` as automatically successful; success depends on `transStatus` and valid message content.

#### F. Browser Challenge Requirements

- When `ARes.transStatus = C`, initiate the browser challenge path rather than treating the transaction as frictionless.
- For browser challenges, create/post the browser `CReq` through the Cardholder Browser to the ACS.
- Preserve transaction state while the challenge is active.
- Enforce challenge timeout and expiry behavior separately from 3DS Method timeout.
- Handle challenge completion and result notification paths without assuming the browser callback alone is sufficient proof of final authentication.

#### G. RReq/RRes Result Requirements

- Implement `RReq` parsing for challenge and decoupled result flows.
- Validate `RReq` transaction identifiers and message content before updating final state.
- Send `RRes` to acknowledge receipt of `RReq` through the DS path.
- Do not include `RReq/RRes` in completed frictionless-only flows.

#### H. Error and Timeout Requirements

- Implement `Erro` message parsing and generation.
- Maintain separate timeout handling for `AReq/ARes`, `RReq/RRes`, 3DS Method, browser challenge, and local merchant API sessions.
- Record whether a timeout is local simulator behavior, protocol timeout behavior, or merchant-facing API timeout behavior.
- Fail closed on malformed messages, unexpected message types, invalid versions, transaction-ID mismatch, and invalid enum values.

#### I. Data-Element Validation Requirements

- Validate lengths, formats, enumerations, conditional inclusion rules, and per-version availability for data elements.
- Use constrained Rust newtypes for IDs, country codes, currency codes, URLs, timestamps, message versions, transaction statuses, device channels, and Base64url JSON payloads.
- Preserve field source metadata where useful for research and debugging: merchant-provided, browser-collected, DS-provided, ACS-provided, or simulator-generated.
- Make validation errors precise enough to support conformance testing and certification preparation.

#### J. Security and Logging Requirements

- Redact PAN-like values, account identifiers, names, emails, phone numbers, billing/shipping addresses, transaction IDs, Method payloads, notification URLs, and authentication values from logs by default.
- Keep simulator keys, mock crypto, and null crypto impossible to enable in a production profile.
- Use TLS/mTLS-ready abstractions even if local simulator mode runs over HTTP.
- Do not store raw PAN in the default open-source demo.
- Treat DS/ACS simulator responses as test fixtures, not real issuer decisions.

These requirements should drive the crate boundaries: `three-ds-protocol` validates messages, `three-ds-server` owns merchant-side state and DS communication, and `three-ds-simulator` emulates DS/ACS behavior only for local testing.


### 1.3 Browser-Based 3DS Server Requirement Matrix

This matrix converts the Core Spec's browser-flow requirements into implementation tasks. It is deliberately focused on **merchant-side 3DS Server behavior**.

| Spec area | Core requirement meaning | Implementation requirement |
| --- | --- | --- |
| Browser setup, Req 80 | Retrieve ACS protocol versions, DS protocol versions, and ACS Method URL from previously received `PRes` data | Implement `CardRangeResolver` backed by `PRes` cache; expose setup response to merchant page |
| Browser setup, Req 81 | Generate `threeDSServerTransID` | Generate UUID-format transaction ID at setup, persist before any Method/AReq work |
| Browser setup, Req 82 | Return transaction ID, ACS/DS protocol versions, and Method URL if present to 3DS Requestor | Define a merchant setup API response distinct from EMV wire messages |
| Browser Method, Req 83 | Use the same `threeDSServerTransID` in 3DS Method and later `AReq` | Make transaction ID immutable after creation; validate at AReq build time |
| Browser Method, Req 84 | Execute 3DS Method on the merchant website if Method URL exists | SDK must create hidden iframe/form POST; server must track completion/timeout/unavailable |
| Browser data, Req 86 | Browser-to-3DS Requestor communication must use server-authenticated TLS; otherwise stop 3DS processing | Production profile must require HTTPS/TLS metadata or trusted reverse-proxy headers; simulator may relax only with explicit flag |
| Requestor-to-Server, Req 301 | If 3DS Requestor and 3DS Server are separate, communication must be protected | Merchant API should require authenticated TLS/mTLS/API credentials in production profile |
| AReq prep, Req 87 | Obtain 3DS Requestor ID, 3DS Server Reference Number, and related identity/configuration data | Config model must include requestor/server identifiers and DS registration metadata |
| AReq prep, Req 88 | Ensure all information needed for `AReq` is available | `AReqBuilder` must return structured missing-field errors before sending anything to DS |
| Method freshness, Req 441 | Ensure recent prior 3DS Method execution is within previous 10 minutes or rerun Method | Store method timestamp and reuse eligibility; never reuse stale method results |
| DS routing, Req 89 | Determine which DS receives the authentication transaction | Add DS routing abstraction keyed by card range/payment system/DS metadata |
| DS secure link, Req 90 | Establish secure link with DS | Production profile must model mTLS/certificate trust; simulator profile can use local HTTP only |
| Version selection, Req 422 | Use ACS and DS protocol version lists from `PRes` to set highest mutually supported version | Implement version negotiation from cached `PRes`; never blindly default if cached data exists |
| AReq format, Req 91 | Format `AReq` according to Table B.1 | Implement version-gated `AReq` model and validator |
| AReq send, Req 92 | Send `AReq` to DS over secure link | Implement `DsClient::send_areq`; retry/timeout behavior must be explicit |
| ARes receive | Receive `ARes` or Error from DS and process according to status/error | Add `AResHandler` that validates message, maps `transStatus`, and informs merchant API |
| Challenge path | Browser `CReq` is formed by the 3DS Server and posted through browser; one browser `CReq` per challenge | Implement browser challenge initiation as a distinct state, not as frictionless continuation |
| Result path | `RReq` is sent by ACS through DS to 3DS Server; `RRes` acknowledges receipt | Expose result notification endpoint for DS simulator/production adapter; validate `RReq`; send `RRes` |
| Error handling | Unrecognizable messages, invalid data elements, and missing required elements map to `Erro` with component-specific error codes | Implement message recognition, required-field validation, invalid-field validation, and `Erro` generation with component `S` for 3DS Server-originated errors |

### 1.4 Critical Gaps Found in Second Core Spec Review

A second pass over the Core Spec shows that the existing browser-first plan is directionally correct, but several 3DS Server duties must be made explicit so they are not lost during implementation:

1. **HTTP message envelope rules**
   - Model `Content-Type` requirements, including JSON messages, browser `CReq` form posts, and browser `CRes` HTML responses.
   - Add `X-Request-ID` for outbound `AReq`, `RRes`, `PReq`, and future `ORes` messages.
   - Validate `X-Response-ID` and echoed `X-Request-ID` on inbound responses where applicable.

2. **Accepted inbound message allowlist**
   - The 3DS Server must only accept `ARes`, `RReq`, `PRes`, `OReq`, or `Erro` as EMV 3DS messages.
   - Any other inbound message type must be treated as an error, not ignored or routed generically.

3. **Duplicate result protection**
   - If more than one `RReq` is received for the same transaction, the 3DS Server must return the duplicate-result error path instead of updating final state twice.
   - The state store therefore needs a final-result latch and idempotency logic that distinguishes retry-safe local API calls from duplicate protocol results.

4. **Browser challenge iframe requirements**
   - The SDK must create challenge iframes using the spec-defined iframe attributes and sandbox attributes.
   - Challenge Window Size must be selected from valid values and included in the browser `CReq`.
   - Browser challenge initiation must use an HTTP POST to the ACS URL from `ARes`, not a simple redirect.
   - A JavaScript-disabled fallback path is required for browser challenge initiation.
   - On `CRes` receipt, the requestor environment should close/remove the challenge iframe by refreshing or updating the parent page.

5. **3DS Method callback details**
   - `threeDSMethodData` sent to the ACS contains `threeDSServerTransID` and `threeDSMethodNotificationURL`.
   - `threeDSMethodData` returned to the notification URL contains the `threeDSServerTransID`.
   - The 3DS Server must decode, validate, and bind the callback to an existing transaction before setting `threeDSCompInd = Y`.

6. **Message extension handling**
   - Implement a bounded `messageExtension` model rather than a loose JSON bag.
   - Enforce maximum extension count, extension identifiers, criticality handling, and failure on unrecognized critical extensions.
   - Preserve extension data for research traces while redacting sensitive payloads.

7. **3-D Secure array validation**
   - Validate that 3DS array fields contain only allowed JSON types and do not contain duplicate elements.
   - Duplicate array elements should produce a validation error instead of being silently accepted.

8. **Operation messages in v2.3.1**
   - `OReq` / `ORes` are operational messages from the DS to a 3DS Server or ACS.
   - They are not part of the initial browser authentication MVP, but a v2.3.1-complete 3DS Server must eventually receive and validate `OReq` and send `ORes`.
   - Treat this as a deferred production-readiness feature, not a simulator blocker.

9. **SPC browser status handling**
   - Secure Payment Confirmation introduces browser-specific status behavior, including `transStatus = S` and follow-up handling in supported versions/profiles.
   - The MVP may explicitly reject or mark SPC unsupported, but the protocol model should reserve the status and avoid treating unknown statuses as success.

10. **Security-link specificity**
    - The 3DS Server-to-DS `AReq/ARes` path and DS-to-3DS-Server `RReq/RRes` path are distinct mutually authenticated TLS links in production.
    - The plan should model separate client and server TLS material, even if simulator mode uses local HTTP.

11. **Browser information completeness**
    - Browser-channel `AReq` validation should be driven from the Browser Information table, not just a hand-written list of common fields.
    - Required, optional, conditional, and version-gated browser fields must be represented explicitly.

12. **Error mapping granularity**
    - The 3DS Server must distinguish unrecognized message type, malformed JSON, missing required field, invalid field value, invalid version, transaction mismatch, duplicate `RReq`, timeout, and cryptographic/transport failure.
    - These should map into structured local errors and, when applicable, outbound `Erro` messages with component `S`.

### 1.5 2026 EMVCo FAQ Addendum for Browser-First 3DS Server

Source basis: `prism-uploads/EMVCo_3DS_Specification_FAQs_8-April-2026.pdf`. The FAQ does not replace the Core Spec, but it clarifies several implementation choices that matter for a serious browser-first 3DS Server.

1. **Version policy and v2.1.0 sunset**
   - The FAQ notes that testing support for EMV 3DS v2.1.0 has been sunset.
   - The project should start with active browser-payment versions such as `2.2.0` and `2.3.1`, not spend MVP effort on `2.1.0` except possibly as historical parser research.
   - Version handling should follow the active-version status published through EMVCo bulletin/version configuration material rather than hard-coding one static table forever.

2. **Conditional fields are not one concept**
   - Conditional data can depend on other message fields, DS programme rules, or local-market rules.
   - The validator must therefore support rule sources: spec-defined, DS-profile-defined, and market-profile-defined.
   - A field that is optional in the generic Core Spec may still be required by a DS profile or regional deployment profile.

3. **Co-badged card routing**
   - If multiple DS URLs are available for the same account range, the Core Spec does not mandate one routing choice.
   - Add a routing policy layer for co-badged ranges: merchant preference, market rules, DS availability, audit trace, and deterministic simulator policy.
   - Never hide co-badged routing behind a single card-range lookup result; expose ambiguity to the router.

4. **Card Range Data file download**
   - For v2.3.1 approval testing, 3DS Server support for Card Range Data file download is mandatory, while DS support may be optional.
   - If a `PRes` provides a Card Range Data File URL and file download is used, the downloaded file must be validated and processed like card-range data received directly in `PRes`.
   - For v2.2.0, file download may appear through the Bridging Message Extension; if the file URL is present, the downloaded complete data takes precedence over card-range data and serial number in `PRes`.

5. **PRes version and ACS Information Indicator validation**
   - `acsInfoInd` values are valid only for the protocol version in which they are defined, plus values reserved or defined by DS programmes.
   - Undefined values according to message version/profile should produce an Error Message.
   - For v2.2.0 `acsEndProtocolVersion` and `dsEndProtocolVersion`, higher future-looking version strings may be valid if they meet string length/format requirements; the 3DS Server must not reject them solely because they are newer than its current implementation.

6. **UTC and browser-field normalization**
   - The 3DS Server must convert purchase and risk dates/times into UTC before building `AReq`.
   - Browser screen color depth needs version-aware normalization: older profiles may require closest-lower accepted values, while v2.3.1 permits a wider numeric range.
   - Browser language should be normalized/truncated according to BCP 47 behavior where older field limits require it.
   - Browser IP address in `AReq` should be the public IP of the browser connecting to the 3DS Requestor, not an arbitrary proxy or private address when avoidable.

7. **HTTP errors versus EMV `Erro` messages**
   - Normal 3DS message exchanges expect HTTP `200`, but lower-layer HTTP errors remain valid for non-protocol failures.
   - Use HTTP-layer errors for method mismatch, unsupported media type, rate limiting, malformed transport input, and defensive request rejection before a 3DS message can be processed.
   - Use EMV `Erro` when a recognizable 3DS message fails protocol validation and the transaction/message context can be identified.
   - Do not recursively respond to an invalid received `Erro`; if needed, close the local transaction and log the malformed error.

8. **Browser `CReq` ownership**
   - In browser flow, the 3DS Server is responsible for creating and Base64url-encoding `CReq`, then posting it through the Cardholder Browser to the ACS URL from `ARes`.
   - The 3DS Requestor may perform this mechanically, but the 3DS Server operator remains responsible for ensuring the requirements are met.

9. **Challenge timeout behavior**
   - For v2.3.1, do not depend on ACS posting a timeout `CRes` to the notification URL after challenge timeout; that older behavior was removed.
   - Final challenge outcome should be driven by `RReq`/`RRes` result handling and local challenge timers.
   - If an unexpected `RReq` arrives when prior `ARes.transStatus` was not `C`, `D`, or `S`, return the appropriate protocol error path; v2.3.1.1 clarifies Error Code `313`, while v2.2.0 deployments may map to `301`.

10. **Challenge iframe updates**
    - Challenge iframe settings are not merely best practice; they are requirements in current Core Spec profiles.
    - Include the WebAuthn/SPC permissions needed by current guidance, including `publickey-credentials-get` and `publickey-credentials-create` where supported.
    - Add `allow-popups` only for wallet/digital-ID style authentication methods that need Universal/App Links; do not use pop-ups for ordinary OTP challenges.

11. **3DS Method hidden execution**
    - The 3DS Method must remain hidden and should not require cardholder interaction.
    - The ACS should return appropriate HTML content type for the iframe interaction; the simulator should test this so merchant integrations do not accidentally expose the Method UI.

12. **Soft-decline challenge indicator**
    - For issuer soft-decline flows in v2.3.1, the 3DS Server may need to set `threeDSRequestorChallengeInd = 13` when the issuer requested a challenge before authorization proceeds.
    - Model this as a merchant/requestor input state, not as an issuer decision made by the open-source simulator.

13. **OReq/ORes timeout sequencing**
    - Deferred `OReq`/`ORes` support should include the FAQ's 3-second default timeout, DS-specified alternatives, sequence-number ordering, and Error Code `402` behavior for timeout failures.
    - Because `OReq` can be independent of a payment transaction, it needs an operational-message state path separate from authentication transactions.

### 1.6 Concrete 3DS Server Subsystems Required

A real codebase should not begin as a single web handler. The Core Spec implies these subsystems:

1. **Requestor/Merchant Registry**
   - Stores `threeDSRequestorID`, merchant name, merchant country, MCC, notification URLs, callback URLs, authentication credentials, allowed origins, and DS registration metadata.

2. **DS Registry and Routing Layer**
   - Maps card ranges/payment systems to DS endpoints, DS certificates, supported protocol versions, and test/production profiles.
   - Supports co-badged routing policy when multiple DS URLs match the same account range.

3. **PReq/PRes Card-Range Store**
   - Stores card ranges, serial numbers, ACS protocol versions, DS protocol versions, ACS Method URLs, ACS Information Indicators, Card Range Data File URLs, and cache validity state.
   - Supports full-file card-range download and precedence rules when a file URL is provided.

4. **Version Negotiator**
   - Chooses the highest mutually supported message version using 3DS Server support, DS protocol versions, and ACS protocol versions.
   - Uses an active-version policy source rather than hard-coding obsolete version assumptions.

5. **Transaction State Store**
   - Persists `threeDSServerTransID`, requestor transaction context, card-range lookup result, Method status, selected message version, `AReq` state, `ARes` state, challenge state, result state, timeout deadlines, and final merchant-facing outcome.

6. **3DS Method Orchestrator**
   - Generates Method setup data, receives Method notifications, applies 5-second completion handling, applies 10-minute reuse logic, and sets `threeDSCompInd`.

7. **AReq Builder and Validator**
   - Builds Table B.1-compliant `AReq` with version-gated fields, validates required/conditional elements, and rejects incomplete data before DS transmission.
   - Applies UTC conversion, browser IP source policy, browser language normalization, color-depth normalization, and challenge-indicator rules such as issuer soft-decline value `13`.

8. **DS Client**
   - Sends `PReq`, `AReq`, and `RRes`; receives `PRes`, `ARes`, `RReq`, and `Erro`; enforces secure-link policy and timeout handling.

9. **ARes Result Mapper**
   - Converts ACS/DS response outcomes into merchant-facing states without hiding protocol details.

10. **Browser Challenge Controller**
    - Creates browser challenge POST data, tracks challenge state, receives challenge completion notification, and waits for/handles `RReq` where applicable.

11. **RReq/RRes Controller**
    - Validates final result messages, updates transaction state, informs merchant/requestor environment, and sends `RRes` acknowledgement.

12. **Erro Controller**
    - Generates and parses EMV 3DS Error messages; maps unknown message, invalid field, missing field, timeout, and transport errors into explicit local states.

13. **Audit and Redaction Layer**
    - Logs required state transitions and message metadata while redacting account/cardholder data, transaction identifiers, URLs, and authentication values by default.

14. **Simulator Adapter Layer**
    - Keeps mock DS and mock ACS behavior outside the production 3DS Server code path through traits and feature flags.

15. **Operational Message Controller**
    - Deferred controller for `OReq`/`ORes` with independent operational-message state, sequence handling, 3-second default timeout behavior, DS-specific timeout alternatives, and Error Code `402` behavior.

## 2. Correct Open-Source Scope

### Component Boundary

This project should be described as:

```text
Merchant / 3DS Requestor
        ↓
Open-source Rust 3DS Server     ← real project component
        ↓
Local Mock Directory Server     ← simulator only
        ↓
Local Mock ACS                  ← simulator only
```

A production deployment would replace the mock DS/ACS with card-network and issuer infrastructure after certification and onboarding:

```text
Merchant / 3DS Requestor
        ↓
Certified 3DS Server
        ↓
Payment-system Directory Server
        ↓
Issuer Access Control Server
```

### In Scope

The following are appropriate and valuable to open source:

- Strict Rust message models for EMV 3DS 2.x JSON messages.
- Schema validation and constrained data types.
- Base64url helpers and JSON form-post helpers.
- Browser 3DS Method simulator.
- Browser challenge simulator.
- Local mock Directory Server for simulator/testing only.
- Local mock Access Control Server for simulator/testing only.
- Merchant demo checkout.
- 3DS Server state-machine implementation.
- HAR/privacy analyzer for 3DS browser flows.
- Trace redaction tooling.
- Documentation, diagrams, test vectors, and threat models.
- Certification-readiness checklists.

### Out of Scope for an Uncertified Open-Source Release

The following should not be claimed unless actually completed through the proper schemes and standards bodies:

- Real Visa/Mastercard/Amex/Discover Directory Server connectivity.
- EMVCo-approved production 3DS Server status.
- PCI 3DS compliance.
- Production liability shift or scheme acceptance guarantees.
- Real `Authentication Value` / CAVV / AAV generation.
- Production tokenization or PAN vaulting.
- Real issuer ACS decisioning.
- Real cardholder authentication.
- Claims that simulator responses represent actual issuer risk behavior.

## 3. Recommended Repository Structure

```text
open3ds-rs/
  Cargo.toml
  README.md
  SECURITY.md
  LICENSE
  crates/
    three-ds-protocol/
      src/
        lib.rs
        types/
        messages/
        validation/
        codec/
        crypto/
    three-ds-server/
      src/
        main.rs
        routes/
        state/
        merchant_api/
        browser_flow/
        ds_client/
    three-ds-simulator/
      src/
        mock_ds/
        mock_acs/
        scenarios/
    three-ds-har-analyzer/
      src/
        main.rs
        parser/
        detectors/
        redaction/
  sdk/
    open-3ds.js
  docs/
    architecture.md
    message-models.md
    browser-flow.md
    challenge-flow.md
    method-data.md
    privacy-threat-model.md
    compliance-boundaries.md
    certification-roadmap.md
  examples/
    merchant-demo/
    docker-compose.yml
  tests/
    fixtures/
    conformance/
    browser/
```

## 4. Milestone 1: Core Protocol Engine

Timeline: Months 1--2

Goal: Build `three-ds-protocol`, a reusable Rust library crate for message modeling, serialization, deserialization, validation, and safe handling of EMV 3DS protocol data.

### 4.1 Message Types to Implement First

Implement messages in the order needed by a browser-based 3DS Server. Prioritize 3DS Server-owned messages first, then messages the server receives or the simulator must emulate:

1. `PReq`
2. `PRes`
3. `AReq`
4. `ARes`
5. `CReq`
6. `CRes`
7. `RReq` received from ACS via DS in result flows
8. `RRes` sent by the 3DS Server in response to `RReq`
9. `Erro`

The Core Spec identifies `AReq` as the initial authentication message formed by the 3DS Server. It can contain cardholder, payment, and device information. `ARes` is the issuer ACS response and can indicate authenticated, attempted, rejected, unable, challenge required, decoupled required, or other outcomes depending on version and flow.

### 4.2 Rust Modeling Rules

Use strict Rust types instead of plain `String` wherever possible.

Examples:

```rust
pub struct ThreeDsServerTransId(uuid::Uuid);
pub struct Iso4217Numeric(String); // exactly 3 ASCII digits
pub struct CountryCodeAlpha2(String); // exactly 2 uppercase ASCII letters
pub struct MessageVersion(String); // e.g. 2.1.0, 2.2.0, 2.3.1
pub struct Base64UrlJson(String);
```

Recommended validation approach:

- Use `serde` for JSON serialization/deserialization.
- Use newtype wrappers for constrained strings.
- Implement `TryFrom<&str>` for every constrained type.
- Implement custom `Deserialize` for fields where invalid values must fail immediately.
- Keep unknown extension data in explicit extension containers, not silent catch-all maps unless needed.

### 4.3 Message Categories and Channels

Represent key enumerations as Rust enums:

```rust
pub enum DeviceChannel {
    App,
    Browser,
    ThreeRI,
}

pub enum MessageCategory {
    PaymentAuthentication,
    NonPaymentAuthentication,
}

pub enum ThreeDsCompInd {
    Completed,
    NotCompleted,
    Unavailable,
}

pub enum TransactionStatus {
    Authenticated,
    AttemptsPerformed,
    ChallengeRequired,
    DecoupledRequired,
    NotAuthenticated,
    Rejected,
    Unable,
}
```

Do not hard-code scheme-specific semantics into the generic protocol crate. For example, keep `Authentication Value (AV)` generic. Scheme-specific terms such as CAVV or AAV belong in optional payment-system adapters.

### 4.4 Browser Information Model

The browser model is central to 3DS privacy/security research. Model browser fields with source annotations:

- Browser accept header.
- Browser IP address.
- Java enabled indicator.
- JavaScript enabled indicator.
- Browser language.
- Screen color depth.
- Screen height.
- Screen width.
- Browser timezone.
- Browser user agent.

Add metadata to distinguish:

- Collected by merchant page.
- Collected by 3DS Method.
- Provided by merchant backend.
- Derived by network infrastructure.

This makes the library useful for trust-boundary analysis.

### 4.5 Codec Helpers

Implement helpers for:

- JSON serialization.
- JSON canonical validation where needed.
- Base64 encoding.
- Base64url encoding.
- Base64url-encoded JSON form fields.
- Browser POST payload construction for `threeDSMethodData` and browser challenge messages.
- UTC date/time conversion helpers for purchase and risk timestamps.
- Browser normalization helpers for IP address source, language, color depth, and legacy-version limits.
- HTTP envelope helpers for `Content-Type`, `X-Request-ID`, and `X-Response-ID`.
- 3-D Secure array validation, including duplicate-element rejection.
- Bounded `messageExtension` parsing with critical-extension handling.

The spec distinguishes Base64 and Base64url handling. Treat this as a first-class module, not as scattered helper functions.

### 4.6 Crypto Module

The Core Spec and related 3DS ecosystem use cryptographic protection in specific links and contexts, but an open-source research server should avoid pretending to perform production scheme cryptography or production card-network trust establishment.

Implement the module in layers:

1. `crypto-traits`: signing/encryption interfaces.
2. `crypto-local`: local test keys for mock DS/ACS.
3. `crypto-jose`: optional JOSE/JWS/JWE support where required by selected profiles, test fixtures, or future certification-preparation work.
4. `crypto-null`: explicit simulator-only mode that is impossible to enable in production builds without a feature flag.

Recommended crates:

- `serde`
- `serde_json`
- `uuid`
- `time`
- `thiserror`
- `base64`
- `ring` or `aws-lc-rs` for primitives
- `josekit` only if JOSE/JWS/JWE ergonomics are needed and license/security review passes

Do not implement custom crypto primitives.

### 4.7 Milestone 1 Deliverables

- `three-ds-protocol` crate.
- Strict message structs for `PReq`, `PRes`, `AReq`, `ARes`, `CReq`, `CRes`, `RReq`, `RRes`, `Erro`; defer `OReq`/`ORes` until after the browser MVP.
- HTTP envelope types for content type and request/response correlation headers.
- Message-extension and 3-D Secure array validators.
- PRes/card-range validators, including ACS Information Indicator and file-download metadata.
- A field-presence model for required, optional, and conditional data elements per message version.
- A source/owner model for data elements: 3DS Server, 3DS Requestor, Browser, DS, ACS, or simulator.
- Validation errors with precise field paths.
- Round-trip JSON tests.
- Negative validation tests.
- Example browser frictionless fixture.
- Example browser challenge fixture.
- Documentation explaining which fields are generic EMV 3DS and which are scheme-specific.

## 5. Milestone 2: 3DS Server Runtime and Browser Flow

Timeline: Months 3--4

Goal: Build a Rust web service that acts as the merchant-side 3DS Server **against local mock DS/ACS services first**. The mock DS/ACS are test fixtures, not product components intended to replace real card-network or issuer systems.

### 5.1 Axum Runtime

Use:

- `axum`
- `tokio`
- `tower-http`
- `tracing`
- `tracing-subscriber`
- `serde_json`
- `redis` or in-memory state for local mode

Initial routes:

```text
POST /v2/authenticate
GET  /v2/transactions/{threeDSServerTransID}
POST /v2/3ds-method/notification
POST /v2/challenge/notification
POST /v2/results/notification
GET  /healthz
```

These are merchant-facing and simulator-facing API names. The exact production endpoint shape should be separated from protocol message names so users do not confuse local REST API design with EMV 3DS wire-level message names.

Avoid naming a route `/v2/challenge-callback` as if the banking system directly calls the merchant 3DS Server in all cases. Browser challenge and result handling differ by flow. Keep route names aligned with protocol roles.

### 5.2 Transaction State Machine

Implement a typed state machine:

```text
Created
CardRangeLookupRequired
MethodAvailable
MethodRunning
MethodCompleted
MethodUnavailable
MethodTimedOut
AReqReady
AReqSent
AResReceived
FrictionlessAuthenticated
AttemptsAuthenticated
ChallengeRequired
ChallengeRunning
ChallengeCompleted
DecoupledRequired
ResultReceived
Rejected
Unable
Errored
Expired
```

Every transition must be explicit and logged.

### 5.3 PReq/PRes Cache

The 3DS Server uses DS-provided `PRes` data to determine card-range participation, supported protocol versions, and the ACS 3DS Method URL where available.

Build:

- `CardRangeCache` trait.
- In-memory cache for local simulator.
- Redis-backed cache for distributed mode.
- Expiry handling based on DS-provided validity metadata where available.

### 5.4 Browser 3DS Method Handling

The 3DS Method flow should be represented accurately:

1. Server returns setup data to merchant page.
2. Merchant page creates hidden iframe.
3. Browser posts `threeDSMethodData` to the ACS 3DS Method URL.
4. ACS posts completion notification to the 3DS Method notification URL.
5. 3DS Server records `threeDSCompInd`.

The JavaScript SDK should **not** claim to collect arbitrary device fingerprinting for production. In real EMV 3DS, the ACS controls what it gathers through its 3DS Method URL. The merchant-side SDK should orchestrate iframe/form-post mechanics and collect only the browser fields the 3DS Server must place into `AReq`. Optional research telemetry belongs in a separate, consented lab-only collector.

Recommended split:

- `open-3ds.js`: protocol orchestration only.
- `open-3ds-lab-collector.js`: optional research-only browser API observation tool.

### 5.5 Browser SDK Responsibilities

`open-3ds.js` should:

- Request transaction setup from the 3DS Server.
- Create a hidden iframe for 3DS Method when `threeDSMethodURL` is present.
- POST Base64url-encoded `threeDSMethodData` to the ACS Method URL.
- Wait for notification or timeout.
- Report method completion status to the merchant backend / 3DS Server.
- Render or initiate the browser challenge iframe/form when `transStatus = C`, using only simulator ACS endpoints unless the implementation is certified and onboarded.

It should not:

- Scrape sensitive page data.
- Collect more browser data than needed in production mode.
- Send card numbers.
- Hide research collection from users.

### 5.6 State TTLs

Use transaction-specific timers; do not treat one TTL as universal. The 3DS Method completion timeout, challenge windows, RReq/result windows, and local audit retention are distinct. Implement configurable timers:

- 3DS Method completion wait: default 5 seconds.
- Challenge transaction state: configurable for simulator and tests.
- RReq/result wait: configurable for simulator and tests.
- Transaction audit retention: configurable local-only retention.
- Idempotency window: configurable.

### 5.7 Milestone 2 Deliverables

- `three-ds-server` Axum service.
- Merchant/requestor registry.
- DS registry and routing abstraction.
- Browser setup endpoint.
- `PReq`/`PRes` card-range cache integration.
- Card Range Data file-download support and validation.
- Co-badged card routing policy layer.
- Version negotiator using 3DS Server, DS, and ACS protocol-version lists.
- 3DS Method orchestration.
- `AReqBuilder` with required/conditional field validation.
- UTC timestamp conversion and browser field normalization.
- DS-profile and market-profile conditional-field rule support.
- HTTP envelope validation for content type and request/response correlation headers.
- Browser Method callback decoder and transaction binder.
- Browser challenge iframe/sandbox/fallback implementation, including WebAuthn/SPC permission attributes where supported.
- Challenge-timeout behavior driven by local timers and `RReq`, not timeout `CRes` assumptions.
- `AResHandler` with explicit `transStatus` mapping, including unsupported SPC handling.
- Duplicate `RReq` detection and final-result latch.
- Transaction state machine.
- In-memory and Redis state stores.
- Merchant demo page.
- End-to-end mock frictionless flow.
- End-to-end mock challenge flow.
- Full tracing logs with redaction.

## 6. Milestone 3: Simulator, Mock DS, and Mock ACS

Timeline: Months 5--6

Goal: Build a self-contained local test network so developers can study 3DS Server behavior without real cards, real payment-system DS connectivity, or live issuer ACS infrastructure.

### 6.1 Mock Directory Server

The mock DS should:

- Accept `PReq` and return `PRes` card-range data.
- Accept `AReq` and validate message shape.
- Route `AReq` to the local mock ACS.
- Forward `ARes` back to the 3DS Server.
- Return controlled protocol errors.
- Simulate unsupported version, non-participating range, malformed message, timeout, and DS rejection.

### 6.2 Mock ACS

The mock ACS should:

- Serve a mock 3DS Method endpoint.
- Receive `threeDSMethodData`.
- Notify the 3DS Method notification URL.
- Receive `AReq` from mock DS.
- Return deterministic `ARes` responses.
- Serve a browser challenge page.
- Return browser challenge completion data and generate mock `RReq`/`RRes` result flows where applicable.

### 6.3 Scenario Engine

Use scenario files:

```yaml
name: frictionless_success
card_range: "411111"
method_url: true
method_behavior: completes
ares:
  transStatus: Y
  eci: "mock"
  authenticationValue: "mock-av"
```

Example scenarios:

- Frictionless success: `transStatus = Y`.
- Attempts: `transStatus = A`.
- Challenge required: `transStatus = C`.
- Unable: `transStatus = U`.
- Rejected: `transStatus = R`.
- Method unavailable: `threeDSCompInd = U`.
- Method timeout: `threeDSCompInd = N`.
- Decoupled required: `transStatus = D`.
- DS validation error.
- ACS validation error.

### 6.4 Use Synthetic Account Identifiers Only

Use obviously synthetic account identifiers in the simulator. Avoid publishing values that look like live card testing advice. Mark all examples as non-network test identifiers, and do not imply that any scenario maps to real issuer behavior.

### 6.5 Milestone 3 Deliverables

- `three-ds-simulator` crate.
- Mock DS with `PReq`/`PRes`, `AReq`/`ARes`, `RReq`/`RRes`, and `Erro` paths.
- Mock DS card-range file-download mode.
- Mock co-badged card-range routing scenarios.
- Deferred mock `OReq`/`ORes` path for v2.3.1 operational-message testing.
- Mock ACS with Method endpoint, deterministic `ARes`, browser challenge, and result generation.
- YAML scenario loader.
- Docker Compose sandbox.
- Integration tests for every main flow.
- Browser screenshots / HAR examples from simulated flows.

## 7. Milestone 4: Privacy and HAR Measurement Toolkit

Timeline: Months 6--7

Goal: Build research tooling that supports PETS/SOUPS/IMC-style privacy analysis of browser-based 3DS flows.

### 7.1 HAR Analyzer

The analyzer should parse HAR files and detect:

- Hidden iframe creation.
- Form POSTs to 3DS Method endpoints.
- `threeDSMethodData` fields.
- ACS domains.
- DS or scheme-related domains.
- PSP / 3DS Server domains.
- Challenge iframe or top-level redirects.
- Cookies set by third-party authentication domains.
- LocalStorage / sessionStorage if captured by browser instrumentation.
- JavaScript resource domains.
- Referrer leakage.
- Query-string identifiers.

### 7.2 Browser API Detector

For simulator and consented research flows only, instrument access to:

- Canvas.
- WebGL.
- AudioContext.
- Fonts where observable.
- Screen dimensions.
- Timezone.
- Language.
- Hardware concurrency.
- Device memory.
- Permissions API.
- Battery/sensor APIs if available.

Clearly separate:

- What the merchant/3DS Server collects.
- What the ACS iframe collects.
- What is merely exposed by the browser.

### 7.3 Redaction Tool

The redactor should remove or hash:

- PAN-like digit sequences.
- Names.
- Email addresses.
- Phone numbers.
- Billing/shipping addresses.
- Transaction IDs.
- `threeDSServerTransID` values.
- ACS transaction IDs.
- DS transaction IDs.
- Notification URLs.
- Raw Base64url message bodies unless explicitly decoded and sanitized.

### 7.4 Milestone 4 Deliverables

- `three-ds-har-analyzer` CLI.
- Redaction profiles.
- Example sanitized HAR dataset from simulator.
- Dataset schema.
- Privacy taxonomy.
- Research ethics guide.

## 8. Milestone 5: Production 3DS Server Auditor

Timeline: Month 8+

Goal: Build a safe, consent-based auditor that helps merchants, PSPs, and security teams evaluate a production 3DS Server integration without pretending to certify it, attack live issuers, or bypass card-network onboarding.

### 8.1 Auditor Positioning

The auditor should be framed as:

> A defensive validation and observability tool for checking whether a merchant's browser 3DS integration and 3DS Server behaviour are protocol-shaped, privacy-aware, and operationally safe.

It should not be framed as:

> A scanner for arbitrary merchants, a way to test live card-network endpoints without permission, an EMVCo certification substitute, or a tool for probing issuer ACS infrastructure.

### 8.2 Auditor Modes

Implement three modes with strict guardrails:

1. **Offline Evidence Review**
   - Input: sanitized HAR files, redacted server logs, JSON message samples, screenshots, and configuration exports.
   - Output: protocol-shape findings, missing-field warnings, privacy observations, timeout/state-machine issues, and redaction quality checks.
   - This is the safest default mode and should be usable without touching production systems.

2. **Merchant-Owned Staging Probe**
   - Input: explicit target allowlist, staging merchant URL, test card/account identifiers supplied by the merchant/PSP, and written authorization.
   - Output: browser-flow trace, iframe/Method/challenge observations, headers, callback timing, and state transition report.
   - This mode must refuse non-allowlisted domains and must never generate real purchase traffic.

3. **Production Passive Monitor**
   - Input: merchant-side telemetry collected by an approved integration: redacted callbacks, timing events, CSP/reporting data, script inventory, iframe attributes, and transaction-state metadata.
   - Output: aggregate health metrics and compliance-oriented warnings.
   - This mode should not initiate authentication attempts or send synthetic traffic to live DS/ACS endpoints.

### 8.3 Auditor Checks

The auditor can check:

- Browser setup returns a stable `threeDSServerTransID` and expected Method/challenge setup fields.
- 3DS Method iframe is hidden, form-posted correctly, and callback timing is recorded.
- `threeDSMethodData` is Base64url JSON and binds to the expected transaction.
- Browser `AReq` fields are present, normalized, and version-gated where evidence is available.
- Browser public IP source is documented and not obviously private/internal.
- Challenge iframe uses required iframe/sandbox attributes and appropriate WebAuthn/SPC permissions.
- Challenge flow does not rely on timeout `CRes` for v2.3.1 finality.
- `RReq/RRes` finality is represented in logs or merchant-facing state.
- Duplicate-result and unexpected-result handling is visible in state-machine logs.
- HTTP errors and EMV `Erro` messages are separated correctly.
- Logs redact PAN-like values, authentication values, transaction IDs, notification URLs, names, emails, phone numbers, and addresses.
- Card-range/PRes evidence includes protocol versions, ACS Information Indicators, file-download handling where applicable, and co-badged routing decisions where applicable.
- Merchant integration distinguishes authentication from authorization and does not treat any parseable `ARes` as automatically successful.

### 8.4 Auditor Non-Goals

The auditor must not:

- Probe arbitrary production merchant checkouts without explicit authorization.
- Submit real PANs, real payments, or live authentication attempts.
- Attempt to fuzz, stress, exploit, or bypass issuer ACS or DS infrastructure.
- Claim EMVCo approval, PCI 3DS compliance, PCI DSS compliance, or liability-shift eligibility.
- Store raw PAN, CAVV/AAV/authentication values, cardholder PII, or raw unredacted HAR files by default.
- Provide test-card guidance that could be mistaken for live network testing advice.

### 8.5 Auditor Architecture

Recommended crates/tools:

```text
crates/three-ds-auditor/
  src/
    main.rs
    evidence/
      har.rs
      logs.rs
      screenshots.rs
      config.rs
    checks/
      method.rs
      challenge.rs
      messages.rs
      headers.rs
      privacy.rs
      state_machine.rs
      card_range.rs
    report/
      finding.rs
      markdown.rs
      json.rs
      sarif.rs
    policy/
      allowlist.rs
      authorization.rs
      severity.rs
```

Outputs:

- Human-readable Markdown audit report.
- Machine-readable JSON report.
- SARIF output for CI/security dashboards.
- Redacted evidence bundle with hashes linking findings to evidence without exposing raw sensitive values.

### 8.6 Auditor Finding Categories

Use stable categories:

- `protocol.correctness`
- `browser.method`
- `browser.challenge`
- `message.validation`
- `state.finality`
- `transport.headers`
- `privacy.redaction`
- `card_range.routing`
- `version.profile`
- `compliance.boundary`
- `observability.logging`

Each finding should include:

- Severity: `info`, `low`, `medium`, `high`, `critical`.
- Confidence: `low`, `medium`, `high`.
- Evidence reference: redacted line, HAR entry, event ID, or screenshot hash.
- Spec/FAQ rationale when available.
- Safe remediation guidance.
- Whether the finding is blocking for the project's own simulator conformance.

### 8.7 Auditor Deliverables

- `three-ds-auditor` CLI.
- HAR/log/config evidence parsers.
- Redaction-first evidence model.
- Browser Method and challenge checks.
- Message-shape checks using `three-ds-protocol`.
- State-machine/finality checks for frictionless, challenge, timeout, and unexpected-result flows.
- Card-range/routing evidence checks.
- Markdown, JSON, and SARIF reports.
- Example audit report generated from the local simulator only.
- Authorization and responsible-use policy in `docs/auditor-safety.md`.

## 9. Milestone 6: Certification-Readiness and Production Boundaries

Timeline: Month 9+

Goal: Make the project useful for teams preparing for real certification without misleading users.

### 9.1 Certification Checklist

Create docs for:

- EMVCo product approval boundary.
- PCI 3DS scope.
- Key management requirements.
- Scheme onboarding requirements.
- DS endpoint onboarding.
- Message version management.
- Audit logging.
- Incident response.
- Secure SDLC.
- Penetration testing.
- Dependency review.

### 9.2 Production Feature Flags

Use compile-time and runtime guards:

- `simulator` feature.
- `mock_crypto` feature.
- `unsafe_lab_collector` feature.
- `spc_experimental` feature for explicit Secure Payment Confirmation experiments.
- `oreq_ores` feature for deferred operation-message support.
- `production` profile that refuses mock cryptography and simulator DS endpoints.

### 9.3 Compliance Warnings

Every README should include:

> This project is not an EMVCo-approved 3DS Server and does not provide production card-network connectivity or liability shift. It is a research, education, simulator, and certification-preparation toolkit.

## 10. Recommended First Code to Write

Target protocol versions in phases:

1. Implement the smallest browser-payment subset for one active version first, preferably `2.3.1` for the current documentation set or `2.2.0` for compatibility testing.
2. Add explicit version gates for fields that differ across active supported versions; do not spend MVP effort on `2.1.0` now that testing support has been sunset.
3. Avoid a single permissive struct that accepts every version's fields without validation; that hides exactly the mistakes a 3DS Server must catch.

Start with the protocol crate, not the browser fingerprinting wrapper.

Reason:

- The protocol crate is the safest and most reusable foundation.
- It avoids privacy/legal concerns at the beginning.
- It anchors the project in the Core Spec.
- It makes every later service testable.
- It is strong evidence of systems-building ability for PhD applications.

First files:

```text
crates/three-ds-protocol/src/lib.rs
crates/three-ds-protocol/src/types/mod.rs
crates/three-ds-protocol/src/types/ids.rs
crates/three-ds-protocol/src/types/codes.rs
crates/three-ds-protocol/src/messages/mod.rs
crates/three-ds-protocol/src/messages/areq.rs
crates/three-ds-protocol/src/messages/ares.rs
crates/three-ds-protocol/src/validation/error.rs
```

First implemented types:

- `ThreeDsServerTransId`
- `AcsTransId`
- `DsTransId`
- `MessageVersion`
- `MessageType`
- `DeviceChannel`
- `MessageCategory`
- `TransactionStatus`
- `ThreeDsCompInd`
- `BrowserInfo`
- minimal `AReq`
- minimal `ARes`

### 10.1 Browser-First Implementation Checklist

Before claiming the browser 3DS Server MVP is protocol-shaped, verify these behaviours with simulator tests:

- **Preparation:** `PReq/PRes` cache handles default DS protocol versions, ACS/DS protocol version lists, ACS Method URLs, ACS Information Indicators, serial numbers, and Card Range Data file-download URLs.
- **Routing:** card-range resolution can return multiple DS candidates for co-badged ranges and records which routing policy selected the DS.
- **Setup:** browser setup returns the immutable `threeDSServerTransID`, selected protocol-version inputs, and Method URL if available.
- **Method:** Method form POST contains Base64url JSON with `threeDSServerTransID` and `threeDSMethodNotificationURL`; callback decoding validates transaction binding before setting `threeDSCompInd`.
- **AReq:** builder performs UTC conversion, browser public-IP selection, language normalization, color-depth normalization, conditional-field profile checks, and version-gated field validation.
- **Transport:** outbound DS messages include expected HTTP method, content type, request/response correlation headers, timeout handling, and TLS/mTLS policy hooks.
- **ARes:** handler validates identifiers and message version, maps every `transStatus`, rejects unknown statuses, and marks SPC/`S` unsupported unless `spc_experimental` is enabled.
- **Challenge:** browser challenge uses server-created Base64url `CReq`, HTTP POST to ACS URL, allowed challenge-window size, required iframe/sandbox attributes, WebAuthn/SPC permissions where supported, and JavaScript-disabled fallback.
- **Challenge finality:** challenge timeout and final outcome rely on local timers plus `RReq/RRes`; do not rely on ACS timeout `CRes` for v2.3.1 behaviour.
- **Results:** `RReq` is accepted only after `ARes.transStatus` values that permit a later result (`C`, `D`, or experimental `S`); duplicate `RReq` returns the duplicate-result error path.
- **Errors:** distinguish HTTP-layer rejection from EMV `Erro`; never recursively respond to a malformed inbound `Erro`.
- **Deferred operations:** `OReq/ORes` has a separate operational-message path with sequence handling and timeout behaviour, not mixed into authentication transaction state.

## 11. Research Contribution Framing

The strongest academic framing is not "we built a free PAAY." A safer and more publishable framing is:

> We built an open-source Rust research stack for EMV 3DS 2.x browser-flow simulation, protocol validation, and privacy measurement, enabling reproducible analysis of 3DS Method, challenge flow, and merchant/issuer trust boundaries without live card-network access.

Potential paper title:

> Open3DS-RS: An Open-Source 3DS Server and Local Testbed for EMV 3-D Secure 2.x Browser Authentication Research

Possible venues:

- PETS / PoPETs if focused on hidden browser data collection and privacy.
- SOUPS if focused on user transparency and consent.
- IMC if scaled into a large measurement dataset.
- RAID / ACSAC if focused on practical security analysis.
- Euro S&P if the work finds a strong systematic security/privacy weakness.

## 12. Key Risks and Mitigations

### Risk: Accidentally implying production readiness

Mitigation: Use clear naming: `lab`, `simulator`, `research`, `reference`, `certification-preparation`.

### Risk: Privacy-invasive browser collection

Mitigation: Split production protocol orchestration from opt-in lab instrumentation.

### Risk: PAN handling scope creep

Mitigation: Do not support raw PAN in the default demo. Use synthetic tokens and simulator-only card identifiers.

### Risk: Crypto mistakes

Mitigation: Do not implement primitives. Use reviewed crates, test vectors, feature flags, and external audits before any production claim.

### Risk: Certification misunderstanding

Mitigation: Document that EMVCo approval and scheme onboarding are separate from open-source code availability.

## 13. Final Recommended Launch Strategy

Launch in four public phases:

1. **Protocol crate release**: strict EMV 3DS message models and validators.
2. **Simulator release**: local merchant + mock DS + mock ACS + browser flows.
3. **Research toolkit release**: HAR analyzer, redactor, privacy taxonomy, and paper draft.
4. **Auditor release**: consent-based production/staging auditor for evidence review, browser-flow checks, and redacted reporting.

Suggested README tagline:

> Open3DS-RS is an open-source Rust 3DS Server with local DS/ACS simulators for EMV 3-D Secure 2.x protocol modeling, browser-flow testing, and privacy/security research. It is not a certified production 3DS Server and does not include real card-network connectivity.