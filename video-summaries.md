# EMV 3DS LinkedIn Series: Voiceover Video Summaries

Use these as short voiceover scripts for videos attached to each LinkedIn article. Each video should feel like a concise summary, not a full lecture. Aim for 60--90 seconds per video.

---

## Part 1: Architectural Foundations of EMV 3DS

**Video goal:** Explain why the three-domain model matters before analyzing protocol messages.

**Voiceover script:**

Most people think of 3D Secure as the bank pop-up or challenge screen during checkout.

But that is only the visible part of the system.

EMV 3DS is actually a distributed authentication protocol built around three domains: the Acquirer Domain, the Interoperability Domain, and the Issuer Domain.

The Acquirer Domain is closest to the merchant and the user's browser. This is where checkout data, browser telemetry, and device signals first enter the flow.

The Interoperability Domain is controlled by the card schemes. Its Directory Server validates and routes authentication messages between the merchant side and the issuer side.

The Issuer Domain is controlled by the cardholder's bank. This is where the Access Control Server evaluates risk and decides whether the transaction can continue frictionlessly or needs a challenge.

For security research, this architecture matters because each domain has a different trust level. If we do not know who creates data, who validates it, and who makes the final decision, we cannot properly threat-model the protocol.

This first part is the foundation. In the next part, we will follow the AReq and ARes messages through these domains and start looking at the actual authentication handshake.

**On-screen bullets:**

- 3DS is not just a checkout pop-up
- Three domains: Acquirer, Interoperability, Issuer
- Each domain has different trust boundaries
- Architecture comes before protocol analysis

---

## Part 2: AReq and ARes Message Flow

**Video goal:** Preview how the authentication request and response move through the system.

**Voiceover script:**

In Part 1, we mapped the three domains behind EMV 3DS.

Now the next question is: how does the actual authentication request move through that architecture?

The key messages are AReq and ARes.

AReq stands for Authentication Request. It is created by the 3DS Server in the Acquirer Domain and contains transaction data, merchant information, device signals, and protocol metadata.

That request is routed through the Directory Server in the Interoperability Domain. The Directory Server validates the structure and sends it to the correct issuer Access Control Server.

The issuer then evaluates the request and returns an ARes, or Authentication Response.

This response tells the system whether the transaction is approved frictionlessly, requires a challenge, was rejected, or could not be authenticated.

The security question is not only what the messages contain. It is who owns each field, who is allowed to trust it, and how those fields affect the issuer's risk decision.

That is where protocol analysis begins.

**On-screen bullets:**

- AReq = Authentication Request
- ARes = Authentication Response
- Follow field ownership and trust
- `transStatus` drives the next step

---

## Part 3: Browser Surfaces and Iframes

**Video goal:** Explain why the browser layer deserves serious security attention.

**Voiceover script:**

One of the most overlooked parts of EMV 3DS is the browser surface.

A lot of 3DS analysis focuses on backend messages, but the browser is where important signals are collected and where challenges are displayed.

The 3DS Method can run inside a hidden iframe to collect device and browser telemetry. Later, the challenge flow may render issuer-controlled content in a challenge window.

That means researchers should ask browser-security questions.

What origins are involved? How are callbacks handled? What happens if the merchant page has compromised JavaScript? How are timeouts handled? Is the collected telemetry actually bound to the transaction being authenticated?

This does not mean the iframe is automatically vulnerable. It means it is a trust boundary.

If we treat 3DS as only a backend protocol, we miss one of its most important attack surfaces: the client-side environment where user-controlled data first enters the flow.

**On-screen bullets:**

- 3DS Method collects browser signals
- Challenge UI runs through browser surfaces
- Iframes are trust boundaries
- Callback and timeout behavior matter

---

## Part 4: Frictionless Flow Is a Security Decision

**Video goal:** Reframe frictionless authentication as issuer-side risk evaluation, not just better UX.

**Voiceover script:**

Frictionless flow is often described as a better user experience.

That is true, but incomplete.

In EMV 3DS, frictionless flow means the issuer decided there was enough confidence to authenticate the transaction without interrupting the cardholder.

