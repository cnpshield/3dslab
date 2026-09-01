# Architectural Foundations of EMV 3DS 2.x

## Part 1: Mapping the Three Domains Behind 3D Secure

Most people experience 3-D Secure as a bank approval screen, a one-time passcode, or a short in-app confirmation during checkout.

That visible challenge is only the surface.

Underneath it, EMV 3DS 2.x is a distributed authentication protocol for card-not-present payments. Its purpose is to help merchants and issuers exchange enough transaction, device, and contextual data for the issuer to decide whether the cardholder can be authenticated silently or must complete a step-up challenge.

That is why the architecture matters.

Before analyzing `AReq`, `ARes`, challenge flows, frictionless approvals, or possible implementation weaknesses, we need to understand the three-domain model that the protocol is built on.

The “3D” in 3DS refers to three domains:

- **Acquirer Domain** — the merchant-side environment that initiates authentication.
- **Interoperability Domain** — the card-scheme routing and validation layer.
- **Issuer Domain** — the bank-controlled trust zone that makes the authentication decision.

For security researchers, this model is not just terminology. It is the threat map.

If you do not know who creates a field, who validates it, who forwards it, and who finally trusts it, you cannot properly reason about the protocol.

---

## Why Study EMV 3DS 2.x Architecture?

EMV 3DS is not just a fraud-control feature. It sits at the intersection of:

- card-not-present fraud prevention,
- browser and mobile authentication,
- risk-based decisioning,
- payment-network interoperability,
- issuer-side identity verification,
- and merchant-side user experience.

A good 3DS analysis starts with questions like:

- **Where does user-controlled data enter the flow?**
- **Which system turns checkout context into protocol messages?**
- **Which party validates message structure?**
- **Which party performs the risk decision?**
- **Where do trust boundaries appear between browser, merchant, scheme, and issuer?**

Once those questions are clear, the rest of the protocol becomes much easier to analyze.

---

## 1. Acquirer Domain: The Untrusted Edge

The Acquirer Domain is where the EMV 3DS flow begins.

This side includes the merchant checkout, payment gateway, acquirer-facing infrastructure, and the **3DS Server**.

From a threat-modeling perspective, this is the domain closest to the user-controlled environment. It receives browser signals, checkout metadata, account information, shipping details, transaction amount, device context, and other data points that may later influence issuer risk scoring.

### 3DS Method: Device and Browser Signal Collection

In browser-based flows, the 3DS Method may run through a hidden iframe. Its purpose is to allow issuer-side logic to collect device and browser information before the issuer decides whether the transaction should be frictionless or challenged.

This is important because the collected signals are not the final authentication decision. They are evidence used by the issuer’s risk engine.

The research question is not only: “Was device data collected?”

The better question is:

> Was the data reliable, fresh, correctly bound to this transaction, and safe for the issuer to trust?

### 3DS Server: Message Construction

The 3DS Server packages merchant-side and transaction-side data into protocol messages.

In a typical authentication flow, the 3DS Server creates the **Authentication Request (`AReq`)** and sends it toward the card-scheme infrastructure.

This makes the 3DS Server a critical normalization point. It transforms checkout context into structured EMV 3DS fields that downstream systems may use during risk evaluation.

For researchers, this is where field ownership starts to matter.

Some fields originate from the merchant. Some are produced by the 3DS Server. Some are controlled by the scheme or issuer. Treating all fields as equally trustworthy is a mistake.

---

## 2. Interoperability Domain: The Scheme-Controlled Router

The Interoperability Domain is operated by the card schemes, such as Visa, Mastercard, American Express, and other payment networks.

Its core component is the **Directory Server (`DS`)**.

The Directory Server acts as the routing and protocol-validation bridge between the merchant-side environment and the issuer-side environment.

It does not make the final cardholder-authentication decision. Instead, it helps ensure that the request is structurally valid, routed to the correct issuer, and processed according to the relevant EMV 3DS protocol version.

### Directory Server: Routing and Validation

The Directory Server receives the `AReq` from the Acquirer Domain, determines the appropriate issuer-side endpoint, and forwards the request to the issuer’s **Access Control Server (`ACS`)**.

It also plays an important role in protocol enforcement:

- validating message format,
- checking required fields,
- enforcing version-specific rules,
- supporting interoperability between participating systems,
- and routing messages across scheme infrastructure.

From a security perspective, the Directory Server is a high-value trust bridge.

It connects merchant-side systems to issuer-side authentication systems. Any weakness in validation, routing, version handling, or message interpretation can affect how the authentication flow behaves.

---

## 3. Issuer Domain: The Core Trust Zone

The Issuer Domain is controlled by the cardholder’s issuing bank.

This is where the authentication decision happens.

The key component is the **Access Control Server (`ACS`)**.

The ACS receives the authentication request, evaluates the available transaction and device context, and decides whether the transaction can proceed through frictionless authentication or requires a challenge.

### ACS: Authentication Authority

The ACS is the issuer-side risk and authentication engine.

It can consider many signals, including transaction amount, merchant context, device data, browser characteristics, cardholder history, prior authentication context, and issuer-specific fraud models.

The ACS then returns an **Authentication Response (`ARes`)**.

That response determines the next state of the flow:

- approve through **Frictionless Flow**,
- request a **Challenge Flow**,
- reject authentication,
- or return another status indicating that authentication could not be completed normally.

### Frictionless vs Challenge

Frictionless flow is often described as better user experience.

That is true, but incomplete.

Frictionless flow is a security decision. It means the issuer believes it has enough confidence to authenticate the transaction without interrupting the cardholder.

Challenge flow means the issuer wants stronger verification, such as an app approval, one-time passcode, biometric confirmation, or another issuer-defined step-up method.

So the real question is not simply whether the user saw a challenge.

The better question is:

> What evidence did the issuer rely on, and which party supplied that evidence?

---

## The Researcher Mental Model

A useful way to study EMV 3DS 2.x is to separate the protocol into three layers:

### 1. Data Collection

What signals are collected from the browser, app, merchant, transaction, and cardholder context?

### 2. Message Routing

Which system receives, validates, transforms, forwards, or enriches each protocol message?

### 3. Decision Authority

Which system is allowed to approve silently, request a challenge, reject authentication, or return a status that affects authorization?

This model prevents a common mistake: treating 3DS as a frontend pop-up.

The browser is only the visible surface. The real security logic lives in how data is collected, structured, routed, validated, scored, and bound back to the transaction.

---

## Why This Architecture Matters

EMV 3DS 2.x is not a single API call.

It is a multi-party authentication system with multiple trust zones.

The merchant-facing side operates near the untrusted client edge. The scheme-controlled layer provides routing and protocol enforcement. The issuer-controlled layer performs the risk decision and produces the authentication result.

That separation is powerful, but it also creates the attack surface researchers need to understand:

- message integrity,
- field ownership,
- browser iframe behavior,
- device-signal reliability,
- protocol-version handling,
- gateway abstraction leaks,
- issuer risk assumptions,
- and the difference between authentication and authorization.

If you understand the three domains, you can read EMV 3DS traffic with purpose.

You know which party created a field, which party validated it, which party trusted it, and which party made the final decision.

That is the foundation for serious protocol analysis.

In the next part, we will trace how `AReq` and `ARes` move across these three domains and how they execute the actual EMV 3DS 2.x authentication handshake.