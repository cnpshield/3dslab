/**
 * Field-level provenance registry for the 3DS message types modelled in
 * the lab. Every key emitted by a versioned payload builder is registered
 * here with the version in which the field was introduced (or renamed, or
 * removed) and the chain of sources that justify its inclusion.
 *
 * Sources follow `LICENSES/EMVCo-notice.md`:
 *   - `emvco`     Anchored to a section/table of the EMV 3DS v2.3.1 Core
 *                 Spec (which the lab owns a personal-use copy of).
 *   - `comparison` From `comparison/3DSv2-api-documentation/`, which is
 *                 the 3dsecure.io re-typeset version. Used only for
 *                 v2.1.0 / v2.2.0 data, and clearly labelled as
 *                 non-authoritative.
 *   - `research`  Internal reasoning for synthetic values that have no
 *                 direct spec anchor (e.g. correlation IDs in test mode).
 *
 * The field lists in this file are derived from the comparison-repo
 * HTML tables at `comparison/3DSv2-api-documentation/source/_static/`,
 * which the project's spec audit verified against the EMVCo v2.3.1
 * Core Spec. Descriptions are paraphrases; no EMVCo normative prose
 * is reproduced verbatim.
 */

import type { FieldProvenance, MessageType } from '../types';

/** Convenience helper for the most common case: a field newly introduced
 * in a given version, sourced from the EMVCo v2.3.1 spec. */
const emvco = (
  field: string,
  sinceVersion: FieldProvenance['sinceVersion'],
  emvcoRef: string,
  description: string,
  extras: Partial<FieldProvenance> = {},
): FieldProvenance => ({
  field,
  sinceVersion,
  emvcoRef,
  description,
  sources: [{ kind: 'emvco', ref: emvcoRef, table: emvcoRef }],
  ...extras,
});

/** Convenience helper for a field whose primary anchor is the comparison repo. */
const comparison = (
  field: string,
  sinceVersion: FieldProvenance['sinceVersion'],
  emvcoRef: string,
  description: string,
  refPath: string,
  extras: Partial<FieldProvenance> = {},
): FieldProvenance => ({
  field,
  sinceVersion,
  emvcoRef,
  description,
  sources: [
    { kind: 'emvco', ref: emvcoRef, table: emvcoRef },
    { kind: 'comparison', ref: refPath, path: refPath },
  ],
  ...extras,
});

/**
 * Field provenance for the AReq message.
 *
 * The 73-field v2.1.0 baseline is from
 * `comparison/3DSv2-api-documentation/source/_static/areq_210.html`.
 * v2.2.0 adds 7 fields per `areq_220.html` and
 * `comparison/3DSv2-api-documentation/source/differences.rst`.
 * v2.3.1 adds 28 fields and renames 2 per `areq_231.html` and
 * `differences_v220_v231.rst`.
 */
