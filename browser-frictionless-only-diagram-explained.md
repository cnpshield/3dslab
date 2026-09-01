# Browser-Based Frictionless-Only Sequence Diagram Explained

Source diagram: `browser-frictionless-flow-emv-3ds-2x.md`, section `Browser-Based Frictionless-Only Sequence Diagram`.

Source basis: `prism-uploads/EMVCo_3DS_CoreSpec_v2.3.1_20220831.pdf`

This file explains the browser-based EMV 3DS 2.x frictionless-only flow in simple language without skipping the important protocol steps.

## Big Picture

Browser-based frictionless 3DS is the path where the Cardholder is checking out in a web browser and the issuer ACS can make a risk decision without showing a challenge screen.

The main authentication messages are:

- `AReq`: Authentication Request, sent from the 3DS Server to the DS, then to the ACS.
- `ARes`: Authentication Response, sent from the ACS back through the DS to the 3DS Server.

In a completed frictionless browser flow:

- There is no challenge UI.
- There is no `CReq` or `CRes`.
- There is no `RReq` or `RRes`.
- The browser device channel is `02-BRW`.

## Participants

- `Cardholder`: The person checking out.
- `Cardholder Browser`: The browser used on the merchant website.
- `3DS Requestor Environment`: The merchant website or checkout environment.
- `3DS Server`: The server-side 3DS component used by the merchant or payment provider.
- `Directory Server`: The payment-system directory server that validates and routes 3DS messages.
- `Issuer ACS`: The issuer Access Control Server that performs the authentication risk decision.

## Step-by-Step Explanation

### 1. Cardholder starts checkout

The Cardholder begins checkout on the merchant website using a browser.

At this point, no 3DS protocol message has been sent yet. The merchant is collecting the normal checkout and payment context.

### 2. Browser provides payment and checkout context

The browser sends the checkout context to the merchant site.

This can include payment information, transaction amount, billing or shipping details, and browser context that the merchant or 3DS Server needs later for `AReq`.

### 3. Merchant requests browser-based 3DS setup

The 3DS Requestor Environment asks the 3DS Server to prepare for browser-based 3DS authentication.

The goal is to determine whether the card range supports 3DS, which protocol versions apply, and whether an ACS 3DS Method URL is available.

### Prior setup. DS provided card-range data earlier

Before this checkout, the 3DS Server received card-range data from the DS through the `PReq` and `PRes` process.

This matters because the DS is the source of the card-range data. The 3DS Server does not invent this data; it caches DS-provided `PRes` data and uses it during checkout.

The cached data can include:

- Card ranges.
- ACS protocol versions.
- DS protocol versions.
- Optional ACS 3DS Method URL for a card range.

### 4. 3DS Server looks up cached DS-provided PRes data

The 3DS Server checks its cached `PRes` card-range data for the card being used.

It looks for:

- Supported ACS protocol version or versions.
- Supported DS protocol version or versions.
- Whether a `threeDSMethodURL` exists for that card range.

If a `threeDSMethodURL` exists, the browser-based 3DS Method can be used before `AReq`.

### 5. 3DS Server returns transaction setup data

The 3DS Server returns setup information to the 3DS Requestor Environment.

This includes:

- `threeDSServerTransID`: the 3DS Server Transaction ID for this authentication.
- ACS 3DS Method URL, if one exists for the card range.

The same `threeDSServerTransID` must be used in the 3DS Method and later in the `AReq` so that the ACS can correlate the browser information with the authentication request.

## Optional 3DS Method Handling

The 3DS Method is a browser-based step before `AReq`. It allows the ACS to gather additional browser or device information for risk-based decisioning.

The exact browser/device fields gathered by the ACS during this method are implementation-specific and are not fully defined by the Core Spec.

### 6A. Recent successful 3DS Method is reused

If a successful 3DS Method was already run for the same card, device, and browser within the last 10 minutes, the 3DS Requestor can reuse that previous result.

In that case:

- A new 3DS Method call does not need to be run.
- The 3DS Server sets `threeDSMethodId` to the prior `threeDSServerTransID`.
- The 3DS Server sets `threeDSCompInd = Y`.

This means the method is treated as completed for the current `AReq` based on the recent prior method result.

### 6B. ACS 3DS Method URL is present and no reuse applies

If there is an ACS 3DS Method URL and no recent prior method result is reused, the merchant page runs the 3DS Method in the browser.

The 3DS Requestor Environment creates a hidden iframe in the Cardholder Browser.

The browser then posts `threeDSMethodData` to the ACS 3DS Method URL.

The posted `threeDSMethodData` contains:

- `threeDSServerTransID`
- `threeDSMethodNotificationURL`

The JSON object is Base64url encoded and sent in a form field named `threeDSMethodData`.

The ACS uses this browser interaction to gather additional browser/device information. The ACS stores the gathered information against the `threeDSServerTransID` so it can match the information later when the `AReq` arrives.

When the 3DS Method finishes, the ACS posts a completion notification back through the browser iframe to the 3DS Method Notification URL.

After the 3DS Requestor receives that notification, it reports completion to the 3DS Server.

