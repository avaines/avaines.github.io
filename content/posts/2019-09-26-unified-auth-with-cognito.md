---
author: "Aiden Vaines"
title: "Unified authentication with AWS Cognito!"
description: "Unified authentication with AWS Cognito!"
date: 2019-09-26
# image: "posts/2019-09-26-unified-auth-with-cognito/featured.png"
featured: false
categories:
  - "AWS"
  - "Azure"
  - "Auth"
---

Attempts to minimise the number of credentials required is becoming more and more common, particularly with the adoption of social logins. Many well known services are backing off their authentication mechanisms to Google, Facebook, GitHub etc and passing a session token back to the initial site.

This greatly reduces the number of passwords someone needs to remember and allows things like MFA to be implemented easily without small sites/service having to invest the engineering time in building out their authentication mechanisms and maintaining them.

The downside of these authentication providers is they become a target, if an attacker gains access to say a Facebook account, all the 3rd party services that where linked to that account are now compromised too. The obvious solution is MFA, strong passwords and that the provider is prioritising security; it’s still better than the alternative where sites are compromised and it turns out passwords were stored in clear text along with credit card details.


 ![social login](/posts/2019-09-26-unified-auth-with-cognito/blg_cognito_social.png)

Recently I came across an application which needed to authenticate a set of users from 3 separate companies, (owner/client’s IT and two external companies). The requirements for the access boils down to everyone must have a named account for auditing but we don’t want to have to create everyone a new user account when the start on the project. The reasoning for this is as people start and leave it means three companies need to update their new starter and leavers processes and it’s hard enough getting one to do it.

All three companies have their own Azure AD environments set up already and this would be the ideal solution if we can get the application to redirect to Azure. The first and most obvious problem with this is the application would need to support 3 different Azure AD connections which isn’t something it can handle.

**Enter AWS Cognito!**

AWS cognito can be configured to act like an authentication concentrator, in this case each company creates an Azure AD Enterprise Application for the Cognito pool and we create an configuration for the target application. Cognito can be configured to use pretty much anything that supports OpenID Connect or SAML (or Facebook, Google or Amazon’s own store users). Additional users can be created within Cognito itself for adhoc or service/api users if needed.

 ![diagram](/posts/2019-09-26-unified-auth-with-cognito/blg_cognito_diagram.png)

Each of the companies will create an Azure Enterprise Application for the Cognito deployment as a SAML target and allow their relevant users access to said Enterprise App. This isn’t exactly a complicated process to complete.
Once the created, Azure will generate an XML document which needs to be added as an Identity Provider in Cognito and thats it. As long as a user is a member of a group with access to authenticate against that Enterprise Application Cognito will respect it.

Our target application is then setup to use Cognito over OpenID Connect. the application login redirects the user to Cognito which can then direct users to their Azure tenant. The downside to this approach is that the owner/client of the application must trust the other companies to have sufficient security and policies around access.
