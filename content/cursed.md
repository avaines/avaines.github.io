---
title: "Cursed Knowledge"
layout: "about"
draft: false

generic_timeline:
  enable: true
  generic_timelines:
    - title: Fetch inside Cloudflare Workers is cursed
      description: Fetch requests in Cloudflare Workers use http by default, even if you explicitly specify https, which can often cause redirect loops.
      date: 2025-04-09
      icon: /icons/cloud.svg
      link: https://community.cloudflare.com/t/does-cloudflare-worker-allow-secure-https-connection-to-fetch-even-on-flexible-ssl/68051/5

    - title: JavaScript Date objects are cursed
      description: JavaScript date objects are 1 indexed for years and days, but 0 indexed for months.
      date: 2023-10-28
      icon: /icons/code.svg
      link: https://github.com/avaines/isitvickysbirthday.github.io/blob/main/script.js

    - title: Cisco ASA NAT rules are cursed
      description: The Cisco ASA firmware upgrade from 8.2 to 8.4, despite being a minor version, contains a breaking change and fundamentally changed NAT.
      date: 2014-08-10
      icon: /icons/network.svg
      link: https://community.cisco.com/t5/security-knowledge-base/asa-pre-8-3-to-8-3-nat-configuration-examples/ta-p/3116375
---

## Cursed Knowledge
#### Cursed knowledge i've been unfortunate to learn

The creators of the Immich photo hosting app have a page for [Cursed Knowledge](https://immich.app/cursed-knowledge/) and the concept really resonated with me. In particular two really stood out, the JavaScript Dates indexing, and the Cloudflare workers redirect loop problem. I have without any shame ripped off that concept and intend to add to it as I go along in my journey.


