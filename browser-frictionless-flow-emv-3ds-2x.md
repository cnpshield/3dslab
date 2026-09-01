# Browser-Based EMV 3DS 2.x Frictionless Flow

Source basis: `prism-uploads/EMVCo_3DS_CoreSpec_v2.3.1_20220831.pdf`

This version follows the EMVCo 3-D Secure Protocol and Core Functions Specification v2.3.1.

## Spec-Accurate Notes

- The Frictionless Flow starts with `AReq` and `ARes`.
- If the ACS decides no further Cardholder interaction is required, authentication completes without a challenge.
- If the ACS decides Cardholder interaction is required, the flow transitions into Challenge Flow.
- Browser-based 3DS Method is optional and occurs before `AReq` when an ACS 3DS Method URL is available for the card range.
- The 3DS Requestor invokes the 3DS Method in the Cardholder Browser using a hidden iframe.
- The browser posts `threeDSMethodData` to the ACS 3DS Method URL.
- `threeDSMethodData` contains `threeDSServerTransID` and `threeDSMethodNotificationURL`.
- The ACS stores gathered values against the same `threeDSServerTransID` that later appears in `AReq`.
- The ACS posts completion notification back to the 3DS Method Notification URL through the browser iframe.
- The 3DS Server sets `threeDSCompInd = Y` if completion is notified; `N` if the method did not run or did not successfully complete; and `U` if the ACS 3DS Method URL was unavailable in PRes card-range data.
- If a successful prior 3DS Method for the same card, device, and browser is reused within 10 minutes, the 3DS Server sets `threeDSMethodId` to the previous 3DS Server Transaction ID and `threeDSCompInd = Y` in `AReq`.
- Browser data included in `AReq` can include accept headers, IP address, Java enabled, language, screen color depth, screen height/width, timezone, and user agent; the 3DS Server is responsible for ensuring browser data is not altered or hard-coded and is unique to each transaction.
- Before sending `AReq`, the 3DS Server must ensure the 3DS Method was executed within the previous 10 minutes when required; otherwise the 3DS Requestor re-executes it.
- The ACS must not initiate Cardholder interaction as part of a frictionless transaction; Cardholder interaction belongs to Challenge Flow.
- `RReq` / `RRes` are not present in a completed frictionless transaction.
- After receiving `ARes`, the 3DS Server treats `transStatus = Y` or `A` as the authenticated / attempts path for authorisation data handling.
- For `transStatus = N`, `U`, or `R`, the 3DS Server sends the necessary ARes information to the 3DS Requestor Environment and continues to Step 22.
- For `transStatus = D`, processing moves to Decoupled Authentication handling, where the ACS later sends `RReq`; this is not a completed frictionless transaction.
- For `transStatus = C`, the browser flow transitions to Challenge Flow and uses `CReq` / `CRes`.
- The DS can also return an `ARes` or `Error` to the 3DS Server without forwarding to the ACS if DS validation, version support, or participating-range checks fail.

## Numbered Sequence Diagram