That decision depends on transaction metadata, merchant context, device signals, account history, issuer policy, and risk scoring.

So the real question is not just: did the user avoid a challenge?

The better question is: what evidence did the issuer rely on to make that silent decision?

For researchers, frictionless flow is interesting because it depends on data quality and trust. If merchant metadata is incomplete, device telemetry is unreliable, or signals are not properly bound to the transaction, the risk decision can become weaker.

Frictionless authentication is not simply no authentication. It is authentication through risk analysis.

That distinction is critical.

**On-screen bullets:**

- Frictionless is not just UX
- It is issuer-side risk approval
- Signal quality matters
- Silent authentication still has trust assumptions

---

## Part 5: Challenge Flow Deep Dive

**Video goal:** Explain what happens when the issuer requires stronger verification.

**Voiceover script:**

When the issuer is not confident enough to approve a transaction frictionlessly, EMV 3DS can move into challenge flow.

This is the part users usually recognize: app approval, one-time passcode, biometric confirmation, or another bank-controlled verification step.

From a protocol perspective, challenge flow introduces additional messages, especially CReq and CRes.

CReq is the Challenge Request. CRes is the Challenge Response.

These messages coordinate the interaction between the cardholder, the issuer's Access Control Server, the merchant environment, and the 3DS infrastructure.

For security researchers, the challenge flow raises important questions.

How is the challenge rendered? How is completion signaled? What happens if the user abandons the flow? How are timeouts, retries, and failed challenges represented in the final transaction state?

Challenge flow is not just a user prompt. It is a state machine that must be correctly synchronized across multiple parties.

**On-screen bullets:**

- Challenge flow = step-up verification
- CReq and CRes coordinate the challenge
- Rendering and completion signals matter
- Treat it as a state machine

---

## Part 6: Security Research Checklist

**Video goal:** Provide a safe, ethical methodology for reviewing 3DS integrations.

**Voiceover script:**

When reviewing a 3DS integration, the goal is not to randomly poke at payment flows.

The goal is to build a safe, legal, and structured understanding of the system.

Start by mapping the parties: merchant, gateway, 3DS Server, Directory Server, and Access Control Server.

Then identify what data is collected, where it is created, and which party later trusts it.

Next, review the message flow. Look for AReq, ARes, CReq, CRes, RReq, and RRes states. Pay attention to status values, challenge outcomes, timeout behavior, and error handling.

On the browser side, inspect iframe behavior, callbacks, origins, and how challenge completion is handled.

Most importantly, stay within authorized environments: test cards, sandbox systems, internal logs, and approved scopes.

Good payment security research is not about bypassing live systems. It is about understanding trust boundaries and validating assumptions responsibly.

**On-screen bullets:**

- Map parties and trust boundaries
- Track message ownership
- Inspect browser callbacks and timeouts
- Use only authorized test environments

---

## Part 7: Advanced EMV 3DS Flows

**Video goal:** Introduce advanced features as new trust surfaces, not just product features.

**Voiceover script:**

Once the core EMV 3DS flow is clear, the next step is understanding advanced flows.

These include data-only authentication, delegated authentication, decoupled authentication, out-of-band approval, and message extensions.

Each feature exists to support different business and user-experience needs, but each one also changes the trust model.

For example, delegated authentication can shift more responsibility toward approved third parties. Decoupled authentication can separate the checkout session from the actual user verification moment. Message extensions can add new data that downstream systems may rely on.

For researchers, the key question is always the same: what changed in the trust boundary?

Who created the data? Who validated it? Who made the decision? And how is that decision bound back to the original transaction?

Advanced 3DS features are powerful, but they should be studied as protocol surfaces, not just implementation options.

**On-screen bullets:**

- Advanced flows change the trust model
- Data-only, delegated, decoupled, OOB
- Ask who creates and trusts each signal
- Bind decisions back to the transaction

---

## Reusable Video Ending

Use this closing line at the end of each video:

> If you are studying payment security, do not start with the pop-up. Start with the trust boundaries.
