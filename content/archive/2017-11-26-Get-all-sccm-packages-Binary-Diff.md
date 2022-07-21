---
author: "Aiden Vaines"
title: "Script to get the binary differential replication status of all SCCM packages"
date: 2017-11-26
description: "A Office365 AD connection module for my PowerShell Framework"
featured_image: /blog/2017-11-26-Get-all-sccm-packages-Binary-Diff/featured.jpg
tags: [
  "code",
  "powershell",
  "sccm",
]
---

# Problem
An SCCM Environment I was looking at had a few hundred application packages. I needed to find out which were enabled for “Binary Differential Replication” to get to the bottom of some bandwidth issues that didn’t add up.

This option is set under “Data Source”

![screenshot1](/blog/2017-11-26-Get-all-sccm-packages-Binary-Diff/sccm-bdr-1.png)

I figured there would just be a true or false variable for this check box so I ran “Get-CMPackage –id “XXXXXXX” on a package I knew had it enabled. There wasn’t.

I thought maybe the object was nested in another field somewhere so found a package where Binary Differential wasn’t enabled, saved the output of “Get-CMPackage –id “XXXXXX”” to a variable/object and enabled the feature. Saved the output of the same command to another variable/object and compared the two.

Enabling the Binary Differential option changed a PkgFlags option, some digging around on the internet lead me to see other people trying to accomplish something similar. All the solutions I came across varied in approach but all seemed to use a WMI filter. 

I wanted a PowerShell native solution, Microsoft kindly produced a list of the WMI Class the other solutions were using [here on MSDN](https://msdn.microsoft.com/library/hh469117.aspx).

| Hexadecimal (Bit) | Description |
|---|:---|
| 0x04000000 (26) | USE_BINARY_DELTA_REP. Marks the package to be replicated by distribution manager using binary delta replication. |

It turns out the PkgFlags is just a Uint32 or hex value which I should be able to check against pretty easily. the actual PkgFlags value can be obtained with get-cmpackage

# Solution
My Solution to the problem is to take a list all packages in the environment and check if the “PkgFlags” value matches a bitwise operation for the value in the MSDN provided table. 

    $Status = @()
    get-cmpackage | foreach {
        $CMPackage = New-Object System.Object

        $CMPackage | Add-Member -type NoteProperty -name Name -value $_.name
        $CMPackage | Add-Member -type NoteProperty -name Manufacturer -value $_.Manufacturer
        $CMPackage | Add-Member -type NoteProperty -name PackageID -value $_.PackageID

        #Check for USE_BINARY_DELTA_REP/0x04000000 (26)
        if ($_.pkgflags -eq ($_.pkgflags -bor 0x04000000 )) {
            "Binary Delta Replication Bit Enabled {0}" -f $_.Packageid + " " + $_.Name
            $CMPackage | Add-Member -type NoteProperty -name USE_BINARY_DELTA_REP -value "true"
        
        }else{
            "Binary Delta Replication Bit Disabled {0}" -f $_.Packageid + " " + $_.Name
            $CMPackage | Add-Member -type NoteProperty -name USE_BINARY_DELTA_REP -value "false"
        }

        $Status += $CMPackage

    }#EndFor

    $Status | Out-GridView


# How it works
The first operation is to create  new array called $Status. The idea being this will hold a complete list of all the results as we run through the available packages.

    $Status = @()

We then get a list of all packages in the environment, for each package we run some checks and create a new object containing the name, manufacturer and package ID.

    get-cmpackage | foreach {
    $CMPackage = New-Object System.Object

    $CMPackage | Add-Member -type NoteProperty -name Name -value $_.name
    $CMPackage | Add-Member -type NoteProperty -name Manufacturer -value $_.Manufacturer
    $CMPackage | Add-Member -type NoteProperty -name PackageID -value $_.PackageID

To calculate if the Binary Differential feature is enabled we perform a bitwise operation (-bor) on the “pkgflags” attribute to check if it matches the hex value 0x04000000 as per the table on the MSDN page. We then add another attribute to the object created above containing “True” or “False”

    #Check for USE_BINARY_DELTA_REP/0x04000000 (26)
    if ($_.pkgflags -eq ($_.pkgflags -bor 0x04000000 )) {
      "Binary Delta Replication Bit Enabled {0}" -f $_.Packageid + " " + $_.Name
      $CMPackage | Add-Member -type NoteProperty -name USE_BINARY_DELTA_REP -value "True"
    
    }else{
      "Binary Delta Replication Bit Disabled {0}" -f $_.Packageid + " " + $_.Name
      $CMPackage | Add-Member -type NoteProperty -name USE_BINARY_DELTA_REP -value "False"
    }

Finally, we add the object for this package to the object created in the first step, this will end up containing a list of all available packages once they have been checked

    $Status += $CMPackage
    }#EndFor

We can then just output this to a grid view (or to csv or similar)

    $Status | Out-GridView 

