---
author: "Aiden Vaines"
title: "PowerShell Framework Module: Connect-AD"
date: 2017-05-28T00:00:00Z
description: "A Active Directory connection module for my PowerShell Framework"
# featured_image: /blog/2017-10-12-Template-module-Connect-AD/featured.jpeg
tags: [
  "code",
  "powershell",
  "posh-fw",
]
---
One of the most common things I use Powershell for requires the ActiveDirectory module. In its self, this isn't an issue, I know I have it installed and that it will import automatically. The problem comes when sending or transferring the script to someone else.

[Follow this project on GitHub](https://github.com/n3rden/Powershell-Template-Modules/tree/master/Connect-AD)


If the device running the script doesn't have some modules installed or available a script will fall-over.

This script simply puts some belts and braces around importing the ActiveDirectory module inline with the [Powershell Framework](/blog/2017-05-28-powershell-framework/)

 
# Setup
* Create a project using the [Powershell Framework](/archive/2017-05-28-powershell-framework/)
* Clone the [Connect-AD1.ps1](https://github.com/n3rden/Powershell-Template-Modules/blob/master/Connect-AD/Connect-AD.ps1) to the "Modules" folder of the template
*  When the "Driver.ps1" is run, it will dot-source the Connect-AD functions and check for an RSAT installation then attempt to import the ActiveDirectory module


# How does it work?
The script will check for an RSAT installation

![Flow](/blog/2017-10-12-Template-module-Connect-AD/psh-tmp-adconnect-flow.png)


The logs produced should look like this
```
*************************************************************
Started logging at [11/10/2017 15:46:01].
*************************************************************
*************************************************************

[11/10/2017 15:46:01] Loading Module: Connect-AD
[11/10/2017 15:46:01] 	Importing AD Modules
[11/10/2017 15:46:01] Checking for ActiveDirectory Module
[11/10/2017 15:46:01] 		ActiveDirectory module is already loaded
...
```