```mermaid
sequenceDiagram
    actor CH as Cardholder
    participant BR as Browser
    participant RE as 3DS Requestor Environment<br/>(Merchant Website)
    participant S as 3DS Server
    participant DS as Directory Server<br/>(DS)
    participant ACS as Access Control Server<br/>(ACS)

    CH->>BR: 1. Initiates checkout
    BR->>RE: 2. Provides payment + checkout context
    RE->>S: 3. Starts 3DS authentication setup

    Note over RE,S: 4. 3DS Requestor / 3DS Server use cached PRes card-range data<br/>to determine whether an ACS 3DS Method URL exists.

    alt 5A. ACS 3DS Method URL exists and recent reusable method result is not used
        RE->>BR: 5A.1 Open hidden iframe<br/>style="visibility:hidden"
        BR->>ACS: 5A.2 HTTP POST threeDSMethodData<br/>{threeDSServerTransID, threeDSMethodNotificationURL}<br/>to ACS 3DS Method URL
        Note over ACS: 5A.3 ACS gathers browser/device information<br/>and stores values with threeDSServerTransID
        ACS-->>BR: 5A.4 HTTP POST threeDSMethodData<br/>{threeDSServerTransID}<br/>to 3DS Method Notification URL
        BR-->>RE: 5A.5 3DS Method notification received
        RE-->>S: 5A.6 Notify 3DS Method completed
        S->>S: 5A.7 Set threeDSCompInd = Y
    else 5B. Recent successful prior 3DS Method is reused
        Note over S: 5B.1 If reused within 10 minutes for same card/device/browser,<br/>set threeDSMethodId = previous threeDSServerTransID<br/>and threeDSCompInd = Y in AReq.
    else 5C. No ACS Method URL or timeout/non-completion
        Note over S: 5C.1 If ACS Method URL is unavailable,<br/>set threeDSCompInd = U.<br/>If method is invoked but no completion within 5 seconds,<br/>set threeDSCompInd = N.
    end

    RE->>S: 6. Provide browser + transaction data
    S->>S: 7. Ensure required browser data is available,<br/>not altered/hard-coded, and unique to transaction
    S->>S: 8. Ensure 3DS Method execution is within previous 10 minutes<br/>when required; otherwise re-execute via 3DS Requestor
    S->>S: 9. Build AReq<br/>Device Channel = 02-BRW<br/>Include browser data + threeDSCompInd
    S->>DS: 10. Send AReq
    DS->>DS: 11. Validate AReq, check version support,<br/>and check participating account range

    alt 12A. DS cannot continue normal routing
        DS-->>S: 12A.1 Return ARes or Error<br/>as defined by DS rules / error condition
        S-->>RE: 12A.2 Return status or end 3DS processing
    else 12B. DS routes request to ACS
        DS->>ACS: 12B.1 Forward AReq
        ACS->>ACS: 13. Correlate prior 3DS Method data<br/>using threeDSServerTransID if available
        ACS->>ACS: 14. Perform risk-based authentication decision
        Note over ACS: 15. ACS must not initiate Cardholder interaction<br/>inside a frictionless transaction.
        ACS-->>DS: 16. Return ARes
        DS->>DS: 17. Validate ARes content
        DS-->>S: 18. Forward ARes

        alt 19A. Frictionless / attempts path
            S-->>RE: 19A.1 transStatus = Y or A<br/>Provide ECI / authentication value where applicable
            RE-->>BR: 19A.2 Continue checkout without challenge UI
        else 19B. Not authenticated / unable / rejected
            S-->>RE: 19B.1 transStatus = N / U / R<br/>Send necessary ARes information
            RE-->>BR: 19B.2 Continue or stop according to merchant / gateway policy
        else 19C. Decoupled authentication path
            S-->>RE: 19C.1 transStatus = D<br/>Decoupled handling; ACS later sends RReq
        else 19D. Browser Challenge Flow path
            S-->>RE: 19D.1 transStatus = C<br/>Transition to Challenge Flow<br/>(CReq / CRes path, out of scope here)
        end
    end

    Note over S,ACS: 20. In completed frictionless / attempts path, no CReq/CRes occurs.
    Note over S,ACS: 21. RReq/RRes are not present in completed frictionless flow;<br/>RReq appears in challenge or decoupled paths, not in frictionless completion.
```

## Numbered Compact LinkedIn-Friendly Mermaid Version

