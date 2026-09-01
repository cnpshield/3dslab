# EMV 3DS SDK Device Information Extracted Text



## Page 1

 
EMV® 
3-D Secure 
SDK— Device Information 
 
Data Version 1.7 
February 2025 
 
 
 
 
 
 
 
 
 
 
 
 


## Page 2

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Introduction Page 2 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is 
permitted only pursuant to the applicable agreement between the user and EMVCo found on the EMVCo 
website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Legal Notice 
 
The EMV® Specifications are provided “AS IS” without warranties of any kind, and EMVCo 
neither assumes nor accepts any liability for any errors or omissions contained in these 
Specifications. EMVCO DISCLAIMS ALL REPRESENTATIONS AND WARRANTIES, 
EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION IMPLIED WARRANTIES OF 
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NON-
INFRINGEMENT, AS TO THESE SPECIFICATIONS.  
 
EMVCo makes no representations or warranties with respect to intellectual property rights of 
any third parties in or in relation to the Specifications. EMVCo undertakes no responsibility to 
determine whether any implementation of the EMV
® Specifications may violate, infringe, or 
otherwise exercise the patent, copyright, trademark, trade secret, know-how, or other 
intellectual property rights of third parties, and thus any person who implements any part of 
the EMV® Specifications should consult an intellectual property attorney before any such 
implementation.  
 
Without limiting the foregoing, the Specifications may provide for the use of public key 
encryption and other technology, which may be the subject matter of patents in several 
countries. Any party seeking to implement these Specifications is solely responsible for 
determining whether its activities require a license to any such technology, including for 
patents on public key encryption technology. EMVCo shall not be liable under any theory for 
any party’s infringement of any intellectual property rights in connection with the EMV® 
Specifications. 
 
  


## Page 3

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Introduction Page 3 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is 
permitted only pursuant to the applicable agreement between the user and EMVCo found on the EMVCo 
website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Revision Log 
The following table lists the version history for the EMV® 3-D Secure SDK—Device 
Information document. EMV® Specification Bulletins provide the detailed updates made with 
each document release.  
Version Release Date Associated Specification Bulletins 
2.0.0 January 2017 • SB 190: 3-D Secure Requirement Numbering Scheme and 
Error Processing 
• SB 196: 3-D Secure Updates, Clarifications & Errata  
2.1.0 October 2017 • SB 205: EMV® 3-D Secure SDK and Device Information 
Updates, Clarifications & Errata 
1.1 May 2019 • SB 213: EMV® 3-D Secure Device Information Data 
Version 1.1 
1.3 August 2019 • SB 222: EMV® 3-D Secure Device Information Data 
Version 1.3 
1.4 October 2019 • SB 223: EMV® 3-D Secure—S DK Device Information Data 
Version 1.4 Updates, Clarifications and Errata 
1.5 September 2021 • SB 225: EMV® 3-D Secure SDK—Device Information Data 
Version 1.5 
1.6 May 2023 • SB 285: EMV® 3-D Secure SDK—Device Information Data 
Version 1.6 
1.7 February 2025 • SB 309: EMV® 3-D Secure SDK—Device Information Data 
Version 1.7 


## Page 4

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Introduction Page 4 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is 
permitted only pursuant to the applicable agreement between the user and EMVCo found on the EMVCo 
website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Contents 
1 Introduction ....................................................................................................... 6 
1.1 Purpose ...................................................................................................... 6 
1.2 Audience .................................................................................................... 6 
1.3 Definitions .................................................................................................. 6 
1.4 Abbreviations ..............................................................................................  6 
1.5 Data Version Number ................................................................................. 7 
1.6 Supporting Documentation ......................................................................... 7 
1.7 Terminology and Conventions .................................................................... 8 
2 Device Identification Parameters ..................................................................... 9 
2.1 Data Version............................................................................................... 9 
2.2 Minimum Supported Platform Versions ....................................................... 9 
2.3 Platform Permissions for Parameters ....................................................... 10 
2.4 Data Format and Representation .............................................................. 10 
2.5 Common Device Identification Parameters Available in All Device  
Platforms .................................................................................................. 11 
2.6 Android-specific Device Parameters ......................................................... 17 
2.7 iOS-specific Device Parameters ............................................................... 65 
2.8 Platform Provider-specific Parameters...................................................... 69 
2.9 Reasons for Device Parameter Unavailability ........................................... 76 
2.10 Device Information JSON Data .................................................................  77 
 


## Page 5

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Introduction Page 5 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is 
permitted only pursuant to the applicable agreement between the user and EMVCo found on the EMVCo 
website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Tables 
Table 1.1:  Abbreviations ...................................................................................................... 6 
Table 2.1:  Minimum Supported Platform Versions ............................................................... 9 
Table 2.2:  Common Parameters Available in Android and iOS Platforms ........................... 11 
Table 2.3:  Android-specific Device Parameters .................................................................. 17 
Table 2.4:  iOS-Specific Device Parameters ....................................................................... 65 
Table 2.5:  Platform Provider-specific Parameters .............................................................. 69 
Table 2.6:  Device Parameter Unavailability Reasons ......................................................... 76 
Table 2.7:  Device Parameters JSON Structure .................................................................. 78 


## Page 6

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Introduction Page 6 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is 
permitted only pursuant to the applicable agreement between the user and EMVCo found on the EMVCo 
website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
1 Introduction 
The EMV® 3-D Secure (3DS) protocol is aimed at securing authentication in Browser-based 
and App-based transactions. The EMV® 3-D Secure— Protocol and Core Functions 
Specification (hereinafter also referred to as the Core Specification) describes the 3DS 
protocol and core functions.  
The 3DS SDK is the device-side component of 3DS. The EMV® 3-D Secure—SDK 
Specification describes the specification for the 3DS SDK.  
Device identification is used to uniquely identify platform devices in the 3DS ecosystem. The 
ThreeDS2Service interface is one of the code elements that are described in the EMV 3-D 
Secure—SDK Specification. The initialize method of this interface collects the 
information required for device identification. This information is then sent to the 3DS 
Requestor App in JSON format. The 3DS Requestor App passes this information to the 3DS 
Server. The 3DS Server uses this information to create an AReq message. 
1.1 Purpose 
This document describes the device identification parameters that shall be collected by the 
3DS SDK. For the purposes of this document, when the phrase “3-D Secure”, or “3DS”, is 
used, the intent is EMV 3-D Secure. 
1.2 Audience 
This document is intended for use by implementers of the 3DS SDK. 
1.3 Definitions 
For the definition of the terms used in this document, refer to Table 1.3: Definitions in the 
Core Specification. 
1.4 Abbreviations 
The abbreviations listed in Table 1.1 are used in this specification. 
Table 1.1:  Abbreviations 
Abbreviation Description 
3DS Three Domain Secure 
3DS SDK Three Domain Secure Software Development Kit 
ABI Application Binary Interface 


## Page 7

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Introduction Page 7 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is 
permitted only pursuant to the applicable agreement between the user and EMVCo found on the EMVCo 
website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Abbreviation Description 
ACS Access Control Server 
API Application Programming Interface 
AReq Authentication Request 
ARes Authentication Response 
DD Device Data 
DPNA Device Parameter Not Available 
DV Data Version 
LoA Letter of Approval 
MCC Mobile Country Code 
MNC Mobile Network Code 
NITZ Network Identity and Time Zone 
SDK Software Development Kit 
SW Security Warning 
1.5 Data Version Number 
Refer to EMV® Specification Bulletin 255—3- D Secure Protocol Version Numbers for the 
Data Version Number status for the 3DS protocol version. 
1.6 Supporting Documentation 
The following documents are specific to the EMV 3-D Secure protocol and should be used in 
conjunction with this specification. These documents as well as the EMV® 3-D Secure 
Frequently Asked Questions are available on the EMVCo website. 
EMV® 3-D Secure—Protocol and Core Functions Specification 
EMV® 3-D Secure—SDK Technical Guide  
EMV® 3-D Secure—SDK Specification  
EMV® 3-D Secure—Split -SDK Specification 
EMV® 3-D Secure JSON Message Samples 
EMV® Specification Bulletin 255—EMV ® 3-D Secure Specification Version Configuration 


## Page 8

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Introduction Page 8 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is 
permitted only pursuant to the applicable agreement between the user and EMVCo found on the EMVCo 
website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
1.7 Terminology and Conventions 
The following words are used often in this specification and have a specific meaning: 
Shall 
Defines a product or system capability which is mandatory. 
May 
Defines a product or system capability which is optional or a statement which is 
informative only and is out of scope for this specification. 
Should 
Defines a product or system capability which is recommended. 
 


