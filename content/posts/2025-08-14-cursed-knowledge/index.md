---
draft: false
title: 'Cursed Knowledge'
author: Aiden Vaines
url: cursed
image: featured.png
featured: true
date: 2025-08-13T23:00:00.000Z
---

The creators of the Immich photo hosting app have a page for [Cursed Knowledge](https://immich.app/cursed-knowledge/) and the concept really resonated with me. In particular two really stood out, the JavaScript Dates indexing, and the Cloudflare workers redirect loop problem. I have without any shame ripped off that concept and intend to add to it as I go along in my journey.

{{< timeline >}}

  {{% event
    title="Fetch inside Cloudflare Workers is cursed"
    year="2025"
    icon="icons/cloud.svg"
    link="https://community.cloudflare.com/t/does-cloudflare-worker-allow-secure-https-connection-to-fetch-even-on-flexible-ssl/68051/5"
  %}}
Fetch requests in Cloudflare Workers use http by default, even if you explicitly specify https, which can often cause redirect loops.
  {{% /event %}}

  {{% event
    title="JavaScript Date objects are cursed"
    year="2023"
    icon="icons/code.svg"
    link="https://github.com/avaines/isitvickysbirthday.github.io/blob/main/script.js"
  %}}
JavaScript date objects are 1 indexed for years and days, but 0 indexed for months.
  {{% /event %}}

  {{% event
    title="Standard Unix tools on Macs are cursed"
    year="2019"
    icon="icons/tools.svg"
    link="https://unix.stackexchange.com/questions/352977/why-does-this-bsd-grep-result-differ-from-gnu-grep"
  %}}
That the BSD version of Grep, Sed etc are not the same as the GNU versions of the same tools and important args don't always exist. Leading to your scripts either checking for ggrep gsed etc, or checking to see if its the GNU one and failing if not or some other arcane nonsense.
  {{% /event %}}

  {{% event
    title="Cisco ASA NAT rules are cursed"
    year="2014"
    icon="icons/network.svg"
    link="https://community.cisco.com/t5/security-knowledge-base/asa-pre-8-3-to-8-3-nat-configuration-examples/ta-p/3116375"
  %}}
The Cisco ASA firmware upgrade from 8.2 to 8.3, despite being a minor version, contains a breaking change and fundamentally changed NAT.
  {{% /event %}}

{{< /timeline >}}