```mermaid
flowchart LR
    CH["1. Cardholder Browser"]
    RE["2. 3DS Requestor Environment\nMerchant Website"]
    S["3. 3DS Server"]
    CACHE["4. Check cached PRes card-range data\nFind ACS 3DS Method URL"]
    DS["10-11. Directory Server\nRouting + Validation"]
    DSTOP["12A. DS returns ARes/Error\nNo ACS forwarding"]
    ACS["12B-17. Issuer ACS\nRisk Decision + ARes"]
    OK["19A. Frictionless / Attempts Path\nARes transStatus = Y or A"]
    OTHER["19B. Not Auth / Unable / Rejected\ntransStatus = N / U / R"]
    D["19C. Decoupled Auth Path\ntransStatus = D\nRReq later"]
    C["19D. Challenge Required\ntransStatus = C\nCReq/CRes starts"]

    CH -->|1-2. payment + browser context| RE
    RE -->|3. start 3DS setup| S
    S --> CACHE

    subgraph METHOD["5. Optional 3DS Method before AReq"]
        URL{"5. ACS 3DS Method URL\navailable in cached PRes?"}
        IFRAME["5A.1 Hidden iframe"]
        POST1["5A.2 POST threeDSMethodData\nTx ID + notification URL"]
        STORE["5A.3 ACS stores browser/device values\nagainst threeDSServerTransID"]
        POST2["5A.4 ACS POSTs completion\nto notification URL"]
        REUSE["5B. Reuse recent prior method\nthreeDSMethodId = previous Tx ID\nthreeDSCompInd = Y"]
        COMP["5A/5C. 3DS Server sets\nthreeDSCompInd = Y / N / U"]
        URL -->|yes| IFRAME
        IFRAME --> POST1
        POST1 --> STORE
        STORE --> POST2
        POST2 --> COMP
        URL -->|no: U| COMP
        REUSE --> COMP
    end

    CACHE -.-> URL
    S -.-> REUSE
    COMP -.-> S

    RE -->|6. browser + transaction data| S
    S -->|7-9. validate browser data + build AReq| S
    S ==>|10. AReq\nDevice Channel 02-BRW| DS
    DS -->|12A. validation/version/range failure| DSTOP
    DSTOP --> S
    DS ==>|12B. validated AReq| ACS
    ACS -->|13-15. correlate data + risk decision| ACS
    ACS ==>|16. ARes| DS
    DS -->|17. validate ARes| DS
    DS ==>|18. ARes| S

    S --> OK
    S --> OTHER
    S --> D
    S --> C
    OK -->|no cardholder challenge| RE
    OTHER -->|merchant/gateway policy| RE
    D -->|decoupled handling| RE
    C -->|browser challenge flow| RE
    RE --> CH

    classDef browser fill:#fff7ed,stroke:#ea580c,stroke-width:2px,color:#111827;
    classDef acquirer fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#111827;
    classDef interop fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#111827;
    classDef issuer fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#111827;
    classDef success fill:#dcfce7,stroke:#15803d,stroke-width:3px,color:#111827;
    classDef warn fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#111827;
    classDef challenge fill:#fee2e2,stroke:#dc2626,stroke-width:3px,color:#111827;

    class CH browser;
    class RE,S,CACHE acquirer;
    class DS,DSTOP interop;
    class ACS issuer;
    class OK success;
    class URL,IFRAME,POST1,STORE,POST2,REUSE,COMP,OTHER warn;
    class D,C challenge;
```

## Frictionless-Only Mermaid Version