## Page 9

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 9 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is 
permitted only pursuant to the applicable agreement between the user and EMVCo found on the EMVCo 
website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
2 Device Identification Parameters 
This chapter describes the device identification parameters that shall be collected by the 
3DS SDK from all device platforms. These parameters are categorised as Common 
parameters, Platform-specific parameters and Platform Provider-specific parameters. 
The 3DS SDK shall collect either: 
• f or the Default-SDK – the Common parameters (see Section 2.5) and one set of 
Platform-specific parameters for Android and iOS devices (see Section 2.6 and 
Section 2.7), 
OR 
• f or the Split-SDK or for devices not based on an Android or iOS operating system – 
the Platform Provider-specific parameters (see Section 2.8), 
then prepare and encrypt the Device Information as defined in Requirements 2 through 5 in 
the Core Specification. 
The ACS uses the Device Information for device identification and risk analysis. 
The 3DS SDK shall collect all the parameters listed in the applicable tables: Table 2.2, 
Table 2.3, Table 2.4 OR Table 2.5, unless the parameter cannot be collected for any of the 
reasons stated in Table 2.6. 
Note: If collecting Platform Provider-specific parameters from Section 2.8, the 
parameters defined in Sections 2.5, 2.6 and 2.7 are not collected. 
2.1 Data Version 
The Data Version defines the set of device identification parameters that the 3DS SDK shall 
collect. The Data Version is a means for participating EMV 3-D Secure components to know 
which set of device identification parameters is being transferred. The Data Version may 
change when, for example, there are parameter changes in future device OS versions, an 
existing parameter is deprecated, etc. 
The Data Version shall be included in the device identification information that is sent by the 
3DS SDK. 
The device identification parameters that are described in this document constitute Data 
Version 1.7. 
2.2 Minimum Supported Platform Versions 
Table 2.1 lists the minimum platform versions that shall be supported by the 3DS SDK. 
Table 2.1:  Minimum Supported Platform Versions 
Platform Minimum Version 
Android Android 14 (API level 34) 


## Page 10

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 10 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is 
permitted only pursuant to the applicable agreement between the user and EMVCo found on the EMVCo 
website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Platform Minimum Version 
iOS 16 
Note:  The 3DS SDK can elect to support older OS versions as long as the OS vendors 
provide security fixes for these versions. 
2.3 Platform Permissions for Parameters 
The following types of permissions are required for collecting device identification 
parameters: 
• No permissions required: Indicates that the device parameters can be directly 
collected by the 3DS SDK, without any user approval or system permissions. 
• Installation-time permissions: Indicates that the device parameters require system 
permissions to be granted to the app during installation time. 
• Run-time permissions: Indicates that the device parameters can be collected by the 
3DS SDK only if the required permissions have already been granted to the app 
through user approval at run-time. 
The 3DS SDK shall check whether an installation-time or run-time permission for a particular 
parameter is available or has already been granted to the app. If the permission for a 
particular parameter is not available, then the 3DS SDK shall send one of the Reason Codes 
stated in Table 2.6 as the value for the parameter within the Device Parameter Not Available 
(DPNA) tag. 
The 3DS SDK shall never prompt the user for run-time permissions. Similarly, the 3DS SDK 
shall not mandate the inclusion of additional installation-time permissions on the 3DS 
Requestor App. 
2.4 Data Format and Representation  
All parameters shall be encoded as String or Array of String. 
Boolean device parameters are coded as String of “false” or “true”. 
Integer parameters are coded as String with the format (-) integer part. 
• I nteger may only have a negative sign (-); the positive sign (+) is not allowed. 
• Integer has no leading zeros. 
Examples: 2, -3 
Floating-point and Double Floating-point number parameters are represented as String with 
the format (-) integer par, dot (.) decimal part. 
• It may only have a negative sign (-); the positive sign (+) is not allowed. 
• The integer part has no leading zeros. 
• The decimal part has no trailing zeros. 
• If the integer part is null, then it is represented by 0 (zero). 
• If the decimal part is null, then the dot and decimal part are not present. 
Examples: 0, 1.2, -1 .2,  0.12, 12


## Page 11

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 11 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
2.5 Common Device Identification Parameters Available in All Device Platforms  
Table 2.2 lists the Common parameters that the 3DS SDK shall collect from all Android and iOS device platforms. 
The availability of these parameters is subject to change in future OS versions. 
Table 2.2:  Common Parameters Available in Android and iOS Platforms 
Identifier Parameter Description Permissions 
C001 
 
 
 
Platform Platform that the device is using.  
JSON Data Type: String 
Values accepted: 
• “ Android” 
• “ iOS” 
Not applicable 
C002 
 
 
 
 
 
 
Device Model Mobile device manufacturer and model. 
JSON Data Type: String 
Values accepted: 
• Android: Build.MANUFACTURER + “||” + Build.MODEL returns the 
mobile device manufacturer and model. 
Example: “Samsung||SM-G960U1” 
• iOS: utsname.machine returns the device model. 
Example: “iPhone10.4” 
Note: Apple as a manufacturer is not included because it is the same 
for all iOS devices. 
No permissions required 


## Page 12

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 12 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Identifier Parameter Description Permissions 
C003 OS Name Operating system name. 
JSON Data Type: String 
Values accepted: 
• Android: “Android” + “ ” + (Build.Version.SDK_INT equivalent field 
name from Build.Version.VERSION_CODES) + “ ” + 
Build.Version.RELEASE + “ API ” + Build.Version.SDK_INT 
returns the name of the operating system and the API level. 
Example: “Android Q 10 API 29” 
• iOS: the systemName property of the UIDevice class returns the 
name of the operating system. 
Example: “iOS” 
No permissions required 
C004 OS Version Operating system version.  
JSON Data Type: String 
Values accepted: 
• Android: Build.VERSION.RELEASE returns the version of the 
operating system. 
Example: “8.1.0” 
• iOS: the systemVersion property of the UIDevice class returns the 
version of the operating system. 
Example: “14.2” 
No permissions required 


## Page 13

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 13 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Identifier Parameter Description Permissions 
C005 Locale Device locale set by the user. For more information, refer to IETF BCP 47. 
JSON Data Type: String 
Values accepted: 
• Android: the device locale.getLanguage() + “-” + 
locale.getCountry() returns the device locale. 
Example: “en-US” 
• iOS: the device currentLocale.languageCode + “-” + 
currentLocale.countryCode returns the device locale. 
Example: “en-US” 
currentLocale.countryCode deprecated from iOS 18.0 
From iOS 17 and above, use currentLocale.languageCode + "-" 
+ currentLocale.regionCode 
No permissions required 
C006 Time Zone Time zone offset in minutes between UTC and the device local time 
JSON Data Type: String 
Length: Variable, 1–4 characters 
Value accepted: 
• Integer in the range of -720 to 840, coded as a string 
For example, in Android, the TimeZone.getDefault() method returns a 
time zone based on the time zone where the program is running.  
Example time zone offset values in minutes: 
If UTC -5 hours: 
• “ 300” 
If UTC +5 hours:  
• “- 300” 
No permissions required 


## Page 14

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 14 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Identifier Parameter Description Permissions 
C008 Screen Resolution Pixel width and pixel height. 
JSON Data Type: String 
Length: Variable, maximum 13 characters 
Both width and height: Integer in the range of 0 to 999999 
Expressed as width x height, for example: “1080x1920”. 
• Android: the screen resolution can be obtained from the 
heightPixels and widthPixels fields of the DisplayMetrics 
class. 
• iOS: the screen resolution can be obtained from the UIScreen 
mainScreen bounds width and height. 
No permissions required 
C009 Device Name User-assigned device name.  
JSON Data Type: String 
Example: 
• Android: default Bluetooth adapter device name can be used. 
• iOS: the localizedModel property of the UIDevice class returns 
the Device Name.  
On Android, this parameter requires 
Installation-time permissions AND Run-
time permissions 
No permissions required on iOS. 
C010 IP Address Local IP address of the 3DS SDK in IPv4 or IPv6 format. 
JSON Data Type: String 
Length: Variable, maximum 45 characters 
Values accepted: 
• IPv4 address. Refer to RFC 791. 
• IPv6 address. Refer to RFC 4291. 
On Android, this parameter requires the 
following permissions during installation: 
android.permission.INTERNET 
android.permission.ACCESS_NETW
ORK_STATE 
No permissions required on iOS. 


## Page 15

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 15 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Identifier Parameter Description Permissions 
C011 Latitude Device physical location latitude. 
JSON Data Type: String 
Value accepted: 
• Double Floating-point number coded as a string 
Range: -90 to 90 
Run-time permissions required on 
Android API level 23 and later, and iOS. 
Installation-time permissions required on 
Android API level 22 and earlier. 
C012 Longitude Device physical location longitude. 
JSON Data Type: String 
Value accepted: 
• Double Floating-point number coded as a string 
Range: -180 to 180 
Run-time permissions required on 
Android API level 23 and later, and iOS. 
Installation-time permissions required on 
Android API level 22 and earlier. 
C013 Application 
Package Name 
The unique package name/bundle identifier of the application in which the 
3DS SDK is embedded. 
JSON Data Type: String 
• Android: obtained from the 
applicationContext.getPackageName() method. 
• iOS: obtained from the [NSBundle mainBundle] 
bundleIdentifier property. 
No permissions required 
C014 SDK App ID Universally unique ID that is created for each installation of the 3DS 
Requestor App on a Consumer Device. 
JSON Data Type: String 
Length: 36 characters 
Note: This should be the same ID that is passed to the 3DS Requestor App 
in the AuthenticationRequestParameters object (refer to Section 
4.12.1 in the EMV 3-D Secure—SDK Specification). 
No permissions required 