export const AReq_FIELDS: FieldProvenance[] = [
  // === v2.1.0 baseline (73 fields per areq_210.html) ===
  emvco('acctID', '2.1.0', 'Table B.1', '3DS Requestor-assigned identifier for the cardholder account (e.g. customer ID in the merchant system).'),
  emvco('acctInfo', '2.1.0', 'Table B.1', 'Container of additional cardholder-account information that the 3DS Server sends to the ACS.'),
  emvco('acctNumber', '2.1.0', 'Table B.1', 'Primary account number (PAN) of the card being authenticated.'),
  emvco('acctType', '2.1.0', 'Table B.1', 'Indicates the type of account (credit, debit, etc.) per the issuer-specific enum.'),
  emvco('acquirerBIN', '2.1.0', 'Table B.1', 'Acquirer BIN; the DS uses this to identify the 3DS Server\'s acquirer.'),
  emvco('acquirerMerchantID', '2.1.0', 'Table B.1', 'Acquirer-assigned merchant identifier.'),
  emvco('addrMatch', '2.1.0', 'Table B.1', 'Indicates whether the billing and shipping addresses match.'),
  emvco('billAddrCity', '2.1.0', 'Table B.1', 'Billing address city.'),
  emvco('billAddrCountry', '2.1.0', 'Table B.1', 'Billing address country code (ISO 3166-1 numeric).'),
  emvco('billAddrLine1', '2.1.0', 'Table B.1', 'Billing address line 1.'),
  emvco('billAddrLine2', '2.1.0', 'Table B.1', 'Billing address line 2.'),
  emvco('billAddrLine3', '2.1.0', 'Table B.1', 'Billing address line 3.'),
  emvco('billAddrPostCode', '2.1.0', 'Table B.1', 'Billing address postal code.'),
  emvco('billAddrState', '2.1.0', 'Table B.1', 'Billing address state or province code.'),
  emvco('browserAcceptHeader', '2.1.0', 'Table B.1', 'Accept header sent by the browser.'),
  emvco('browserColorDepth', '2.1.0', 'Table B.1', 'Browser color depth in bits per pixel.'),
  emvco('browserIP', '2.1.0', 'Table B.1', 'External IP address of the browser as seen by the 3DS Requestor.'),
  emvco('browserJavaEnabled', '2.1.0', 'Table B.1', 'Whether the browser has Java enabled. v2.2.0 introduces browserJavascriptEnabled alongside this field; v2.3.1 keeps both.'),
  emvco('browserLanguage', '2.1.0', 'Table B.1', 'Browser language preference as set in the Accept-Language header.'),
  emvco('browserScreenHeight', '2.1.0', 'Table B.1', 'Browser screen height in pixels.'),
  emvco('browserScreenWidth', '2.1.0', 'Table B.1', 'Browser screen width in pixels.'),
  emvco('browserTZ', '2.1.0', 'Table B.1', 'Browser timezone offset in minutes from UTC.'),
  emvco('browserUserAgent', '2.1.0', 'Table B.1', 'User-Agent header sent by the browser.'),
  emvco('cardExpiryDate', '2.1.0', 'Table B.1', 'Card expiry date in YYMM format.'),
  emvco('cardholderName', '2.1.0', 'Table B.1', 'Cardholder name on the card.'),
  emvco('deviceChannel', '2.1.0', 'Table B.1', 'Channel the transaction originates from: 02 (Browser), 01 (App), 03 (3RI).'),
  emvco('deviceRenderOptions', '2.1.0', 'Table B.1', 'Container for the device-render options the 3DS Requestor sends to the ACS.'),
  emvco('ds', '2.1.0', 'Table B.1', 'Container for DS-specific data the 3DS Server forwards to the DS.'),
  emvco('email', '2.1.0', 'Table B.1', 'Cardholder email address as collected by the 3DS Requestor.'),
  emvco('homePhone', '2.1.0', 'Table B.1', 'Cardholder home phone number.'),
  emvco('mcc', '2.1.0', 'Table B.1', 'ISO 18245 Merchant Category Code.'),
  emvco('merchantCountryCode', '2.1.0', 'Table B.1', 'ISO 3166-1 numeric country code of the merchant.'),
  emvco('merchantName', '2.1.0', 'Table B.1', 'Merchant name as it should appear on the cardholder statement.'),
  emvco('merchantRiskIndicator', '2.1.0', 'Table B.1', 'Optional container for merchant-side risk data the issuer may use in the risk decision.'),
  emvco('messageCategory', '2.1.0', 'Table B.1', 'Category of message: 01 (Payment Authentication), 02 (Non-Payment); 03-79 are reserved for future EMVCo use and 80-99 are reserved for DS use.'),
  emvco('messageExtension', '2.1.0', 'Table B.1', 'Optional list of extension fields; provides a forward-compatibility escape hatch for non-standard data.'),
  emvco('messageType', '2.1.0', 'Table B.1', 'Discriminator for the message type; always AReq on this envelope.'),
  emvco('messageVersion', '2.1.0', 'Table B.1', 'Protocol version in effect for this transaction.'),
  emvco('mobilePhone', '2.1.0', 'Table B.1', 'Cardholder mobile phone number.'),
  emvco('notificationURL', '2.1.0', 'Table B.1', 'URL the ACS uses to POST the final CRes back to the 3DS Requestor via the browser challenge.'),
  emvco('payTokenInd', '2.1.0', 'Table B.1', 'Indicates whether the PAN has been tokenised.'),
  emvco('purchaseAmount', '2.1.0', 'Table B.1', 'Purchase amount in minor units of currency, as a string.'),
  emvco('purchaseCurrency', '2.1.0', 'Table B.1', 'ISO 4217 three-digit currency code for the purchase amount.'),
  emvco('purchaseDate', '2.1.0', 'Table B.1', 'Purchase timestamp in YYYYMMDDHHMMSS format.'),
  emvco('purchaseExponent', '2.1.0', 'Table B.1', 'Minor unit exponent for the purchase amount (e.g. 2 for USD).'),
  emvco('purchaseInstalData', '2.1.0', 'Table B.1', 'Maximum number of instalments the cardholder may choose; only set for instalment transactions.', { untilVersion: '2.2.0', renamedTo: 'installDate' }),
  emvco('recurringExpiry', '2.1.0', 'Table B.1', 'Date after which no further recurring authorisations are to be performed.'),
  emvco('recurringFrequency', '2.1.0', 'Table B.1', 'Number of days between recurring authorisations.'),
  emvco('sdkAppID', '2.1.0', 'Table B.1', 'App-3DS SDK application identifier; populated only for the app channel.'),
  emvco('sdkEncData', '2.1.0', 'Table B.1', 'JWE-object containing encrypted device data; populated only for the app channel.'),
  emvco('sdkEphemPubKey', '2.1.0', 'Table B.1', 'SDK ephemeral public key; populated only for the app channel.'),
  emvco('sdkMaxTimeout', '2.1.0', 'Table B.1', 'Maximum SDK timeout in minutes; populated only for the app channel.'),
  emvco('sdkReferenceNumber', '2.1.0', 'Table B.1', 'SDK reference number assigned by EMVCo at certification; populated only for the app channel.'),
  emvco('sdkTransID', '2.1.0', 'Table B.1', 'SDK-issued transaction ID; populated only for the app channel.'),
  emvco('shipAddrCity', '2.1.0', 'Table B.1', 'Shipping address city.'),
  emvco('shipAddrCountry', '2.1.0', 'Table B.1', 'Shipping address country code.'),
  emvco('shipAddrLine1', '2.1.0', 'Table B.1', 'Shipping address line 1.'),
  emvco('shipAddrLine2', '2.1.0', 'Table B.1', 'Shipping address line 2.'),
  emvco('shipAddrLine3', '2.1.0', 'Table B.1', 'Shipping address line 3.'),
  emvco('shipAddrPostCode', '2.1.0', 'Table B.1', 'Shipping address postal code.'),
  emvco('shipAddrState', '2.1.0', 'Table B.1', 'Shipping address state or province code.'),
  emvco('threeDSCompInd', '2.1.0', 'Table B.1', 'Indicates 3DS Method completion status in the AReq: Y (completed or recent prior successful method reused), N (not completed), U (unavailable).'),
  emvco('threeDSRequestorAuthenticationInd', '2.1.0', 'Table B.1', 'Indicates the 3DS Requestor has prior authentication data the issuer can use.'),
  emvco('threeDSRequestorAuthenticationInfo', '2.1.0', 'Table B.1', 'Container of prior authentication data. Object in v2.1.0/v2.2.0; array of objects from v2.3.1.', { typeChanged: true }),
  emvco('threeDSRequestorChallengeInd', '2.1.0', 'Table B.1', '3DS Requestor preference for challenge. String in v2.1.0/v2.2.0; array of strings from v2.3.1.', { typeChanged: true }),
  emvco('threeDSRequestorID', '2.1.0', 'Table B.1', '3DS Requestor identifier assigned by the DS or scheme; the merchant identity on the 3DS side.'),
  emvco('threeDSRequestorName', '2.1.0', 'Table B.1', '3DS Requestor name.'),
  emvco('threeDSRequestorPriorAuthenticationInfo', '2.1.0', 'Table B.1', 'Container of prior authentication data the 3DS Requestor has collected for this cardholder. Object in v2.1.0/v2.2.0; array from v2.3.1.', { typeChanged: true }),
  emvco('threeDSRequestorURL', '2.1.0', 'Table B.1', 'Fully qualified URL of the 3DS Requestor; ACSs may use it for out-of-band app launches.'),
  emvco('threeDSServerRefNumber', '2.1.0', 'Table B.1', '3DS Server reference number assigned by EMVCo at certification; the DS uses it to validate that the 3DS Server is who it claims to be.'),
  emvco('threeDSServerTransID', '2.1.0', 'Table B.1', 'Universally unique transaction ID assigned by the 3DS Server; the primary correlation handle for the flow.'),
  emvco('threeRIInd', '2.1.0', 'Table B.1', '3RI indicator; non-payment authentication scenario identifier.'),
  emvco('transType', '2.1.0', 'Table B.1', 'Transaction type (e.g. 01 = goods, 10 = recurring).'),
  emvco('workPhone', '2.1.0', 'Table B.1', 'Cardholder work phone number.'),

  // === v2.2.0 additions (7 fields per areq_220.html) ===
  comparison('browserJavascriptEnabled', '2.2.0', 'Table B.1', 'Whether the browser has JavaScript enabled; replaces the informative value of browserJavaEnabled for modern browsers.', 'comparison/3DSv2-api-documentation/source/_static/areq_220.html'),
  comparison('payTokenSource', '2.2.0', 'Table B.1', 'Source of the payment token when the PAN has been tokenised.', 'comparison/3DSv2-api-documentation/source/_static/areq_220.html'),
  comparison('threeDSReqAuthMethodInd', '2.2.0', 'Table B.1', 'Method by which the 3DS Requestor authenticated the cardholder prior to sending the AReq.', 'comparison/3DSv2-api-documentation/source/_static/areq_220.html'),
  comparison('threeDSRequestorDecMaxTime', '2.2.0', 'Table B.1', 'Maximum time the 3DS Requestor will wait for decoupled authentication to complete.', 'comparison/3DSv2-api-documentation/source/_static/areq_220.html'),
  comparison('threeDSRequestorDecReqInd', '2.2.0', 'Table B.1', 'Whether the 3DS Requestor is requesting decoupled authentication for this transaction.', 'comparison/3DSv2-api-documentation/source/_static/areq_220.html'),
  comparison('whiteListStatus', '2.2.0', 'Table B.1', 'Whether the 3DS Requestor is on the issuer\'s trusted beneficiary list.', 'comparison/3DSv2-api-documentation/source/_static/areq_220.html', { renamedTo: 'trustListStatus', untilVersion: '2.2.0' }),
  comparison('whiteListStatusSource', '2.2.0', 'Table B.1', 'System that set the whiteListStatus value.', 'comparison/3DSv2-api-documentation/source/_static/areq_220.html', { renamedTo: 'trustListStatusSource', untilVersion: '2.2.0' }),

  // === v2.3.1 additions (28 fields per areq_231.html) ===
  comparison('acceptLanguage', '2.3.1', 'Table B.1', 'HTTP Accept-Language value at the time of the transaction.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('acquirerCountryCode', '2.3.1', 'Table B.1', 'Country code of the acquiring institution; complements acquirerBIN.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('acquirerCountryCodeSource', '2.3.1', 'Table B.1', 'System that set acquirerCountryCode.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('appIp', '2.3.1', 'Table B.1', 'External IP of the 3DS Requestor App for the app-channel 3DS flow.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('broadInfo', '2.3.1', 'Table B.1', 'Unstructured information that flows between the 3DS Server, DS, and ACS without being interpreted by any party.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('cardSecurityCode', '2.3.1', 'Table B.1', 'Three- or four-digit security code printed on the card. Issuer may use it for additional risk scoring.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('cardSecurityCodeStatus', '2.3.1', 'Table B.1', 'Communication of whether the 3DS Requestor was able to capture the card security code.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('cardSecurityCodeStatusSource', '2.3.1', 'Table B.1', 'System that set cardSecurityCodeStatus.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('defaultSdkType', '2.3.1', 'Table B.1', 'Characteristics of the default 3DS SDK when the 3DS Requestor App uses the default-SDK model.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('deviceBindingStatus', '2.3.1', 'Table B.1', 'Communication of device binding status between the ACS, DS, and 3DS Requestor; supports cardholder-device binding flows.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('deviceBindingStatusSource', '2.3.1', 'Table B.1', 'System that set deviceBindingStatus.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('deviceId', '2.3.1', 'Table B.1', 'Immutable identifier for the device that initiated the transaction; supports the device-binding case.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('installDate', '2.3.1', 'Table B.1', 'Date the cardholder installed the 3DS Requestor App; app-channel only.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html', { renamedFrom: 'purchaseInstalData' }),
  comparison('multiTransaction', '2.3.1', 'Table B.1', 'Additional transaction data for multi-transaction or multi-merchant flows.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('payeeOrigin', '2.3.1', 'Table B.1', 'Origin of the payee used in SPC transaction data.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('payTokenInfo', '2.3.1', 'Table B.1', 'Information about the de-tokenised payment token, when the PAN was tokenised.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('recurringAmount', '2.3.1', 'Table B.1', 'Recurring amount in minor units of currency, used in recurring/instalment flows.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('recurringCurrency', '2.3.1', 'Table B.1', 'Currency in which recurringAmount is expressed.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('recurringDate', '2.3.1', 'Table B.1', 'Date of the first recurring or instalment payment, in YYYYMMDD format.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('recurringExponent', '2.3.1', 'Table B.1', 'Minor-unit exponent for recurringAmount.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('recurringInd', '2.3.1', 'Table B.1', 'Whether the recurring/instalment payment has a fixed or variable amount and frequency.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('sdkServerSignedContent', '2.3.1', 'Table B.1', 'JWS object the 3DS SDK Server signs to attest the integrity of the SDK-supplied device data.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('sdkType', '2.3.1', 'Table B.1', 'Indicates which 3DS SDK model the 3DS Requestor App is using: split SDK, default SDK, or neither (browser channel).', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('sellerInfo', '2.3.1', 'Table B.1', 'Additional transaction data for marketplace flows.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('spcIncompInd', '2.3.1', 'Table B.1', 'Reason the SPC authentication could not be completed, when the browser path returned this status.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('splitSdkType', '2.3.1', 'Table B.1', 'Characteristics of a split-SDK when the 3DS Requestor App uses the split-SDK model.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('taxId', '2.3.1', 'Table B.1', 'Cardholder tax identification number (Brazil CPF / India PAN / etc.).', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('threeDSMethodId', '2.3.1', 'Table B.1', '3DS Server Transaction ID used during the previous 3DS Method execution; lets the ACS correlate to the right fingerprint.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('threeDSRequestorAppURLInd', '2.3.1', 'Table B.1', 'Whether the 3DS Requestor supports the OOB Authentication App URL flow.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('threeDSRequestorSpcSupport', '2.3.1', 'Table B.1', 'Whether the 3DS Requestor supports the SPC authentication flow.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
  comparison('trustListStatus', '2.3.1', 'Table B.1', 'Replacement for whiteListStatus. Communicates trusted beneficiary status using the v2.3.1 enumeration.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html', { renamedFrom: 'whiteListStatus' }),
  comparison('trustListStatusSource', '2.3.1', 'Table B.1', 'Replacement for whiteListStatusSource. System that set the trustListStatus value.', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html', { renamedFrom: 'whiteListStatusSource' }),
  comparison('userId', '2.3.1', 'Table B.1', 'Identifier of the transacting user\'s browser account (e.g. the persistent account ID the 3DS Requestor assigned).', 'comparison/3DSv2-api-documentation/source/_static/areq_231.html'),
];

/**
 * Field provenance for the ARes message.
 *
 * 20-field baseline in v2.1.0 per `ares_210.html`; +3 in v2.2.0;
 * +11 additions and 3 renames in v2.3.1.
 */
export const ARes_FIELDS: FieldProvenance[] = [
  // === v2.1.0 baseline (20 fields) ===
  emvco('acsChallengeMandated', '2.1.0', 'Table B.2', 'Y if the ACS requires a challenge even if the 3DS Requestor opted out; N otherwise.'),
  emvco('acsOperatorID', '2.1.0', 'Table B.2', 'ACS-assigned operator identifier for the entity that processed the ARes.'),
  emvco('acsReferenceNumber', '2.1.0', 'Table B.2', 'ACS reference number assigned at certification; the DS uses it to verify the ACS identity.'),
  emvco('acsRenderingType', '2.1.0', 'Table B.2', 'Rendering hints for the challenge UI. Object shape grew in v2.3.1 (added deviceUserInterfaceMode).', { typeChanged: true }),
  emvco('acsSignedContent', '2.1.0', 'Table B.2', 'JWS-object signed by the ACS carrying additional ARes data; ensures end-to-end integrity of the response.'),
  emvco('acsTransID', '2.1.0', 'Table B.2', 'ACS-issued transaction identifier; the primary correlation handle on the issuer side.'),
  emvco('acsURL', '2.1.0', 'Table B.2', 'URL the 3DS Server loads in the challenge iframe to render the ACS challenge UI.'),
  emvco('authenticationType', '2.1.0', 'Table B.2', 'Authentication method the ACS used; renamed to authenticationMethod in v2.3.1.', { renamedTo: 'authenticationMethod', untilVersion: '2.2.0' }),
  emvco('authenticationValue', '2.1.0', 'Table B.2', 'Cryptographic proof of authentication (CAVV / AAV). The whole point of 3DS.'),
  emvco('cardholderInfo', '2.1.0', 'Table B.2', 'Information displayed to the cardholder during the challenge. String in v2.1.0/v2.2.0; object in v2.3.1.', { typeChanged: true }),
  emvco('dsReferenceNumber', '2.1.0', 'Table B.2', 'DS reference number assigned at certification; the 3DS Server uses it to verify the DS identity.'),
  emvco('dsTransID', '2.1.0', 'Table B.2', 'DS-issued transaction identifier; the DS uses this to find the right AReq on retry.'),
  emvco('eci', '2.1.0', 'Table B.2', 'Electronic Commerce Indicator value the merchant submits with the standard authorisation message.'),
  emvco('messageExtension', '2.1.0', 'Table B.2', 'Optional extension list.'),
  emvco('messageType', '2.1.0', 'Table B.2', 'Discriminator for the message type.'),
  emvco('messageVersion', '2.1.0', 'Table B.2', 'Protocol version in effect.'),
  emvco('sdkTransID', '2.1.0', 'Table B.2', 'SDK Transaction ID, populated only for the app channel.'),
  emvco('threeDSServerTransID', '2.1.0', 'Table B.2', 'Echoed 3DS Server Transaction ID; the 3DS Server uses this to correlate the response back to the original AReq.'),
  emvco('transStatus', '2.1.0', 'Table B.2', 'Authentication transaction status (Y, N, U, R, C, D, I, S, A). Drives whether the 3DS Server returns frictionless or challenge.'),
  emvco('transStatusReason', '2.1.0', 'Table B.2', 'Reason code that explains a non-Y transStatus.'),

  // === v2.2.0 additions (3 fields) ===
  comparison('acsDecConInd', '2.2.0', 'Table B.2', 'ACS Decoupled Confirmation Indicator; whether the ACS will deliver a decoupled confirmation.', 'comparison/3DSv2-api-documentation/source/_static/ares_220.html'),
  comparison('whiteListStatus', '2.2.0', 'Table B.2', 'Whether the 3DS Requestor is on the issuer\'s trusted beneficiary list. Renamed in v2.3.1.', 'comparison/3DSv2-api-documentation/source/_static/ares_220.html', { renamedTo: 'trustListStatus', untilVersion: '2.2.0' }),
  comparison('whiteListStatusSource', '2.2.0', 'Table B.2', 'System that set whiteListStatus. Renamed in v2.3.1.', 'comparison/3DSv2-api-documentation/source/_static/ares_220.html', { renamedTo: 'trustListStatusSource', untilVersion: '2.2.0' }),

  // === v2.3.1 additions (11 fields) + 3 renames ===
  comparison('authenticationMethod', '2.3.1', 'Table B.2', 'Replacement for authenticationType. The authentication approach used by the ACS; v2.3.1 expanded the enum.', 'comparison/3DSv2-api-documentation/source/_static/ares_231.html', { renamedFrom: 'authenticationType' }),
  comparison('broadInfo', '2.3.1', 'Table B.2', 'Unstructured information that flows through the protocol without being interpreted.', 'comparison/3DSv2-api-documentation/source/_static/ares_231.html'),
  comparison('cardSecurityCodeStatus', '2.3.1', 'Table B.2', 'Status of the card security code as seen by the ACS.', 'comparison/3DSv2-api-documentation/source/_static/ares_231.html'),
  comparison('cardSecurityCodeStatusSource', '2.3.1', 'Table B.2', 'System that set cardSecurityCodeStatus.', 'comparison/3DSv2-api-documentation/source/_static/ares_231.html'),
  comparison('deviceBindingStatus', '2.3.1', 'Table B.2', 'Communication of device binding status from the ACS back to the 3DS Requestor.', 'comparison/3DSv2-api-documentation/source/_static/ares_231.html'),
  comparison('deviceBindingStatusSource', '2.3.1', 'Table B.2', 'System that set deviceBindingStatus.', 'comparison/3DSv2-api-documentation/source/_static/ares_231.html'),
  comparison('deviceInfoRecognisedVersion', '2.3.1', 'Table B.2', 'Highest version of device information the ACS can interpret.', 'comparison/3DSv2-api-documentation/source/_static/ares_231.html'),
  comparison('spcTransData', '2.3.1', 'Table B.2', 'Information that the SPC API uses to render the Smart Modal Window.', 'comparison/3DSv2-api-documentation/source/_static/ares_231.html'),
  comparison('threeDSRequestorAppURLInd', '2.3.1', 'Table B.2', 'Whether the 3DS Requestor supports the OOB App URL flow.', 'comparison/3DSv2-api-documentation/source/_static/ares_231.html'),
  comparison('transChallengeExemption', '2.3.1', 'Table B.2', 'Exemption the ACS applied to authenticate the transaction without a challenge.', 'comparison/3DSv2-api-documentation/source/_static/ares_231.html'),
  comparison('transStatusReasonInfo', '2.3.1', 'Table B.2', 'Additional information on the transStatusReason value.', 'comparison/3DSv2-api-documentation/source/_static/ares_231.html'),
  comparison('trustListStatus', '2.3.1', 'Table B.2', 'Replacement for whiteListStatus.', 'comparison/3DSv2-api-documentation/source/_static/ares_231.html', { renamedFrom: 'whiteListStatus' }),
  comparison('trustListStatusSource', '2.3.1', 'Table B.2', 'Replacement for whiteListStatusSource.', 'comparison/3DSv2-api-documentation/source/_static/ares_231.html', { renamedFrom: 'whiteListStatusSource' }),
  comparison('webAuthnCredList', '2.3.1', 'Table B.2', 'List of WebAuthn credential IDs registered for the cardholder account; used by the ACS for SPC authentication.', 'comparison/3DSv2-api-documentation/source/_static/ares_231.html'),
];

/**
 * Field provenance for the CReq message.
 *
 * CReq is **stable across v2.1.0 / v2.2.0 / v2.3.1** — exactly 6 fields
 * per `comparison/3DSv2-api-documentation/source/_static/creq.html`.
 * There is no version delta. `whitelistingDataEntry` and
 * `threeDSRequestorAppURL` are NOT part of CReq (they are
 * browser-app-coordination hints that the lab previously conflated).
 */
export const CReq_FIELDS: FieldProvenance[] = [
  emvco('acsTransID', '2.1.0', 'Table B.3', 'Echoed ACS Transaction ID.'),
  emvco('challengeWindowSize', '2.1.0', 'Table B.3', 'Window size the 3DS Requestor picked from the ARes enum for the challenge iframe.'),
  emvco('messageExtension', '2.1.0', 'Table B.3', 'Optional extension list.'),
  emvco('messageType', '2.1.0', 'Table B.3', 'Discriminator for the message type.'),
  emvco('messageVersion', '2.1.0', 'Table B.3', 'Protocol version in effect.'),
  emvco('threeDSServerTransID', '2.1.0', 'Table B.3', 'Echoed 3DS Server Transaction ID.'),
];

/**
 * Field provenance for the CRes message.
 *
 * CRes is **stable across v2.1.0 / v2.2.0 / v2.3.1** — exactly 9 fields
 * per `cres_210.html`, `cres_220.html`, and `cres_231.html`. The
 * previously-recorded `cardholderInfo` and `whitelistingInfoText`
 * fields are NOT part of CRes; they were conflated from
 * browser-coordination specs.
 */
export const CRes_FIELDS: FieldProvenance[] = [
  emvco('acsCounterAtoS', '2.1.0', 'Table B.4 / B.5', 'Counter of ACS-to-Server attempts the 3DS Requestor has observed.'),
  emvco('acsTransID', '2.1.0', 'Table B.4 / B.5', 'Echoed ACS Transaction ID.'),
  emvco('challengeCompletionInd', '2.1.0', 'Table B.4 / B.5', 'Y if the challenge was completed, N otherwise.'),
  emvco('messageExtension', '2.1.0', 'Table B.4 / B.5', 'Optional extension list.'),
  emvco('messageType', '2.1.0', 'Table B.4 / B.5', 'Discriminator for the message type.'),
  emvco('messageVersion', '2.1.0', 'Table B.4 / B.5', 'Protocol version in effect.'),
  emvco('sdkTransID', '2.1.0', 'Table B.4 / B.5', 'SDK Transaction ID; populated only for the app channel.'),
  emvco('threeDSServerTransID', '2.1.0', 'Table B.4 / B.5', 'Echoed 3DS Server Transaction ID.'),
  emvco('transStatus', '2.1.0', 'Table B.4 / B.5', 'Final transaction status (Y / N / U / R only in CRes).'),
];

/**
 * Field provenance for the RReq message.
 *
 * 14-field v2.1.0 baseline per `rreq_210.html`; +3 in v2.2.0;
 * +5 additions + 3 renames in v2.3.1. Critically, `acsRenderingType`
 * is part of RReq already in v2.1.0 (the lab previously recorded it
 * as a v2.2.0 addition — that was a regression).
 */
export const RReq_FIELDS: FieldProvenance[] = [
  // === v2.1.0 baseline (14 fields) ===
  emvco('acsRenderingType', '2.1.0', 'Table B.8', 'Rendering hints the ACS sends back. v2.3.1 added deviceUserInterfaceMode.', { typeChanged: true }),
  emvco('authenticationType', '2.1.0', 'Table B.8', 'Authentication method the ACS used. Renamed to authenticationMethod in v2.3.1.', { renamedTo: 'authenticationMethod', untilVersion: '2.2.0' }),
  emvco('authenticationValue', '2.1.0', 'Table B.8', 'Cryptographic proof of authentication when the result is Y.'),
  emvco('challengeCancel', '2.1.0', 'Table B.8', 'Reason the challenge was cancelled; v2.2.0 normalised the enum values.'),
  emvco('challengeCancelationIndicator', '2.1.0', 'Table B.8', 'Indicator for the cancellation reason.'),
  emvco('challengeCompletionInd', '2.1.0', 'Table B.8', 'Y if the challenge was completed; N otherwise.'),
  emvco('dsTransID', '2.1.0', 'Table B.8', 'Echoed DS Transaction ID.'),
  emvco('eci', '2.1.0', 'Table B.8', 'Electronic Commerce Indicator.'),
  emvco('interactionCounter', '2.1.0', 'Table B.8', 'Number of challenge interactions the cardholder went through.'),
  emvco('messageExtension', '2.1.0', 'Table B.8', 'Optional extension list.'),
  emvco('messageType', '2.1.0', 'Table B.8', 'Discriminator for the message type.'),
  emvco('messageVersion', '2.1.0', 'Table B.8', 'Protocol version in effect.'),
  emvco('threeDSServerTransID', '2.1.0', 'Table B.8', 'Echoed 3DS Server Transaction ID.'),
  emvco('transStatus', '2.1.0', 'Table B.8', 'Final transaction status.'),
  emvco('transStatusReason', '2.1.0', 'Table B.8', 'Reason code for the transStatus.'),

  // === v2.2.0 additions (3 fields) ===
  comparison('sdkTransID', '2.2.0', 'Table B.8', 'SDK Transaction ID, populated only for the app channel. Note: present in v2.1.0 for CRes; added here in v2.2.0.', 'comparison/3DSv2-api-documentation/source/_static/rreq_220.html'),
  comparison('whiteListStatus', '2.2.0', 'Table B.8', 'Whether the cardholder is on the issuer\'s trusted beneficiary list. Renamed in v2.3.1.', 'comparison/3DSv2-api-documentation/source/_static/rreq_220.html', { renamedTo: 'trustListStatus', untilVersion: '2.2.0' }),
  comparison('whiteListStatusSource', '2.2.0', 'Table B.8', 'System that set whiteListStatus. Renamed in v2.3.1.', 'comparison/3DSv2-api-documentation/source/_static/rreq_220.html', { renamedTo: 'trustListStatusSource', untilVersion: '2.2.0' }),

  // === v2.3.1 additions (5 fields) + 3 renames ===
  comparison('authenticationMethod', '2.3.1', 'Table B.8', 'Replacement for authenticationType. Expanded enum in v2.3.1.', 'comparison/3DSv2-api-documentation/source/_static/rreq_231.html', { renamedFrom: 'authenticationType' }),
  comparison('cardholderInfo', '2.3.1', 'Table B.8', 'Text provided by the ACS / Issuer to the cardholder during the transaction.', 'comparison/3DSv2-api-documentation/source/_static/rreq_231.html'),
  comparison('challengeErrorReporting', '2.3.1', 'Table B.8', 'Error reporting for the challenge cancellation.', 'comparison/3DSv2-api-documentation/source/_static/rreq_231.html'),
  comparison('deviceBindingStatus', '2.3.1', 'Table B.8', 'Communication of device binding status from the ACS to the DS and 3DS Server.', 'comparison/3DSv2-api-documentation/source/_static/rreq_231.html'),
  comparison('deviceBindingStatusSource', '2.3.1', 'Table B.8', 'System that set deviceBindingStatus.', 'comparison/3DSv2-api-documentation/source/_static/rreq_231.html'),
  comparison('transStatusReasonInfo', '2.3.1', 'Table B.8', 'Additional information on the transStatusReason value.', 'comparison/3DSv2-api-documentation/source/_static/rreq_231.html'),
  comparison('trustListStatus', '2.3.1', 'Table B.8', 'Replacement for whiteListStatus.', 'comparison/3DSv2-api-documentation/source/_static/rreq_231.html', { renamedFrom: 'whiteListStatus' }),
  comparison('trustListStatusSource', '2.3.1', 'Table B.8', 'Replacement for whiteListStatusSource.', 'comparison/3DSv2-api-documentation/source/_static/rreq_231.html', { renamedFrom: 'whiteListStatusSource' }),
];

/** Field provenance for the RRes message. */
export const RRes_FIELDS: FieldProvenance[] = [
  emvco('acsTransID', '2.1.0', 'Table B.9', 'Echoed ACS Transaction ID.'),
  emvco('dsTransID', '2.1.0', 'Table B.9', 'Echoed DS Transaction ID.'),
  emvco('messageExtension', '2.1.0', 'Table B.9', 'Optional extension list.'),
  emvco('messageType', '2.1.0', 'Table B.9', 'Discriminator for the message type.'),
  emvco('messageVersion', '2.1.0', 'Table B.9', 'Protocol version in effect.'),
  emvco('resultsStatus', '2.1.0', 'Table B.9', 'How the 3DS Server handled the RReq: 01 (received), 02 (opt-out), 03 (not received), 04 (decoupled).'),
  emvco('sdkTransID', '2.1.0', 'Table B.9', 'SDK Transaction ID when the transaction originated on the app channel.'),
  emvco('threeDSServerTransID', '2.1.0', 'Table B.9', 'Echoed 3DS Server Transaction ID.'),
];

/**
 * Field provenance for the Erro message.
 *
 * Erro is **stable across v2.1.0 / v2.2.0 / v2.3.1** — exactly 11
 * fields per `erro_210.html`, `erro_220.html`, and `erro_231.html`.
 * The previously-recorded `sdkTransID` v2.2.0 addition was wrong:
 * sdkTransID is part of the v2.1.0 baseline.
 */
export const Erro_FIELDS: FieldProvenance[] = [
  emvco('acsTransID', '2.1.0', 'Table A.10', 'Echoed ACS Transaction ID when known.'),
  emvco('dsTransID', '2.1.0', 'Table A.10', 'Echoed DS Transaction ID when known.'),
  emvco('errorCode', '2.1.0', 'Table A.10', 'Numeric error code; see §A.9.'),
  emvco('errorComponent', '2.1.0', 'Table A.10', 'Component that produced the error: C (3DS Requestor), S (3DS Server), D (DS), A (ACS).'),
  emvco('errorDescription', '2.1.0', 'Table A.10', 'Human-readable description of the error.'),
  emvco('errorDetail', '2.1.0', 'Table A.10', 'Optional implementation-specific detail.'),
  emvco('errorMessageType', '2.1.0', 'Table A.10', 'The original messageType the error refers to (AReq, ARes, …).'),
  emvco('messageExtension', '2.1.0', 'Table A.10', 'Optional extension list.'),
  emvco('messageType', '2.1.0', 'Table A.10', 'Discriminator; always "Erro" (EMV 3DS preserved the misspelling).'),
  emvco('messageVersion', '2.1.0', 'Table A.10', 'Protocol version in effect.'),
  emvco('sdkTransID', '2.1.0', 'Table A.10', 'SDK Transaction ID when the error is on the app channel.'),
  emvco('threeDSServerTransID', '2.1.0', 'Table A.10', 'Echoed 3DS Server Transaction ID when known.'),
];

/** Field provenance for the OReq message. */
export const OReq_FIELDS: FieldProvenance[] = [
  emvco('dsReferenceNumber', '2.3.1', 'Table B.10', 'DS reference number assigned at certification; identifies the originating DS.'),
  emvco('dsTransID', '2.3.1', 'Table B.10', 'DS-issued transaction identifier for the operation-message exchange.'),
  emvco('messageType', '2.3.1', 'Table B.10', 'Discriminator for the message type.'),
  emvco('messageVersion', '2.3.1', 'Table B.10', 'Protocol version in effect.'),
  emvco('messageExtension', '2.3.1', 'Table B.10', 'Optional extension list.'),
  emvco('opCategory', '2.3.1', 'Table B.10', 'Category of operational information being communicated.'),
  emvco('opDescription', '2.3.1', 'Table B.10', 'Human-readable description of the operational communication.'),
  emvco('opExpDate', '2.3.1', 'Table B.10', 'Date after which the operational information is no longer relevant.'),
  emvco('opPriorTransRef', '2.3.1', 'Table B.10', 'Reference to prior transaction identifiers relevant to the operational notice.'),
  emvco('opSeq', '2.3.1', 'Table B.10', 'Sequence metadata for a single OReq or a multi-message OReq sequence.'),
  emvco('opSeverity', '2.3.1', 'Table B.10', 'Severity level of the operational communication.'),
];

/** Field provenance for the ORes message. */
export const ORes_FIELDS: FieldProvenance[] = [
  emvco('threeDSServerRefNumber', '2.3.1', 'Table B.11', '3DS Server reference number when the OReq recipient is a 3DS Server.'),
  emvco('threeDSServerTransID', '2.3.1', 'Table B.11', '3DS Server transaction ID when the OReq recipient is a 3DS Server.'),
  emvco('acsReferenceNumber', '2.3.1', 'Table B.11', 'ACS reference number when the OReq recipient is an ACS.'),
  emvco('acsTransID', '2.3.1', 'Table B.11', 'ACS transaction ID when the OReq recipient is an ACS.'),
  emvco('dsTransID', '2.3.1', 'Table B.11', 'Echoed DS transaction ID from the OReq message.'),
  emvco('messageExtension', '2.3.1', 'Table B.11', 'Optional extension list.'),
  emvco('messageType', '2.3.1', 'Table B.11', 'Discriminator for the message type.'),
  emvco('messageVersion', '2.3.1', 'Table B.11', 'Protocol version in effect.'),
  emvco('opStatus', '2.3.1', 'Table B.11', 'Acknowledgement status for the received OReq message sequence.'),
];

/** Lookup table for the field-provenance registry by message type. */
export const FIELD_PROVENANCE: Record<MessageType, FieldProvenance[]> = {
  AReq: AReq_FIELDS,
  ARes: ARes_FIELDS,
  CReq: CReq_FIELDS,
  CRes: CRes_FIELDS,
  RReq: RReq_FIELDS,
  RRes: RRes_FIELDS,
  PReq: [],
  PRes: [],
  Erro: Erro_FIELDS,
  OReq: OReq_FIELDS,
  ORes: ORes_FIELDS,
};