```mermaid
flowchart LR
    CH["1. Cardholder Browser"]
    RE["2. 3DS Requestor Environment\nMerchant Website"]
    S["3. 3DS Server"]
    CACHE["4. Cached PRes card-range data\nACS 3DS Method URL lookup"]
    METHOD["5. Optional 3DS Method\nBrowser/device data collection"]
    AREQ["6-9. Build AReq\nDevice Channel 02-BRW\nBrowser data + threeDSCompInd"]
    DS["10-12. Directory Server\nValidate + route AReq"]
    ACS["13-16. Issuer ACS\nCorrelate method data\nRisk-based authentication"]
    ARES["17-18. ARes returned\nValidated by DS"]
    OK["19A. Authenticated / attempts\ntransStatus = Y or A\nECI / authentication value where applicable"]
    OTHER["19B. Frictionless ends without challenge\ntransStatus = N / U / R\nReturn ARes information to Requestor"]
    END["20. 3-D Secure processing ends\nNo CReq/CRes\nNo RReq/RRes"]
    AUTH["21. Payment authorisation may proceed\nMerchant / gateway policy applies"]

    CH -->|1-2. checkout + payment context| RE
    RE -->|3. start 3DS authentication| S
    S --> CACHE
    CACHE --> METHOD
    METHOD -->|threeDSCompInd = Y / N / U| S
    RE -->|6. browser + transaction data| S
    S --> AREQ
    AREQ ==>|10. AReq| DS
    DS ==>|12. validated AReq| ACS
    ACS ==>|16. ARes| DS
    DS --> ARES
    ARES ==>|transStatus = Y / A / N / U / R| S
    S --> OK
    S --> OTHER
    OK --> RE
    OTHER --> RE
    RE --> END
    END --> AUTH
    AUTH --> CH

    classDef browser fill:#fff7ed,stroke:#ea580c,stroke-width:2px,color:#111827;
    classDef acquirer fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#111827;
    classDef interop fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#111827;
    classDef issuer fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#111827;
    classDef success fill:#dcfce7,stroke:#15803d,stroke-width:3px,color:#111827;
    classDef method fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#111827;

    class CH browser;
    class RE,S,AREQ acquirer;
    class DS,ARES interop;
    class ACS issuer;
    class OK,END,AUTH success;
    class OTHER method;
    class CACHE,METHOD method;
```

## Frictionless-Only Sequence Diagram

```mermaid
sequenceDiagram
    actor CH as Cardholder
    participant BR as Browser
    participant RE as 3DS Requestor Environment<br/>(Merchant Website)
    participant S as 3DS Server
    participant DS as Directory Server<br/>(DS)
    participant ACS as Access Control Server<br/>(ACS)

    CH->>BR: 1. Initiates checkout
    BR->>RE: 2. Provides payment + browser context
    RE->>S: 3. Starts 3DS authentication setup
    S->>S: 4. Checks cached PRes card-range data<br/>for ACS 3DS Method URL

    opt 5. Browser-based 3DS Method if ACS URL is available
        RE->>BR: 5.1 Open hidden iframe
        BR->>ACS: 5.2 POST threeDSMethodData<br/>{threeDSServerTransID, notification URL}
        ACS->>ACS: 5.3 Gather browser/device data<br/>for risk decisioning
        ACS-->>BR: 5.4 POST completion notification<br/>{threeDSServerTransID}
        BR-->>RE: 5.5 Notify 3DS Method completion
        RE-->>S: 5.6 Completion / timeout result
    end

    S->>S: 6. Set threeDSCompInd = Y / N / U
    RE->>S: 7. Provide browser + transaction data
    S->>S: 8. Build AReq<br/>Device Channel = 02-BRW<br/>Include browser data + threeDSCompInd
    S->>DS: 9. Send AReq
    DS->>DS: 10. Validate AReq and participating range
    DS->>ACS: 11. Forward validated AReq
    ACS->>ACS: 12. Correlate 3DS Method data if available
    ACS->>ACS: 13. Evaluate AReq data and decide<br/>no Cardholder challenge is required
    ACS-->>DS: 14. Return ARes<br/>transStatus = Y / A / N / U / R
    DS->>DS: 15. Validate ARes
    DS-->>S: 16. Forward ARes

    alt 17A. Authenticated / attempts
        S-->>RE: 17A.1 transStatus = Y or A<br/>Provide ECI / authentication value where applicable
    else 17B. Not authenticated / unable / rejected
        S-->>RE: 17B.1 transStatus = N / U / R<br/>Provide necessary ARes information
    end

    RE-->>BR: 18. Continue checkout according to merchant / gateway policy
    Note over S,ACS: Completed frictionless processing has no CReq/CRes and no RReq/RRes.
```

## Browser-Based Frictionless-Only Sequence Diagram