## Page 16

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 16 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Identifier Parameter Description Permissions 
C015 SDK Version 3DS SDK version as applied by the implementer and stored securely in the 
3DS SDK (refer to Requirement 58 in the EMV 3-D Secure—SDK 
Specification). 
JSON Data Type: String 
No permissions required 
C016 SDK Ref Number Identifies the vendor and version of the 3DS SDK that is used for a specific 
transaction. The value is assigned by EMVCo when the Letter of Approval 
(LoA) of the specific 3DS SDK is issued. 
JSON Data Type: String 
Length: Variable, maximum 32 characters  
Note: The ACS should verify that this value matches the SDK Reference 
Number present in the AReq message. 
No permissions required C017 dateTime Date and time when the 3DS SDK gathers the Device Information 
converted into UTC. 
Refer to the Core Specification for the definition of UTC. 
JSON Data Type: String 
Length: 14 characters 
Format accepted: YYYYMMDDHHMMSS 
No permissions required 
C018 sdkTransID Universally unique transaction identifier assigned by the 3DS SDK to 
identify a single transaction. 
Refer to the Core Specification for the definition of the SDK Transaction ID. 
JSON Data Type: String 
Length: 36 characters 
Note: The sdkTransID is added to the Device Information before the 3DS 
SDK encrypts the data. It is updated every time the createTransaction 
method is invoked. 
No permissions required 


## Page 17

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 17 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
2.6 Android-specific Device Parameters 
Table 2.3 lists the Platform-specific parameters that the 3DS SDK shall collect from the Android device platform. The Group or Identifier column 
contains the name of the parameter group or parameter identifier.  
Table 2.3:  Android-specific Device Parameters 
Group or 
Identifier 
Element Description Comments Permissions 
Telephony 
Manager 
 Telephony Manager provides 
access to information about the 
telephony services on the device. 
This group of parameters requires the following 
permissions: 
android.permission.SEND_SMS 
android.permission.READ_PHONE_STATE 
android.permission.READ_PHONE_NUMBER
S 
User approval is not required for API level 22 and 
earlier because these permissions are granted 
during installation. 
Run-time 
permissions 
A001 DeviceId Unique identifier of the device.  
Example:  
• IMEI for GSM phones  
• MEID or ESN for CDMA phones 
JSON Data Type: String 
 
getDeviceId method deprecated in API level 
26.  
Instead use: 
• getImei, which returns IMEI for GSM, and  
• getMeid, which returns MEID for CDMA. 
API level 29 or higher throws 
SecurityException or returns null.  
Set to RE04. 
Run-time 
permissions 


## Page 18

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 18 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A002 SubscriberId Unique subscriber ID.  
JSON Data Type: String 
Example: IMSI for GSM phones 
API level 29 or higher throws 
SecurityException or returns null.  
Set to RE04. 
Run-time 
permissions 
A003 IMEI/SV IMEI software version. 
JSON Data Type: String 
 Run-time 
permissions 
A004 Group Identifier 
Level1 
Group identifier level 1 for a GSM 
phone. 
JSON Data Type: String 
Available only for API level 18 or higher. Run-time 
permissions 
A005 Line1 Number Phone number string for line 1.  
JSON Data Type: String 
Example: MSISDN for GSM 
phones 
getLine1Number () is deprecated.  
API level 33 or higher throws 
UnsupportedOperationException  
From API level 33 and above use 
getPhoneNumber(DEFAULT_SUBSCRIPTION_
ID) 
Run-time 
permissions 
A006 MmsUAProfUrl  MMS user-agent profile URL. 
JSON Data Type: String 
Available only for API level 19 or higher. No permissions 
required 
A007 MmsUserAgent  MMS user-agent. 
JSON Data Type: String 
Available only for API level 19 or higher. No permissions 
required 


## Page 19

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 19 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A008 NetworkCountryIso ISO country code equivalent of the 
current registered operator’s 
Mobile Country Code (MCC). 
Length: 2 characters 
JSON Data Type: String 
Value accepted: 
• T he ISO-3166-1 alpha-2 
country code equivalent of the 
MCC. 
 No permissions 
required 
A009 NetworkOperator  Numeric name (MCC + Mobile 
Network Code (MNC)) of the 
current registered operator. 
JSON Data Type: String 
 No permissions 
required 
A010 NetworkOperatorName Alphabetic name of the current 
registered operator. 
JSON Data Type: String 
 No permissions 
required 
A011 NetworkType NETWORK_TYPE_xxxx for the 
current data connection. 
Length: Variable, maximum 11 
characters 
JSON Data Type: String 
Value accepted: 
• Integer coded as a string 
Use getDataNetworkType() only for API level 
24 or higher. 
No permissions 
required 


## Page 20

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 20 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A012 PhoneCount  Number of phones available. 
Returns 1 for single standby mode 
(single SIM functionality).  
Returns 2 for dual standby mode 
(dual SIM functionality). 
Length: 1 character 
JSON Data Type: String 
Value accepted: 
• Integer in the range of 0 to 5, 
coded as a string 
Available only for API level 23 or higher. 
getPhoneCount() deprecated in API level 30 
From API level 30 onwards, use 
getActiveModemCount() 
No permissions 
required 
A013 PhoneType  Constant that indicates the device 
phone type. This indicates the type 
of radio used to transmit voice 
calls. 
JSON Data Type: String 
 No permissions 
required 
A014 SimCountryIso  ISO country code equivalent of the 
SIM provider’s country code. 
Length: 2 characters 
JSON Data Type: String 
Value accepted: 
• T he ISO-3166-1 alpha-2 
country code equivalent of the 
SIM provider’s country code 
 No permissions 
required 


## Page 21

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 21 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A015 SimOperator  MCC+MNC of the SIM provider. 
JSON Data Type: String 
Length: Variable, maximum 6 
characters, numeric 
 No permissions 
required 
A016 SimOperatorName  Service Provider Name (SPN). 
JSON Data Type: String 
 No permissions 
required 
A017 SimSerialNumber  Serial number of the SIM, if 
applicable. 
JSON Data Type: String 
API level 29 or higher throws 
SecurityException or returns null.  
Set to RE04. 
Run-time 
permissions 
A018 SimState  Constant that indicates the state of 
the default SIM card. 
Length: 1 character 
JSON Data Type: String 
Value accepted: 
• Integer in the range of 0 to 9, 
coded as a string 
 No permissions 
required A019 VoiceMailAlphaTag  Alphabetic identifier associated 
with the voice mail number. 
JSON Data Type: String 
 Run-time 
permissions 
A020 VoiceMailNumber  Voice mail number. 
JSON Data Type: String 
 Run-time 
permissions 


## Page 22

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 22 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A021 hasIccCard  Returns true if an Integrated Circuit 
Card (ICC) is present. 
JSON Data Type: String 
Values accepted: 
• “ false” 
• “ true” 
 No permissions 
required 
A022 isHearingAidCompatibi
litySupported  
Indicates whether the phone 
supports hearing aid compatibility. 
JSON Data Type: String 
Values accepted: 
• “ false” 
• “ true” 
Available only for API level 23 or higher. No permissions 
required 
A023 isNetworkRoaming  Determines if the device is 
considered roaming on the current 
network, for GSM purposes. 
JSON Data Type: String 
Values accepted: 
• “ false” 
• “ true” 
 No permissions 
required 
A024 isSmsCapable Determines if the current device 
supports SMS service. 
JSON Data Type: String 
Values accepted: 
• “ false” 
• “ true” 
Available only for API level 21 to 34. 
From API level 35 onwards, use 
isDeviceSmsCapable() 
No permissions 
required 


## Page 23

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 23 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A025 isTtyModeSupported Determines whether the phone 
supports TTY mode. 
JSON Data Type: String 
Values accepted: 
• “ false” 
• “ true” 
Available only from API level 23 to API level 27. 
Deprecated in API level 28.  
From API level 28 onwards, use 
TelecomManager.isTtySupported(). 
No permissions 
required 
A026 isVoiceCapable  Determines if the current device is 
“voice-capable”. 
JSON Data Type: String 
Values accepted: 
• “ false” 
• “ true” 
Available only for API level 22 or 34. 
From API level 35 onwards, use 
isDeviceVoiceCapable() 
No permissions 
required 
A027 isWorldPhone  Determines whether the device is 
a world phone. 
JSON Data Type: String 
Values accepted: 
• “ false” 
• “ true” 
Available only for API level 23 or higher. No permissions 
required 


## Page 24

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 24 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A138 simCarrierId Provides a platform-wide unique 
identifier for each carrier. 
Length: Variable, maximum 11 
characters 
JSON Data Type: String 
Values accepted: 
• Integer coded as a string 
Available only for API level 28 or higher No permissions 
required 
A139 simCarrierIdName Provides user-facing name of the 
specific carrier ID. 
JSON Data Type: String 
Available only for API level 28 or higher No permissions 
required 
A140 manufacturerCode Provides the Manufacturer code 
from the Mobile Equipment 
Identifier. 
JSON Data Type: String 
Available only for API level 29 or higher No permissions 
required 
A141 simSpecificCarrierId Provides the carrier ID of the 
current subscription. 
Length: Variable, maximum 11 
characters 
JSON Data Type: String 
Value accepted: 
• Integer coded as a string 
Available only for API level 29 or higher No permissions 
required 
A142 simSpecificCarrierIdN
ame 
Provides the user-facing name of 
the specific carrier ID. 
JSON Data Type: String 
Available only for API level 29 or higher No permissions 
required 