The 3DS Server then sets:

`threeDSCompInd = Y`

### 6C. ACS 3DS Method URL is unavailable

If the cached DS-provided `PRes` data does not include an ACS 3DS Method URL for the card range, the 3DS Method is skipped.

This is not a failed method. It means the method was unavailable.

The 3DS Server sets:

`threeDSCompInd = U`

### 6D. Method was invoked but did not complete in time

If the 3DS Method was invoked but does not complete within 5 seconds, the 3DS Server treats it as not successfully completed.

The 3DS Server sets:

`threeDSCompInd = N`

This does not automatically stop the authentication. The flow still continues to `AReq`.

## Building and Sending AReq

### 7. Merchant sends browser and transaction data

The 3DS Requestor Environment sends browser and transaction data to the 3DS Server.

Browser data can include:

- Browser accept headers.
- Browser IP address.
- Java enabled indicator.
- JavaScript enabled indicator.
- Browser language.
- Screen color depth.
- Screen height.
- Screen width.
- Browser timezone.
- Browser user agent.
- `deviceId`, where applicable.
- `userId`, where applicable.

The 3DS Server is responsible for ensuring required browser data is available, not hard-coded, not altered, and unique to the transaction.

### 8. 3DS Server builds browser AReq

The 3DS Server builds the `AReq`.

For browser-based 3DS, the `AReq` uses:

`Device Channel = 02-BRW`

The `AReq` includes browser data and the `threeDSCompInd` value:

- `Y`: 3DS Method completed or recent successful method reused.
- `N`: 3DS Method was invoked but did not complete successfully within the timeout.
- `U`: ACS 3DS Method URL was unavailable.

### 9. 3DS Server sends AReq to DS

The 3DS Server sends the `AReq` to the Directory Server.

This is the start of the main 3DS authentication request path.

### 10. DS validates AReq

The DS validates the `AReq`.

The DS checks items such as:

- Message validity.
- Version support.
- Whether the account range is participating.
- Whether the request can be routed normally.

## DS Routing Outcomes

### 11A. DS cannot route normally

Sometimes the DS cannot continue normal routing to the ACS.

Examples include validation failure, unsupported version, or account range issues.

In that case, the DS can return an `ARes` or an `Error` to the 3DS Server without forwarding the request to the ACS.

The 3DS Server then returns the status to the 3DS Requestor Environment or ends 3DS processing according to the result.

### 11B. DS routes the AReq to issuer ACS

If validation succeeds and routing is possible, the DS forwards the `AReq` to the issuer ACS.

The ACS is the component that makes the issuer-side authentication decision.

## ACS Risk Decision

### 12. ACS correlates prior 3DS Method information

If 3DS Method data exists, the ACS correlates it using the `threeDSServerTransID`.

This lets the ACS connect the browser/device information collected before `AReq` with the actual authentication request.

If no 3DS Method data exists, the ACS still evaluates the `AReq` using the available transaction and browser data.

### 13. ACS performs risk-based decision without Cardholder interaction

The ACS evaluates the `AReq` data and decides the transaction disposition.

For this frictionless-only diagram, the ACS does not require Cardholder interaction.

The ACS must not initiate Cardholder interaction inside a frictionless transaction. If Cardholder interaction is needed, the flow would leave frictionless and become challenge or decoupled authentication, which is outside this diagram.

### 14. ACS returns ARes

The ACS returns an `ARes` through the DS.

For this frictionless-only diagram, the `transStatus` values shown are:

- `Y`: Authentication successful.
- `A`: Attempts processing performed.
- `N`: Not authenticated.
- `U`: Authentication could not be performed.
- `R`: Authentication rejected and authorisation should not be attempted.

The diagram intentionally excludes:

- `C`: Challenge required.
- `D`: Decoupled authentication required.

Those statuses are not completed frictionless browser outcomes.

### 15. DS validates ARes

The DS receives the `ARes` from the ACS and validates it.

If valid, the DS forwards it to the 3DS Server.

### 16. DS forwards ARes to 3DS Server

The 3DS Server receives the `ARes` from the DS.

The 3DS Server then handles the result based on `transStatus`.

## Final Result Handling

### 17A. Authenticated or attempts path

If `transStatus = Y` or `A`, the 3DS Server sends the necessary ARes information to the 3DS Requestor Environment.

For payment authentication, this can include authorisation-related 3DS data such as ECI and authentication value where applicable.

The browser checkout continues without a challenge UI.

### 17B. Not authenticated, unable, or rejected path

If `transStatus = N`, `U`, or `R`, the 3DS Server sends the necessary ARes information to the 3DS Requestor Environment.

The merchant, gateway, or payment policy then decides whether to continue, stop, retry, or handle the transaction another way.

This is still a no-challenge outcome in the diagram because no browser challenge UI is started.

## Final Note

Browser frictionless completion has no `CReq`, no `CRes`, no `RReq`, and no `RRes`.

If `transStatus = C`, the flow moves to Browser Challenge Flow.

If `transStatus = D`, the flow moves to Decoupled Authentication.

Those paths are intentionally excluded from this browser-based frictionless-only diagram.