```mermaid
sequenceDiagram
    actor CH as Cardholder
    participant BR as Cardholder Browser
    participant RE as 3DS Requestor Environment<br/>(Merchant Website)
    participant S as 3DS Server
    participant DS as Directory Server<br/>(DS)
    participant ACS as Issuer ACS

    CH->>BR: 1. Starts checkout on merchant website
    BR->>RE: 2. Provides payment + checkout context
    RE->>S: 3. Requests browser-based 3DS setup
    Note over DS,S: Prior setup before checkout<br/>DS sends PRes card-range data to 3DS Server<br/>3DS Server caches it for transaction lookup
    S->>S: 4. Looks up DS-provided cached PRes card-range data<br/>to find ACS/DS versions and optional ACS 3DS Method URL
    S-->>RE: 5. Returns threeDSServerTransID<br/>and ACS 3DS Method URL if present

    alt 6A. Recent successful 3DS Method is reused
        S->>S: 6A.1 If same card/device/browser within 10 minutes,<br/>set threeDSMethodId to prior threeDSServerTransID<br/>and threeDSCompInd = Y
    else 6B. ACS 3DS Method URL is present and no reuse applies
        RE->>BR: 6B.1 Create hidden iframe for 3DS Method<br/>visibility hidden
        BR->>ACS: 6B.2 POST Base64url threeDSMethodData<br/>threeDSServerTransID + threeDSMethodNotificationURL
        ACS->>ACS: 6B.3 Gather additional browser/device information<br/>implementation specific, exact fields not defined by Core Spec
        ACS-->>BR: 6B.4 POST completion notification<br/>threeDSServerTransID
        BR-->>RE: 6B.5 Receives 3DS Method completion
        RE-->>S: 6B.6 Reports completion
        S->>S: 6B.7 Set threeDSCompInd = Y
    else 6C. ACS 3DS Method URL is unavailable
        RE-->>S: 6C.1 Notify URL does not exist
        S->>S: 6C.2 Skip 3DS Method<br/>Set threeDSCompInd = U
    else 6D. Method invoked but no completion within 5 seconds
        S->>S: 6D.1 Treat as not successfully completed<br/>Set threeDSCompInd = N
    end

    RE->>S: 7. Sends browser + transaction data
    Note over RE,S: Browser data includes accept headers, IP, Java and JavaScript enabled,<br/>language, color depth, screen size, timezone, user agent, deviceId, and userId where applicable.
    S->>S: 8. Build browser AReq<br/>Device Channel = 02-BRW<br/>Include browser data + threeDSCompInd
    S->>DS: 9. Send AReq
    DS->>DS: 10. Validate AReq, version support,<br/>and participating account range

    alt 11A. DS cannot route normally
        DS-->>S: 11A.1 Return ARes or Error<br/>without ACS forwarding
        S-->>RE: 11A.2 Return status / end 3DS processing
    else 11B. DS routes to issuer ACS
        DS->>ACS: 11B.1 Forward AReq
        ACS->>ACS: 12. Correlate prior 3DS Method result<br/>using threeDSServerTransID if available
        ACS->>ACS: 13. Perform risk-based decision<br/>without Cardholder interaction
        ACS-->>DS: 14. Return ARes<br/>transStatus = Y / A / N / U / R
        DS->>DS: 15. Validate ARes
        DS-->>S: 16. Forward ARes

        alt 17A. Authenticated / attempts
            S-->>RE: 17A.1 transStatus = Y or A<br/>Provide ECI / authentication value where applicable
            RE-->>BR: 17A.2 Continue checkout without challenge UI
        else 17B. Not authenticated / unable / rejected
            S-->>RE: 17B.1 transStatus = N / U / R<br/>Provide necessary ARes information
            RE-->>BR: 17B.2 Continue or stop according to merchant / gateway policy
        end
    end

    Note over BR,ACS: Browser frictionless completion has no CReq/CRes and no RReq/RRes.
```