## Page 25

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 25 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A143 multiSimSupported Indicates if the ability to register 
multiple SIM cards simultaneously 
on the network is supported by the 
device and by the carrier. 
Length: 1 character 
JSON Data Type: String 
Values accepted: 
• “0” 
• “1” 
• “2” 
Available only for API level 29 or higher Installation-time 
permissions 
A145 subscriptionId Returns the subscription ID for the 
given phone account. 
Length: Variable, maximum 11 
characters 
JSON Data Type: String 
Value accepted: 
• Integer coded as a string 
Available only for API level 30 or higher No permissions 
required 
A156 premiumForPurchase Check whether the given premium 
capability is available for purchase 
from the carrier 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 34 or higher 
Use 
isPremiumCapabilityAvailableForPurch
ase() 
 
Run-time 
permissions 
required 


## Page 26

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 26 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A169 nonTerrestrialNet Get whether device is connected 
to a non-terrestrial network. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 35 or higher 
NetworkRegistrationInfo#isNonTerrest
rialNetwork() should be checked for all 
available network registrations, and the result 
should return true if any of them is classified as 
non-terrestrial. 
No permissions 
required 
WifiManager  WifiManager provides the 
primary API for managing all 
aspects of Wi-Fi connectivity. 
This group of parameters requires the following 
permission: 
android.permission.ACCESS_WIFI_STATE 
Installation-time 
permissions 
A028 Wifi - Mac Address Returns the wireless MAC address 
of the device. 
JSON Data Type: String 
For API level 31 or higher, set to RE04 in the 
DPNA. 
Installation-time 
permissions 
A029 BSSID Returns the Basic Service Set 
Identifier (BSSID) of the current 
access point. 
JSON Data Type: String 
 Installation-time 
permissions 
A030 SSID Returns the Service Set Identifier 
(SSID) of the current 802.11 
network. 
JSON Data Type: String 
 Installation-time 
permissions 


## Page 27

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 27 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A031 Network ID Each configured network has a 
unique small integer ID, used to 
identify the network when 
performing operations on the 
supplicant. 
Length: Variable, maximum 11 
characters 
JSON Data Type: String 
Value accepted: 
• Integer coded as a string 
 Installation-time 
permissions 
A032 is5GHzBandSupported Determines if this adapter supports 
the 5 GHz band. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 21 or higher. Installation-time 
permissions 
A033 isDeviceToApRttSuppor
ted 
Determines if this adapter supports 
Device-to-AP RTT. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 21 or higher. 
Deprecated in API level 29.  
Use PackageManager.hasSystemFeature() 
with PackageManager.FEATURE_WIFI_RTT. 
Installation-time 
permissions 


## Page 28

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 28 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A034 isEnhancedPowerReport
ingSupported  
Determines if this adapter supports 
advanced power and performance 
counters. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 21 or higher. Installation-time 
permissions A035 isP2pSupported  Determines if this adapter supports 
WifiP2pManager. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 21 or higher. Installation-time 
permissions 
A036 isPreferredNetworkOff
loadSupported  
Determines if this adapter supports 
offloaded connectivity scan. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 21 or higher. Installation-time 
permissions 
A037 isScanAlwaysAvailable Determines if scanning is always 
available. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 18 or higher. 
Deprecated in API level 29; ability for apps to 
trigger scan requests will be removed in a future 
Android release. 
Installation-time 
permissions 


## Page 29

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 29 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A038 isTdlsSupported Determines if this adapter supports 
Tunnel Directed Link Setup. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 21 or higher. Installation-time 
permissions 
A146 is6GHzBandSupported Returns a Boolean if 6GHz band is 
supported.  
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 30 or higher. Run-time 
permission required 
A147 passpointFqdn Returns the fully qualified domain 
name of the network if it is a 
Passpoint network. 
JSON Data Type: String 
Available only for API level 29 or higher. Run-time 
permission required 
A148 passpointProviderFrie
ndlyName 
Returns the Provider Friendly 
Name of the network if it is a 
Passpoint network. 
JSON Data Type: String 
Available only for API level 29 or higher. Run-time 
permission required 


## Page 30

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 30 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A157 maxWifiChannelNumber  The maximum number of channels 
that is allowed to be set on a 
WifiNetworkSpecifier 
Length: Variable, maximum 11 
characters 
JSON Data Type: String 
Value accepted: 
• Integer coded as a string 
Available only for API level 34 or higher. 
Use 
getMaxNumberOfChannelsPerNetworkSpec
ifierRequest () 
 
No permissions 
required 
A158 usableChannels List of frequencies available on the 
device.  
JSON Data Type: Array of String  
The frequency is represented as 
an integer coded as a string. 
Available only for API level 34 or higher. 
Use getUsableChannels with 
WifiScanner#WIFI_BAND_UNSPECIFIED  
and mode=0  
Run-time 
permission required 
A159 dualBandSimultSupport
ed 
Returns a Boolean true if this 
device supports Dual-Band 
Simultaneous (DBS) operation. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 34 or higher. No permissions 
required 


## Page 31

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 31 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A160 tidToLinkMappingNegoS
upported 
Returns a Boolean true if this 
device supports TID-to-Link 
Mapping Negotiation. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 34 or higher. No permissions 
required 
A161 tlsMinVersSupported Returns a Boolean indicating if 
required minimum TLS version is 
supported. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 34 or higher. No permissions 
required 
A162 tlsV13Supported 
 
Returns a Boolean indicating if 
TLS v1.3 is supported. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 34 or higher. No permissions 
required 
 


## Page 32

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 32 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A163 aggressiveRoamingMode
Supported 
Returns a Boolean indicating if this 
device supports aggressive 
roaming mode. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 35 or higher. No permissions 
required 
A164 isD2dSupportedWhenInf
raStaDisabled 
Returns a Boolean indicating if this 
device supports device-to-device 
(D2D) Wi-Fi use cases such as Wi-
Fi Direct when infra station (STA) 
is disabled. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 35 or higher. No permissions 
required 
A165 wepSupported 
 
Returns a Boolean indicating if this 
device supports connections to Wi-
Fi WEP networks. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 35 or higher. No permissions 
required 


## Page 33

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 33 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A166 wpaPersonalSupported 
 
Returns a Boolean indicating if this 
device supports connections to Wi-
Fi WPA-Personal networks. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 35 or higher. No permissions 
required 
Bluetooth 
Manager 
 Bluetooth Manager is used to 
conduct overall Bluetooth 
Management. 
Through Bluetooth Adapter, it 
facilitates fundamental Bluetooth 
tasks, such as initiate device 
discovery, query a list of bonded 
(paired) devices, initiate a 
BluetoothDevice using a 
known MAC address, and create a 
BluetoothServerSocket to 
listen for connection requests from 
other devices, and start a scan for 
Bluetooth Low Energy (LE) 
devices. 
This group of parameters requires the following 
permission: 
android.permission.BLUETOOTH 
Installation-time 
permissions 


## Page 34

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 34 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A039 Address  Hardware MAC address of the 
local Bluetooth adapter. 
Example: 00:00:56:B1:C0:6E 
JSON Data Type: String 
Values accepted: 
• 48 bits represented as 6 
hexadecimal bytes separated 
by “:” (colon hexadecimal 
notation) 
Available only for API level 18 or higher. Installation-time 
permissions 
AND 
Run-time 
permissions 
A040 BondedDeviceMac Returns the array of 
BluetoothDevice MAC 
address that are bonded (paired) 
to the local adapter. 
Example: [“48:F0:7B:61:DD:D4”, 
“ED:90:C2:3D:E8:14”] 
JSON Data Type: Array of String 
Values accepted: 
• 48 bits represented as 6 
hexadecimal bytes separated 
by “:” (colon hexadecimal 
notation) 
Available only for API level 18 or higher. Installation-time 
permissions 
AND 
Run-time 
permissions A149 BondedDevicesAlias Returns the array of 
BluetoothDevice alias coded 
as a string that are bonded 
(paired) to the local adapter. 
JSON Data Type: Array of String 
Available only for API level 30 or higher. Installation-time 
permissions 
AND 
Run-time 
permissions 


## Page 35

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 35 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A041 isEnabled Returns true if Bluetooth is 
currently enabled and ready for 
use. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 18 or higher. Installation-time 
permissions A167 addressType 
 
Returns the address type of this 
BluetoothDevice. 
JSON Data Type: Array of String  
Value accepted: 
• Integer coded as a string 
Available only for API level 35 or higher. 
The method 
BluetoothManager#getConnectedDevices 
returns a list of BluetoothDevice objects.  
To retrieve the addressType, 
BluetoothDevice#getAddressType() 
should be called for each object. 
 
No permissions 
required 
Build  Build is used to determine 
information about the current build, 
extracted from system properties. 
 No permissions 
required 
A042 BOARD Name of the underlying board, 
such as “goldfish”. 
JSON Data Type: String 
 No permissions 
required 
A043 BOOTLOADER System bootloader version 
number. 
JSON Data Type: String 
 No permissions 
