---
author: "Aiden Vaines"
title: "Script to flash populate an Active Directory lab!"
date: 2017-05-28
description: "A small PowerShell Framework"
# featured_image: /blog/2017-09-10-Flash-Populate-AD-Lab/featured.jpeg
tags: [
    "code",
    "powershell",
]
---

When you need to test Active Directory in a lab with sample users, creating sufficiently realistic test accounts is a time consuming and tedious process. There are a few quick scripts for creating something similar but many of them only create basic users which don’t emulate a production environment very well.

[Follow this project on GitHub](https://github.com/n3rden/Random-Powershell-Scripts/tree/master/Start-LabADPopulate)


This script will create users with the following attributes:

* **SAMAccount Name** – A unique ID number authenticate a user
* **Name** – A user has a full name sourced from a list of regional names
* **Address** – People need an address, again regionally sourced addresses from Germany, Spain, Italy, France, Poland and the United Kingdom
* **Email Address**
* **Company** – Most sufficiently large organisations have multiple internal companies, this script accepts a list of possible companies and assigns each user a random one
* **Department** – Large organisations have many departments, this script accepts a list of possible departments and assigns each user a random one
* **Job Title** – Similar to departments, each department often has multiple roles, this script records what job roles exist in each department and assigns a random one to the user
* **Manager** – People have managers. After creating the user accounts, the script will assign each user a manager from their department and company (A “Manager” does have to be a valid job role in the department the user is assigned to for this to work)
* **EmployeeNumber** – Some organisations assign an ID number to users, this is especially helpful when people have non-alphanumeric characters in their name


# Setup
* You will need to prepare the AD environment by creating the following OU structure first:
```
LAB.local
     \---Company
         \---Users</code>
```

* Update the first 30 or so lines of the script to match your lab environment
    *   This is the OU in your lab where the user accounts will reside
        ```
        # User properties
        # Base OU for users, sub OU for country code will be created
        $BaseOU = "OU=Users,OU=Company,DC=lab,DC=local"
        ```
    * The Domain Details include the Org short name and full DNS suffix, this will be used, as the comments say, to construct the UPNs for each user.
        ```
        # Domain Details
        $orgShortName = "LAB" # This is used to build a user's sAMAccountName
        $dnsDomain = "lab.local" # Domain is used for e-mail address and UPN
        ```
    * A list of companies within the organisation a user could belong to. Some organisations have smaller companies within, this helps model that structure. In most cases this can just be left as is depending on what you are trying to test. Each user will be assigned a company from this list at random.
        ```
        #Companies the user could be part of
        $Companies = @("Lab Corp", "Lab Ltd", "Env. Testing Industries", "MyLab Inc.")
        ```
    * A list of departments, each with a set of job roles. Each user will be assigned a random department and a role/position from within it. Once the script has finished creating the users, it will run back through all the users it created and assign everyone in each department a manager from the same department and company.
        ```
        # Departments and their sub positions users could be part of
        # Departments and associated job titles to assign to the users
        $Departments = ( 
                  @{"Name" = "Finance & Accounting"; Positions = ("Manager", "Accountant", "Data Entry")},
                  @{"Name" = "Human Resources"; Positions = ("Manager", "Administrator", "Officer", "Coordinator")},
                  @{"Name" = "Sales"; Positions = ("Manager", "Representative", "Consultant")},
                  @{"Name" = "Marketing"; Positions = ("Manager", "Coordinator", "Assistant", "Specialist")},
                  @{"Name" = "Engineering"; Positions = ("Manager", "Engineer", "Scientist")},
                  @{"Name" = "Consulting"; Positions = ("Manager", "Consultant")},
                  @{"Name" = "IT"; Positions = ("Manager", "Engineer", "Technician")}
               )
        ```
    * Each user will be assigned a random role for this list. Update it as required
        ```
        $employeeTypes = @("EMP", "Regular", "Contractor", "Fixed Term Regular", "Temporary", "Full-Time")
        ```
    * Finally, the path for the user data, as long as the fields are the same feel free to replace/update it.
        ```
        $UsersFile = ".\FakeUserData.csv"
        ```

# How does it work?
The script will create a user account for each user in the “FakeUserData.csv” file with the following information:
* **SAMAccount Name** – A unique ID number authenticate a user
* **Password** – Users have passwords, and not all set to “Password1!” or something equally as daft
* **Name** – A user has a full name sourced from a list of regional names
* **Address** – People need an address, again regionally sourced addresses from Germany, Spain, Italy, France, Poland and the United Kingdom
* **Email Address**
* **Company** – Most sufficiently large organisations have multiple internal companies, this script accepts a list of possible companies and assigns each user a random one
* **Department** – Large organisations have many departments, this script accepts a list of possible departments and assigns each user a random one
* **Job Title** – Similar to departments, each department often has multiple roles, this script records what job roles exist in each department and assigns a random one to the user
* **Manager** – People have managers. After creating the user accounts, the script will assign each user a manager from their department and company (A “Manager” does have to be a valid job role in the department the user is assigned to for this to work)
* **EmployeeNumber** – Some organisations assign an ID number to users, this is especially helpful when people have non-alphanumeric characters in their name

Each user created will be done so with a random company, a random department and a random role within that department.

As a final task the script will in back through all the AD accounts in the $BaseOU organizational unit and for each of the companies set in $Companies find each department and assign everyone a random manager from the same department in the same company.

If you want the environment to do something different with the SAM account names like “first.last” you will need to update line 73 to something like
```
New-AdUser -SamAccountName $User.Username -Name $UserFullName -Path $UserOUPath -AccountPassword $UserPassword -Enabled $True `
```
to something like this:

```$NewUsername = $User.givenname + "." + $User.Surname
New-AdUser -SamAccountName $NewUsername -Name $UserFullName -Path $UserOUPath -AccountPassword $UserPassword -Enabled $True `
```

# Credit
The information stored in “FakeUserData.csv” was provided by [fakenamegenerator.com](https://www.fakenamegenerator.com/) and contains around 600 random users doted around Europe in the following countries:

* Germany
* Spain
* Italy
* France
* United Kingdom
* Poland
