---
author: "Aiden Vaines"
title: "PowerShell Framework Module: Connect-Office365"
date: 2017-11-10
description: "A Office365 connection module for my PowerShell Framework"
featured_image: /blog/2017-11-10-Template-module-Connect-Office365/featured.jpeg
tags: [
  "code",
  "powershell",
  "posh-fw",
]
---

One of the most common things I use Powershell for is Office 356, this requires the modules be installed and connecting to one of the Office365 sessions, Skype, Exchange or the Security & Compliance center.

[Follow this project on GitHub](https://github.com/n3rden/Powershell-Template-Modules/tree/master/Connect-Office365)



It's a fairly common process but including it in a script that is portable and performs environmental checks before running can be a bit of a pain. Having this log to file and be consistent in any script with Office 365 interaction is very useful to me

This script simply puts some belts and braces around importing the Office 365 modules and connecting to the service(s) inline with the [Powershell Template](http://vaines.org/powershell/Powershell-Framework.html) 

 
# Setup
* Create a project using the [Powershell Template](/archive/2017-05-28-powershell-framework/)
* Clone the [Connect-Office365.ps1](https://github.com/n3rden/Powershell-Template-Modules/tree/master/Connect-Office365/Connect-Office365.ps1) to the "Modules" folder of the template
* When the "Driver.ps1" is run, it will dot-source the Connect-Office365 functions
* Add "Connect-Office365" towards the beginning of your code block in the Driver.PS1 to connect to all the office 365 services
* Add "Disconnect-Office365 towards the end of the code block to disconnect from the services


# How does it work?
The module can be called for each service (Connect-ExOnline, Connect-SFBOnline, Connect-SCCOnline) or as a single command to connect all services (connect-office365). Assuming you go with the connect all services option it works something like this.

Connect-Office365 calls a number of other functions,
First Connect-ExOnline to connect to most Office 365 interfaces then Connect-SFBOnline for the Skype for Business interface and finally Connect-SCCOnline for the security and compliance service. 

Because each can run independently the first task each sub-function completes is to check if credentials have been provided and the initial connection has been made to the MSOL service. If not this gets completed and the script prompts for credentials and attempts to connect.

The specific PSSession for the function currently being called will then be created allowing access to any of the commandlets for that service. 

![screenshot1](/blog/2017-11-10-Template-module-Connect-Office365/psh-connecto365_1.png)

All this activity is recorded and stored in the application logs folder, a successful run should look something like this:
```
***************************************************************************************************
Started logging at [10/11/2017 18:27:27].
***************************************************************************************************
***************************************************************************************************
[10-11-2017 18:27:27] Loading Module: Connect-AD.ps1
[10-11-2017 18:27:27] Loading Module: Connect-Office365.ps1
[10-11-2017 18:27:27] Loading Module: Get-ADFunctions.ps1
[10-11-2017 18:27:27] Loading Module: Get-O365Licenses.ps1
[10-11-2017 18:27:27] Loading Module: Set-O365Licenses.ps1
[10-11-2017 18:27:27] Loading Module: Set-SkypeProfile.ps1
[10-11-2017 18:27:27] 	Importing AD Modules
[10-11-2017 18:27:27] Checking for ActiveDirectory Module
[10-11-2017 18:27:27] 		ActiveDirectory module is already loaded
[10-11-2017 18:27:27] 	Starting Connect-Office365
[10-11-2017 18:27:27] 	Connecting to Exchange Online
[10-11-2017 18:27:28] 		Enter your Office 365 admin credentials
[10-11-2017 18:27:36] 		Creating Exchange Online PS session
[10-11-2017 18:27:40] 			Exchange Online PS session built, connecting...
[10-11-2017 18:27:51] 				Connected
[10-11-2017 18:27:52] 	Connecting to Security & Compliance Center Online
[10-11-2017 18:27:52] 		Creating Security and Compliance Center PS Session
[10-11-2017 18:27:54] 			Security and Compliance Center PS session built, connecting...
[10-11-2017 18:28:01] 				Connected
[10-11-2017 18:28:01] 	Connecting to Skype For Business Online
[10-11-2017 18:28:02] 		SkypeOnlineConnector module loaded
[10-11-2017 18:28:02] 		Creating Skype PS session
[10-11-2017 18:28:02] 			Automatic Skype For Business endpoint discovery failed, trying to use manual 'AdminDomain'
[10-11-2017 18:28:19] 			Skype PS session built, connecting...
[10-11-2017 18:28:27] 				Connected
...
```