required 


## Page 36

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 36 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A044 BRAND Consumer-visible brand with which 
the product/hardware will be 
associated, if any. 
JSON Data Type: String 
 No permissions 
required 
A045 DEVICE Name of the industrial design. 
JSON Data Type: String 
 No permissions 
required 
A046 DISPLAY Build ID string that is displayed to 
the user. 
JSON Data Type: String 
 No permissions 
required 
A047 FINGERPRINT String that uniquely identifies this 
build. 
JSON Data Type: String 
 No permissions 
required 
A048 HARDWARE Name of the hardware (from the 
kernel command line or /proc). 
JSON Data Type: String 
 No permissions 
required 
A049 ID Either a changelist number or a 
label like “M4-rc20”. 
JSON Data Type: String 
 No permissions 
required 
A050 MANUFACTURER Manufacturer of the 
product/hardware. 
JSON Data Type: String 
 No permissions 
required 


## Page 37

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 37 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A051 PRODUCT Name of the overall product. 
JSON Data Type: String 
 No permissions 
required 
A052 RADIO Radio firmware version number 
using getRadioVersion(). 
JSON Data Type: String 
 No permissions 
required 
A053 SERIAL Hardware serial number, if 
available. 
JSON Data Type: String 
Deprecated in API level 26.  
From API level 26 onwards, use getSerial() 
API level 29 or higher throws 
SecurityException or returns null.  
Set to RE04. 
No permissions 
required 
A153 SKU The SKU of the hardware (from the 
kernel command line). 
JSON Data Type: String
 
Available only for API level 31 or higher. 
 
No permissions 
required 
A154 SOC_MANUFACTURER The manufacturer of the device’s 
primary system-on-chip. 
JSON Data Type: String 
Available only for API level 31 or higher. No permissions 
required 
A155 SOC_MODEL The model name of the device’s 
primary system-on-chip. 
JSON Data Type: String 
Available only for API level 31 or higher. No permissions 
required 


## Page 38

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 38 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A054 SUPPORTED_32_BIT_ABIS Ordered list of 32-bit Application 
Binary Interfaces (ABIs) supported 
by this device.  
The most preferred ABI is the first 
element in the list. 
JSON Data Type: Array of String 
Available only for API level 21 or higher. No permissions 
required 
A055 SUPPORTED_64_BIT_ABIS Ordered list of 64-bit ABIs 
supported by this device.  
The most preferred ABI is the first 
element in the list. 
JSON Data Type: Array of String 
Available only for API level 21 or higher. No permissions 
required 
A056 TAGS Comma-separated tags describing 
the build, such as 
“unsigned,debug”. 
JSON Data Type: String 
 No permissions 
required 
A057 TIME Build time. 
JSON Data Type: String 
Length: Variable, maximum 20 
characters 
Value accepted: 
• Positive long integer coded as 
a string 
 No permissions 
required 


## Page 39

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 39 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A058 TYPE Type of build, such as “user” or 
“eng”. 
JSON Data Type: String 
 No permissions 
required 
A059 USER JSON Data Type: String  No permissions 
required 
Build.VERSI
ON 
 Build.VERSION indicates various 
version strings. 
 No permissions 
required 
A060 CODENAME The current development 
codename, or the string “REL” if 
this is a release build. 
JSON Data Type: String 
 No permissions 
required 
A061 INCREMENTAL The internal value used by the 
underlying source control to 
represent this build. 
JSON Data Type: String 
 No permissions 
required 
A062 PREVIEW_SDK_INT The developer preview revision of 
a pre-release SDK. 
Length: Variable, maximum 11 
characters 
JSON Data Type: String 
Value accepted: 
• Positive integer coded as a 
string 
Available only for API level 23 or higher. No permissions 
required 


## Page 40

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 40 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A063 SDK_INT The user-visible SDK version of 
the framework; its possible values 
are defined in 
Build.VERSION_CODES. 
Length: Variable, maximum 11 
characters 
JSON Data Type: String 
Value accepted: 
• Positive integer coded as a 
string 
 No permissions 
required 
A064 SECURITY_PATCH The user-visible security patch 
level. 
JSON Data Type: String 
Available only for API level 23 or higher. No permissions 
required 
Settings 
Secure 
 Secure system settings containing 
system preferences that 
applications can read but are not 
allowed to write. 
 No permissions 
required 
A065 ACCESSIBILITY_DISPLAY
_INVERSION_ENABLED 
Specifies whether display colour 
inversion is enabled. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 21 or higher. No permissions 
required 


## Page 41

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 41 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A066 ACCESSIBILITY_ENABLED Specifies whether accessibility is 
enabled. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
 No permissions 
required 
A067 ACCESSIBILITY_SPEAK_P
ASSWORD 
Specifies whether to speak 
passwords while in accessibility 
mode. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Deprecated in API level 26. No permissions 
required A068 ALLOWED_GEOLOCATION_O
RIGINS 
Origins for which browsers should 
allow geolocation by default. The 
value is a space-separated list of 
origins. 
JSON Data Type: String 
 No permissions 
required 


## Page 42

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 42 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A069 ANDROID_ID A 64-bit number (expressed as a 
hexadecimal string), unique to 
each combination of app-signing 
key, user, and device. Values of 
ANDROID_ID are scoped by 
signing key and user. The value 
may change if a factory reset is 
performed on the device or if an 
APK signing key changes. 
JSON Data Type: String 
Value accepted: 
• 8- byte hexadecimal [0-9,a-f,A-
F] 
 No permissions 
required 
A071 DEFAULT_INPUT_METHOD Setting to record the input method 
used by default. 
JSON Data Type: String 
 No permissions 
required 
A073 ENABLED_ACCESSIBILITY
_SERVICES 
List of enabled accessibility 
providers. 
JSON Data Type: Array of String 
 No permissions 
required 
A074 ENABLED_INPUT_METHODS List of input methods that are 
currently enabled. 
JSON Data Type: Array of String 
Not readable from API level 34.  
From API level 34 onwards, use 
getEnabledInputMethodList() 
 
No permissions 
required 


## Page 43

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 43 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A075 INPUT_METHOD_SELECTOR
_VISIBILITY 
Setting to record the visibility of the 
input method selector. 
JSON Data Type: String 
 No permissions 
required 
A076 INSTALL_NON 
_MARKET_APPS 
Specifies whether applications can 
be installed for this user via the 
system’s 
ACTION_INSTALL_PACKAGE 
mechanism. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Settings.Security.INSTALL_NON_MARKET
_APPS constant deprecated in API level 17. 
ACTION_INSTALL_PACKAGE mechanism 
deprecated in API level 29. 
From API level 29 onwards, use 
PackageManager.canRequestPackageInst
alls() 
Note: canRequestPackageInstalls()needs 
Run-time permissions 
(android.permission.REQUEST_INSTALL_PACK
AGES).  
If no permission, set to RE03 in the DPNA. 
No permissions 
required 
 
A077 LOCATION_MODE Degree of location access enabled 
by the end user. 
JSON Data Type: String 
Deprecated in API level 28. 
From API level 28 onwards, use 
LocationManager.isLocationEnabled() 
No permissions 
required 
A078 SKIP_FIRST_USE_HINTS If enabled, apps should try to skip 
any introductory hints on first 
launch. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 21 or higher. No permissions 
required 


## Page 44

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 44 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A079 SYS_PROP_SETTING_VERS
ION 
Secure system settings, containing 
system preferences that 
applications can read but are not 
allowed to write. 
JSON Data Type: String 
Available only for API levels below 24. No permissions 
required 
A080 TTS_DEFAULT_PITCH Default text-to-speech engine 
pitch. 
Length: Variable, maximum 11 
characters 
JSON Data Type: String 
Value accepted: 
• Positive integer coded as a 
string 
 No permissions 
required 
A081 TTS_DEFAULT_RATE Default text-to-speech engine 
speech rate.  
Length: Variable, maximum 11 
characters 
JSON Data Type: String 
Value accepted: 
• Positive integer coded as a 
string 
 No permissions 
required 


## Page 45

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 45 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A082 TTS_DEFAULT_SYNTH Default text-to-speech engine.  
Length: Variable, maximum 11 
characters 
JSON Data Type: String 
Value accepted: 
• Positive integer coded as a 
string 
 No permissions 
required A083 TTS_ENABLED_PLUGINS Space-delimited list of plugin 
packages that are enabled. 
JSON Data Type: String 
 No permissions 
required 
A150 RTT_CALLING_MODE User-selected Real-Time Text 
(RTT) mode.  
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 28 or higher. No permissions 
required 
A151 SECURE_FRP_MODE Indicates whether the device is in 
restricted secure Factory Reset 
Protection (FRP) mode.  
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Use Settings Secure SECURE_FRP_MODE for API 
level 30 to 33. 
Use Settings Global SECURE_FRP_MODE for API 
34 and above. 
 
No permissions 
required 


## Page 46

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 46 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
Settings 
Global 
 Global system settings containing 
preferences that always apply 
identically to all defined users. 
 No permissions 
required 
A084 ADB_ENABLED Specifies whether Android Debug 
Bridge (ADB) is enabled. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 17 or higher. No permissions 
required 
A085 AIRPLANE_MODE_RADIOS Comma-separated list of radios 
that need to be disabled when 
airplane mode is on. 
JSON Data Type: String 
Available only for API level 17 or higher. No permissions 
required 
A086 ALWAYS_FINISH_ACTIVIT
IES 
If 1, the activity manager will 
aggressively finish activities and 
processes as soon as they are no 
longer needed. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 17 or higher. No permissions 
required 


## Page 47

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 47 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A087 ANIMATOR_DURATION_SCA
LE 
Scaling factor for animator-based 
animations. 
JSON Data Type: String 
Value accepted: 
• Floating-point number coded 
as a string 
Available only for API level 17 or higher. No permissions 
required 
A088 AUTO_TIME Value to specify whether the user 
prefers the date, time and time 
zone to be automatically fetched 
from the network. Refer to Network 
Identity and Time Zone (NITZ). 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 17 or higher. No permissions 
required 
A089 AUTO_TIME_ZONE Value to specify whether the user 
prefers the time zone to be 
automatically fetched from the 
network. Refer to NITZ. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 17 or higher. No permissions 
required 


## Page 48

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 48 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A070 DATA_ROAMING Determines whether data roaming 
is enabled. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 17 or higher.  
Note: 
TelephonyManager.isDataRoamingEnable
d()may also be used. 
No permissions 
required 
A090 DEVELOPMENT_SETTINGS_
ENABLED 
Determines whether the end user 
has enabled development settings. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 17 or higher. No permissions 
required 
A072 DEVICE_PROVISIONED Determines whether the device 
has been provisioned. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 17 or higher. No permissions 
required 
A091 HTTP_PROXY Host name and port for global 
HTTP proxy.  
JSON Data Type: String 
Available only for API level 17 or higher. No permissions 
required 
A092 NETWORK_PREFERENCE User preference for which 
networks should be used. 
JSON Data Type: String 
Available only for API level 17 or higher. No permissions 
required 


## Page 49

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 49 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A093 STAY_ON_WHILE_PLUGGED
_IN 
Determines whether the device 
must remain switched on while it is 
plugged in. 
JSON Data Type: String 
Value accepted: 
• Integer in the range of 0 to 15, 
coded as a string 
Available only for API level 17 or higher. No permissions 
required 
A094 TRANSITION_ANIMATION_
SCALE 
Scaling factor for activity transition 
animations. 
JSON Data Type: String 
Value accepted: 
• Floating-point number coded 
as a string 
Available only for API level 17 or higher. No permissions 
required 
A095 USB_MASS_STORAGE_ENAB
LED 
Indicates whether USB mass 
storage is enabled. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 17 or higher. No permissions 
required 
A096 USE_GOOGLE_MAIL If this setting is set (to anything), 
then all references to Gmail on the 
device must change to Google 
Mail.  
JSON Data Type: String 
Available only for API level 17 or higher. No permissions 
required 


## Page 50

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 50 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A097 WAIT_FOR_DEBUGGER If 1, when launching DEBUG_APP, 
it will wait for the debugger before 
starting user code.  
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 17 or higher. No permissions 
required 
A098 WIFI_NETWORKS_AVAILAB
LE_NOTIFICATION_ON 
Determines whether the end user 
should be notified of open 
networks. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Deprecated in API level 26. No permissions 
required A152 APPLY_RAMPING_RINGER Indicates if ramping ringer is 
enabled on incoming call ringtone.  
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 29 or higher, 
deprecated in API level 33. 
From API level 33 onwards, use 
AudioManager.isRampingRingerEnabled(
)” 
No permissions 
required 
Settings 
System 
 System settings containing 
miscellaneous system 
preferences. 
 No permissions 
required 


## Page 51

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 51 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A099 ACCELEROMETER_ROTATIO
N 
Control whether the accelerometer 
will be used to change screen 
orientation. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
 No permissions 
required A100 BLUETOOTH_DISCOVERABI
LITY 
Determines whether remote 
devices may discover and/or 
connect to this device. 
JSON Data Type: String 
Values accepted: 
• “0” 
• “1” 
• “2” 
 No permissions 
required 
A101 BLUETOOTH_DISCOVERABI
LITY_TIMEOUT 
Bluetooth discoverability timeout. 
Length: Variable, maximum 11 
characters 
JSON Data Type: String 
Value accepted: 
• Positive integer coded as a 
string 
 No permissions 
required 


## Page 52

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 52 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A102 DATE_FORMAT Date format. 
JSON Data Type: String 
Values accepted: 
• m m/dd/yyyy 
• dd/mm/yyyy 
• yyyy/mm/dd 
Deprecated in API level 31 
From API level 31 onwards, use A120 - 
TIME_12_24. 
No permissions 
required 
A103 DTMF_TONE_TYPE_WHEN_D
IALING 
CDMA-only settings + DTMF tone 
type played by the dialler when 
dialling. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 23 or higher. No permissions 
required 
A104 DTMF_TONE_WHEN_DIALIN
G 
Specifies whether the audible 
DTMF tones are played by the 
dialler when dialling. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
 No permissions 
required 


## Page 53

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 53 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A105 END_BUTTON_BEHAVIOR The behaviour when the user 
presses the end call button if they 
are not on a call. 
JSON Data Type: String 
Values accepted: 
• “0” 
• “1” 
• “2” 
• “3” 
 No permissions 
required 
A106 FONT_SCALE Scaling factor for fonts. 
JSON Data Type: String 
Value accepted: 
• Positive Floating-point number 
coded as a string 
 No permissions 
required 
A107 HAPTIC_FEEDBACK_ENABL
ED 
Specifies whether the haptic 
feedback (long presses) is 
enabled. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Deprecated in API level 33 No permissions 
required 


## Page 54

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 54 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A108 MODE_RINGER_STREAMS_A
FFECTED 
Determines which streams are 
affected by ringer mode changes. 
Length: Variable, maximum 11 
characters 
JSON Data Type: String 
Value accepted: 
• Positive integer coded as a 
string 
 No permissions 
required 
A109 NOTIFICATION_SOUND Persistent store for the system-
wide default notification sound. 
JSON Data Type: String 
 No permissions 
required 
A110 MUTE_STREAMS_AFFECTED Determines which streams are 
affected by mute. 
Length: Variable, maximum 11 
characters 
JSON Data Type: String 
Value accepted: 
• Positive integer coded as a 
string 
 No permissions 
required 
A111 RINGTONE Persistent store for the system-
wide default ringtone URI. 
JSON Data Type: String 
 No permissions 
required 


## Page 55

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 55 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A112 SCREEN_BRIGHTNESS Screen backlight brightness 
between 0 and 255. 
Length: Variable, maximum 3 
characters 
JSON Data Type: String 
Value accepted: 
• Integer in the range of 0 to 
255, coded as a string 
 No permissions 
required 
A113 SCREEN_BRIGHTNESS_MOD
E 
Control whether to enable 
automatic brightness mode. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
 No permissions 
required 
A114 SCREEN_OFF_TIMEOUT The amount of time in milliseconds 
before the device goes to sleep or 
begins to dream after a period of 
inactivity. This value is also known 
as the user activity timeout period 
since the screen is not necessarily 
turned off when it expires. 
Length: Variable, maximum 11 
characters 
JSON Data Type: String 
Value accepted: 
• Positive integer coded as a 
string 
 No permissions 
required 


## Page 56

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 56 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A115 SOUND_EFFECTS_ENABLED Specifies whether sound effects 
(key clicks, lid open) are enabled. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
 No permissions 
required 
A116 TEXT_AUTO_CAPS Setting to enable Auto Caps in text 
editors. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
 No permissions 
required 
A117 TEXT_AUTO_PUNCTUATE Setting to enable Auto Punctuate 
in text editors. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
 No permissions 
required 
A118 TEXT_AUTO_REPLACE Setting to enable Auto Replace 
(AutoText) in text editors. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
 No permissions 
required 


## Page 57

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 57 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A119 TEXT_SHOW_PASSWORD Setting to show password 
characters in text editors. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
 No permissions 
required 
A120 TIME_12_24 Display time in the 12-hour format 
or the 24-hour format. 
JSON Data Type: String 
Values accepted: 
• “12” 
• “24” 
 No permissions 
required 
A121 USER_ROTATION Default screen rotation when no 
other policy applies. 
JSON Data Type: String 
Values accepted: 
• “0” 
• “1” 
• “2” 
• “3” 
 No permissions 
required 


## Page 58

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 58 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A122 VIBRATE_ON Specifies whether vibrate is on for 
different events. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
 No permissions 
required 
A123 VIBRATE_WHEN_RINGING Specifies whether the phone 
vibrates when it is ringing during 
an incoming call. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 23 or higher. 
Deprecated in API level 33. 
No permissions 
required Package 
Manager 
 Package Manager is used to 
retrieve various kinds of 
information related to the 
application packages that are 
currently installed on the device. 
 No permissions 
required 
A124 isSafeMode  Returns whether the device has 
been booted into safe mode. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
 No permissions 
required 


## Page 59

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 59 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A125 getInstalledApplicati
ons 
Returns an array of non-system 
application packages that are 
installed on the device. 
JSON Data Type: Array of String 
Include only packages that do not have 
ApplicationInfo.FLAG_SYSTEM set. 
Run-time 
permissions 
 
A126 getInstallerPackageNa
me 
Retrieves the package name of the 
application that installed a 
package. This identifies which 
market the package came from. 
JSON Data Type: String 
Indirectly, this field can be used to determine 
whether the application has been installed from a 
trusted source. 
getInstallingPackageName() deprecated 
in API level 30. 
From API level 30 onwards, use 
getInstallSourceInfo(). 
No permissions 
required 
A127 getSystemAvailableFea
tures 
Retrieves a list of features that are 
available on the device. 
The 3DS SDK shall share only the 
count of items in this list and not 
the full list itself. 
Length: Variable, maximum 11 
characters 
JSON Data Type: String 
Value accepted: 
• Positive integer coded as a 
string 
 No permissions 
required 


## Page 60

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 60 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A128 getSystemSharedLibrar
yNames  
Retrieves a list of shared libraries 
that are available on the device. 
The 3DS SDK shall share only the 
count of items in this list and not 
the full list itself. 
Length: Variable, maximum 11 
characters 
JSON Data Type: String 
Value accepted: 
• Positive integer coded as a 
string 
 No permissions 
required 
A168 appArchivable 
 
Returns a Boolean indicating if an 
app is archivable. 
JSON Data Type: String 
Values accepted: 
• “false” 
• “true” 
Available only for API level 35 or higher. 
Use the integrator application artifact (AAB only, 
not APK) that is archivable unless explicitly opted 
out using the Gradle attribute appArchive. 
No permissions 
required 
Environment  Environment provides access to 
environment variables. 
 No permissions 
required 
A129 getExternalStorageSta
te 
Returns the current state of the 
primary shared/external storage 
media. 
JSON Data Type: String 
 No permissions 
required 


## Page 61

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 61 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
Locale  Locale represents a specific 
geographical, political, or cultural 
region. 
 No permissions 
required 
A130 getAvailableLocales Returns the system’s installed 
locales. 
The 3DS SDK shall share only the 
length of this list and not the full list 
itself. 
Length: Variable, maximum 11 
characters 
JSON Data Type: String 
Value accepted: 
• Positive integer coded as a 
string 
 No permissions 
required 
DisplayMetr
ics 
 DisplayMetrics describes 
general information about a 
display, such as its size, density, 
and font scaling. 
 No permissions 
required 
A131 density The logical density of the display. 
JSON Data Type: String 
Value accepted: 
• Floating-point number coded 
as a string 
 No permissions 
required 


## Page 62

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 62 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A132 densityDpi The screen density expressed as 
dots per inch. 
Length: Variable, maximum 11 
characters 
JSON Data Type: String 
Value accepted: 
• Positive integer coded as a 
string 
 No permissions 
required 
A133 scaledDensity A scaling factor for fonts displayed 
on the display. 
JSON Data Type: String 
Value accepted: 
• Floating-point number coded 
as a string 
Deprecated in API level 34 No permissions 
required 
A134 xdpi The exact physical pixels per inch 
of the screen in the X dimension. 
JSON Data Type: String 
Value accepted: 
• Floating-point number coded 
as a string 
 No permissions 
required 


## Page 63

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 63 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A135 ydpi The exact physical pixels per inch 
of the screen in the Y dimension. 
JSON Data Type: String 
Value accepted: 
• Floating-point number coded 
as a string 
 No permissions 
required 
StatFs  StatFs retrieves overall 
information about the space on a 
filesystem. 
 No permissions 
required 
A136 getTotalBytes The total number of bytes 
supported by the filesystem. 
Length: Variable, maximum 19 
characters 
JSON Data Type: String 
Value accepted: 
• Positive integer coded as a 
string 
 No permissions 
required WebView  Information about the WebView 
component used by the 3DS SDK 
for the App-based HTML flow. 
 No permissions 
required 


## Page 64

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 64 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Element Description Comments Permissions 
A137 webViewUserAgent The default user-agent of the 
WebView component during the 
App-based HTML flow. 
String defaultUserAgent = 
android.webkit.WebSetting
s.getDefaultUserAgent(con
text); 
JSON Data Type: String 
 No permissions 
required 


## Page 65

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 65 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
2.7 iOS-specific Device Parameters 
Table 2.4 lists the Platform-specific parameters that the 3DS SDK shall collect from the iOS device platform. The Group or Identifier column 
contains the name of the parameter group or parameter identifier. 
Note:  The 3DS SDK does not require any permissions to collect these parameters. 
Table 2.4:  iOS-Specific Device Parameters 
Group or 
Identifier 
Attribute Description 
UIDevice  UIDevice provides a singleton instance representing the current device.  
I001 Identifier for Vendor Alphanumeric string that uniquely identifies a device to the app’s vendor. 
JSON Data Type: String 
I002 UserInterfaceIdiom Style of interface to use on the current device. 
JSON Data Type: String 
Values accepted: 
• “U nspecified” 
• “ iPhone” 
• “ TV” 
• “ carPlay” 
• “ iPad” 
• “ Mac” 
UIFont  UIFont provides the interface for getting and setting font information. 
I003 familyNames Returns an array of font family names available on the system. 
JSON Data Type: Array of String 


## Page 66

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 66 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Attribute Description 
I004 fontNamesForFamilyName Returns an array of font names for all the font families listed in I003. 
JSON Data Type: Array of String 
I005 systemFont Returns the system font. 
JSON Data Type: String 
I006 labelFontSize Returns the standard font size used for labels.  
JSON Data Type: String 
Value accepted: 
• Floating-point number coded as a string 
I007 buttonFontSize Returns the standard font size used for buttons. 
JSON Data Type: String 
Value accepted: 
• Floating-point number coded as a string 
I008 smallSystemFontSize Returns the size of the standard small system font. 
JSON Data Type: String 
Value accepted: 
• Floating-point number coded as a string 
I009 systemFontSize Returns the size of the standard system font. 
JSON Data Type: String 
Value accepted: 
• Floating-point number coded as a string 


## Page 67

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 67 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Attribute Description 
NSLocale  NSLocale encapsulates all the conventions about language and culture for a particular locale. 
I010 systemLocale Returns the ID of the generic locale that contains fixed “backstop” settings that provide 
values for otherwise undefined keys. 
Formatted as the device locale language + “-” + device locale country, e.g. “en-US”. 
JSON Data Type: String 
I011 availableLocaleIdentifiers Returns an array of string as provided by the OS method, each of which identifies a locale 
available on the system. 
JSON Data Type: Array of String 
I012 preferredLanguages Returns the user’s language preference order as an array of string as provided by the OS 
method. 
JSON Data Type: Array of String 
NSTimeZone  NSTimeZone defines the behaviour of time zone objects. 


## Page 68

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 68 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Attribute Description 
I013 defaultTimeZone Returns the time zone offset in minutes between UTC and the default time zone for the current 
application. 
JSON Data Type: String 
Length: Variable, 1–4 characters 
Value accepted: 
• Integer in the range of -720 to 840, coded as a string 
Example time zone offset values in minutes: 
If UTC -5 hours: 
• “ 300” 
If UTC +5 hours:  
• “- 300” 
NSBundle  NSBundle is a representation of the code and resources stored in a bundle directory on disk.  
I014 appStoreReceiptURL The file URL for the main application bundle’s App Store receipt. 
[[NSBundle mainBundle] appStoreReceiptURL] 
https://developer.apple.com/documentation/foundation/nsbundle/1407276-appstorereceipturl 
JSON Data Type: String 


## Page 69

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 69 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Group or 
Identifier 
Attribute Description 
I015 appStoreReceiptExists 
 
Indicates whether the receipt file residing in the appStoreReceiptURL path exists and is 
non-empty. 
Indirectly, this field can be used to determine whether the application has been purchased 
from the App Store. 
JSON Data Type: String 
Values accepted: 
• “ false” 
• “ true” 
2.8 Platform Provider-specific Parameters 
Table 2.5 lists the Platform Provider-specific parameters that the 3DS Split-SDK or SDK on devices not based on an Android or iOS operating 
system shall collect from the Platform Provider-specific platform.  
If providing Platform Provider-specific parameters, the parameters defined in Sections 2.5, 2.6 and 2.7 shall not be provided. 
Refer to the definition of the term “Platform Provider” in the Core Specification. 
Table 2.5:  Platform Provider-specific Parameters 
Identifier Parameter Description Comments 
D001 Platform Platform that the device is using. 
JSON Data Type: String 
 


## Page 70

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 70 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Identifier Parameter Description Comments 
D002 Device Model Platform-defined device model. 
JSON Data Type: String 
 
D003 OS Name Platform-defined OS name. 
JSON Data Type: String 
 
D005 Locale Device locale set by the user, refer to IETF BCP 47 
The Device Locale as set by the user consists of the device 
Language Code + “-” + current Country Code.  
Example: “en-US”. 
JSON Data Type: String 
 
D006 Time Zone User-selected or platform-provisioned Time Zone for the user’s 
device rendering the 3DS challenge.  
Time zone offset in minutes between UTC and the device local 
time as a string. 
JSON Data Type: String 
Length: Variable, 1–4 characters 
Value accepted: 
• Integer in the range of -720 to 840, coded as a string 
Example time zone offset values in minutes: 
If UTC -5 hours: 
• “ 300” 
If UTC +5 hours:  
• “- 300” 
 


## Page 71

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 71 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Identifier Parameter Description Comments 
D008 Screen Resolution Pixel width and pixel height. 
JSON Data Type: String 
Length: Variable, maximum 13 characters 
Value accepted: 
• Both width and height: Integer in the range of 0 to 999999. 
Expressed as width x height, for example: “1080x1920”. 
 
D013 Application Package 
Name 
The unique package name/bundle identifier of the application in 
which the 3DS SDK is embedded. 
JSON Data Type: String 
Specific values in case the 3DS SDK is embedded on an Android 
or iOS device: 
• In Android, this is obtained from the 
applicationContext.getPackageName() method. 
• In iOS, this can be obtained from the [NSBundle 
mainBundle] bundleIdentifier property. 
No permissions required 
D015 SDK Version 3DS SDK version as applied by the implementer and stored 
securely in the 3DS SDK (refer to Requirement 58 in the EMV 3-D 
Secure— SDK Specification). 
JSON Data Type: String 
No permissions required 
D016 SDKRef Number Identifies the vendor and version of the 3DS SDK that is used for a 
specific transaction. The value is assigned by EMVCo when the 
LoA of the specific 3DS SDK is issued and is provided as a string. 
JSON Data Type: String 
Note: The ACS should verify that this value matches the SDK 
Reference Number present in the AReq message. 
No permissions required 


## Page 72

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 72 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Identifier Parameter Description Comments 
D017 Challenge Window 
Size 
Challenge window width and height in pixels. 
JSON Data Type: String 
Length: Variable, maximum 13 characters 
Value accepted: 
• Both width and height: Integer in the range of 0 to 999999. 
Expressed as width x height, for example: “500x600” 
 
D021 DeviceId Unique and immutable identifier linked to a device that is 
consistent across 3DS transactions for the specific user device.  
Example: 
• Hardware Device ID 
• Platform-calculated device fingerprint 
JSON Data Type: String 
 
D022 DeviceType Constant that indicates the device type. 
JSON Data Type: String 
Values accepted: 
• “01” = Desktop 
• “02” = TV-connected 
• “03” = Tablet/Mobile 
• “04” = Headless/Voice 
• “05” = Wearable 
• “06” = Internet of Things 
• “ 99” = Other 
 


## Page 73

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 73 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Identifier Parameter Description Comments 
D023 InputType List of Cardholder input methods enabled on the device, i.e. [“01”, 
“02”].  
JSON Data Type: Array of String 
Values accepted: 
• “01” = Physical Keyboard 
• “02” = Touch Keyboard 
• “ 03” = TV-connected Onscreen Keyboard 
• “04” = Voice-activated 
• “ 05” = Gesture-activated  
• “ 99” = Other 
 
D024 OutputType List of output methods enabled on the device. 
JSON Data Type: Array of String 
Values accepted: 
• “01” = Display 
• “02” = Audio 
• “ 03” = Monochrome Display 
• “ 99” = Other 
 
D025 LogoPreferenceColour Preferred network and issuer logo colour preference provided. 
JSON Data Type: String 
Values accepted: 
• “01” = Full Colour 
• “02” = Monochrome White 
• “ 03” = Monochrome Black 
• “ 99” = Other 
 


## Page 74

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 74 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Identifier Parameter Description Comments 
D026 UserID Identifier of the transacting user’s platform Account ID.  
This identifier is a unique immutable hash of the user’s account 
identifier for the given platform.  
JSON Data Type: String 
Note: Cardholders may have more than one account on a given 
platform. 
Note: The UserID may change if the user resets the device. 
 
D027 Languages Gets the set of languages preferred by the user, in order of 
preference provided as an array of string, as defined in IETF BCP 
47. 
JSON Data Type: Array of String 
 
D028 OriginatingDeviceID The device identifier of the device where the transaction started 
before it was transferred to another device or method for/to 
complete authentication. 
JSON Data Type: String 
Example: 
• Hardware Device ID 
• Platform-calculated device fingerprint 
 
D029 IP-Address External IP address of the device as collected by the 3DS SDK in 
IPv4 or IPv6 format. 
JSON Data Type: String 
Length: Variable, maximum 45 characters 
Values accepted: 
• IPv4 address. Refer to RFC 791. 
• IPv6 address. Refer to RFC 4291. 
 


## Page 75

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 75 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Identifier Parameter Description Comments 
D030 Browser-Accept 
Headers 
Exact content of the HTTP Accept Headers as sent to the 3DS 
Requestor from the Cardholder Browser. 
JSON Data Type: String 
Only applicable to the Split-SDK/Browser.  
For other devices, return RE02. 
D031 Browser-User-Agent Exact content of the HTTP User-Agent header. 
JSON Data Type: String 
 
D032 Device-ID-Type Information about the Device ID, for example: “03”. 
JSON Data Type: String 
Values accepted: 
• “01” = Hardware-based identifier 
• “02” = Hardware fingerprint identifier 
• “ 03” = Key-based software identifier 
• “ 04” = Software fingerprint identifier 
 
D033 OriginatingDeviceIDT
ype  
Information about the Device ID, for example: “02”. 
JSON Data Type: String 
Values accepted: 
• “01” = Hardware-based identifier 
• “02” = Hardware fingerprint identifier 
• “ 03” = Key-based software identifier 
• “ 04” = Software fingerprint identifier 
 


## Page 76

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 76 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Identifier Parameter Description Comments 
D034 dateTime Date and time when the 3DS SDK gathers the Device Information 
converted into UTC. 
Refer to the Core Specification for the definition of UTC. 
JSON Data Type: String 
Length: 14 characters 
Format accepted: YYYYMMDDHHMMSS 
 
D035 sdkTransID Universally unique transaction identifier assigned by the 3DS SDK 
to identify a single transaction. 
Refer to the Core Specification for the definition of the SDK 
Transaction ID. 
JSON Data Type: String 
Length: 36 characters 
Note: The sdkTransID is added to the Device Information before 
the 3DS SDK encrypts the data. It is updated every time the 
createTransaction method is invoked. 
 
2.9 Reasons for Device Parameter Unavailability 
Table 2.6 provides a list of reason codes and descriptions to address the unavailability of a device parameter. If a 3DS SDK is unable to collect 
a particular device parameter, then the reason for the same shall be sent in the device parameters JSON with the key as “DPNA”, as shown in 
the sample provided in Table 2.7. 
Note: The availability of a higher number of device parameters improves the effectiveness of risk-based decision-making by the ACS, 
which may increase the probability of applying a Frictionless Flow. 


## Page 77

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 77 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Table 2.6:  Device Parameter Unavailability Reasons 
Reason Code Description 
RE01 Market, regional or privacy restriction on the parameter. 
RE02 Platform version does not support the parameter, or the parameter has been deprecated. 
RE03 Parameter collection not possible without prompting the user for permission.  
RE04 Parameter value returned is null or blank. 
2.10 Device Information JSON Data 
Table 2.7 provides a sample device parameters JSON. As shown in the sample JSON, the following keys are used in conjunction with the keys 
for the device identification parameters: 
DV: Data Version 
DD: Device Data 
DPNA: Device Parameter Not Available 
SW: Security Warning. For information about Security Warning, refer to the EMV 3-D Secure—SDK Specification. 
If DD, DPNA, or SW is empty, the field shall not be present in the Device Information; this means that to be present, DD, DPNA, or SW shall 
contain at least one element. 
The values listed in Table 2.6 shall only be present in the DPNA data object. 
The values (SWxx) listed in the EMV 3-D Secure—SDK Specification  shall only be present in the SW data object. 


## Page 78

EMV® 3-D Secure SDK—Device Information Data Version 1.7 
Device Identification Parameters Page 78 / 78 
© 2017–2025 EMVCo, LLC. All rights reserved. Reproduction, distribution and other use of this document is permitted only pursuant to the applicable agreement between the 
user and EMVCo found on the EMVCo website. EMV® is a registered trademark or trademark of EMVCo, LLC in the United States and other countries. 
Table 2.7:  Device Parameters JSON Structure 
Platform Device Information 
Android {"DV":"1.6","DD":{"C001":"Android","C002":"HTC||One_M8","C004":"5.0.1","C005":"en-US","C006":"-
300","C008":"400x800","C009":"John's Android 
Device",....},"DPNA":{"C010":"RE01","C011":"RE03"},"SW":["SW01","SW04"]} 
iOS {"DV":"1.6","DD":{"C001":"iOS","C002":"iPhone6,1","C003":" iPhone OS ","C004":"9.2","C005":"en-
US","C006":"360","C008":"800x2000","C009":"John's iPhone",....}," 
DPNA":{"C010":"RE01","C011":"RE03"},"SW":["SW01","SW04"]} 
Platform Provider-
specific 
{"DV":"1.6","DD":{"D001":"Android","D002":"Personal device","D003":"aPhone","D005":"fr-
FR","D006":"60","D008":"2340x1080","D009":"My 
Phone",....},"DPNA":{"D028":"RE02","D031":"RE03"},"SW":["SW01","SW04"]} 
