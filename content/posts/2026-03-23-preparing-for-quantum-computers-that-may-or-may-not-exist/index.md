---
title: 'Preparing for Quantum Computers That May or May Not Exist'
author: Aiden Vaines
image: featured.png
featured: true
draft: false
categories:
  - Thought Leadership
  - Quantum
  - AWS
  - Cryptography
  - Security
date: 2026-03-23T00:00:00.000Z
references:
  - https://blog.cloudflare.com/nists-first-post-quantum-standards/
  - https://en.wikipedia.org/wiki/NIST_Post-Quantum_Cryptography_Standardization#First_release
  - https://www.ncsc.gov.uk/schemes/assured-cyber-security-consultancy/pqc-pilot
  - https://www.quantamagazine.org/what-is-the-true-promise-of-quantum-computing-20250403/
  - https://www.cgi.com/uk/en-gb/blog/quantum-computing/public-key-infrastructure-and-post-quantum-cryptography-for-defence
  - https://www.cgi.com/uk/en-gb/viewpoint/quantum-computing/crossing-rubicon-post-quantum-cryptography
  - https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards
  - https://aws.amazon.com/about-aws/whats-new/2026/03/iam-roles-anywhere-post-quantum-digital-certificates/
  - https://aws.amazon.com/security/post-quantum-cryptography/
  - https://aws.amazon.com/blogs/security/aws-post-quantum-cryptography-migration-plan/
syndicate:
  - bluesky
  - devto
  - hashnode
  - mastodon
  - substack
---

In my day-to-day life as a Platform Engineer I find I spend an unusual amount of time thinking about identity. Not so much in the philosophical sense. In the much less interesting sense of certificates, tokens, key exchanges, and authentication. Logging in to AWS. Signing API calls. Issuing certificates. Rotating secrets. Establishing tunnels between systems that would rather not trust each other... and everything in between.

The cloud runs on cryptography and if that cryptography fails, all your data is someone else’s data and there are probably a lot of meetings and paperwork coming your way in what I’ve heard called a ‘CV-generating event’.

All of that is why post-quantum cryptography (PQC) has quietly moved from scary mathematics I hear about from [Numberphile](https://www.youtube.com/@numberphile/videos) into something we engineer-y types can be reasonably expected to at least recognise in a change log.

Recently AWS announced support for [post-quantum digital certificates in IAM Roles Anywhere](https://aws.amazon.com/about-aws/whats-new/2026/03/iam-roles-anywhere-post-quantum-digital-certificates/) using FIPS 204. That was the moment I stopped and wondered when all the other PQC stuff had appeared, and if I properly understood what, why, and importantly how it worked. Not from the perspective of a cryptographer but from the perspective of someone responsible for keeping production systems secure, fed, and watered.

Before getting into my current understanding, I and many others are not so much worried that quantum computers are here; it’s that so much data is being harvested ready to decrypt later. I remember when I was in my first year of college hearing about D-Wave promising they would have commercial quantum computers by the end of the year... it’s now 2026 and I’m still waiting.

I then remember Google and their “qubit processor” as I was heading into my time at uni. In researching this blog post I got to reminisce about the stuff I remember reading at the time. The 53-qubit processor that was demonstrating “quantum supremacy” in some creatively scoped benchmarking. Apparently IBM, IonQ and several others are operating machines with hundreds and thousands of qubits but these seem to be noisy and error-prone, not really given the enormous tasks like dismantling RSA.

The current estimates to crack RSA-2048 need millions of **stable** logical qubits along with all the error correction overheads needed. Current machines are still an order of magnitude below that.

That shouldn’t diminish the engineering and how cool this stuff is and the change it could bring though. Trying to manipulate physics at close to absolute zero temperatures is cool as all hell, but practically we’ve got a bit of work to do before the doomsday scenario that’s been attached to PQC since the start.

> *“At last IIa said, ‘What does “quantum” mean anyway?’
> IIb shrugged. ‘It means add another nought,’ he said.”*
> — *Pyramids, Terry Pratchett*

## Harvest Now, Decrypt Later

Whilst we don't have quantum computers capable of making our strongest encryption trivial just yet, everyone assumes they are coming; the maths and physics are understood at least in theory. Governments and standards bodies seem to be taking this seriously.

We know that there are massive Harvest Now, Decrypt Later (HNDL) operations; scraping huge volumes of data from everywhere and storing it, from corporates to state actors. Although that data is useless now, *theoretically* as soon as it becomes trivial to decrypt it’s a potential gold mine. Healthcare data, government communication, intellectual property, and long-lived secrets can remain valuable for decades. If quantum computers appear in the next 15–20 years, it’s all worth it. Given what we've seen with the rise of AI and especially the speed it has become ubiquitous, it’s not particularly far-fetched to imagine.

Agencies like NIST and the UK National Cyber Security Centre (NCSC) have spent nearly a decade running formal competitions to select some “quantum-resistant” algorithms to start making HNDL less and less of a viable strategy. My company, CGI, is recognised as one of the NCSC’s Post-Quantum Cryptography Assured Consultancy providers — as interesting as it is, it's not a part of the business I have any involvement with. Whilst I may spend my time with serverless functions, pipelines, and containers, securing those things in transit and the data they move around is a big part of my work too.

## Post-Quantum Cryptography Standards

In 2024 NIST finalised the first group of post-quantum cryptographic standards, of which four were selected. Three of those are now formalised as **FIPS standards**, with an additional algorithm kept as a backup option. When I was first aware of this they had much cooler names; since then they’ve all been given fairly boring standardised names I’ve put them both in this table.

| Original Name | Standard Name | Purpose |
| --- | --- | --- |
| Kyber | **ML-KEM (FIPS 203)** | Key encapsulation / encryption |
| Dilithium | **ML-DSA (FIPS 204)** | Digital signatures |
| Falcon | **FALCON / FN-DSA (FIPS 205 draft)** | Digital signatures |
| SPHINCS+ | **SLH-DSA** | Hash-based signatures (backup option) |

The naming scheme is slightly boring but makes sense once decoded:

- **KEM** = Key Encapsulation Mechanism
- **DSA** = Digital Signature Algorithm
- **ML** = Module-Lattice
- **SLH** = Stateless Hash-based

Most of the interesting work happens in something called **lattice-based cryptography**, which is where algorithms like Kyber and Dilithium originate and the thing that piqued my interest, ultimately instigating me writing this post.

In cryptography, a *lattice* is apparently a repeating grid of points in higher-dimensional space. Many PQC algorithms rely on the mathematical difficulty of solving problems such as finding the shortest vector in a lattice, or solving a noisy linear equation over it. From what I can understand, these problems appear to be extremely difficult even for quantum computers — I don’t know how we know that, but it sounds cool.

Where classical algorithms rely on number theory problems like *integer factorisation (RSA)* or *elliptic curve discrete logarithms (ECDSA)*, PQC algorithms instead rely on lattice problems that are just really hard to solve efficiently, both classically and by quantum means.

The downside is that lattice schemes tend to produce much larger keys and signatures, which I think means things are just going to take longer to do computationally. I suspect this just makes the internet slightly slower long term as a “just in case” mechanism to keep data secure.

Which from a platform engineering perspective, is where things start getting operationally interesting.

## New Algo, Who Dis?

From an infrastructure perspective each of these already has a place and replaces an existing algorithm used today. Starting with Kyber:

### ML-KEM (Kyber)

**Kyber is a** secure key exchange algorithm which replaces the role of RSA key exchange or elliptic-curve Diffie-Hellman in protocols like TLS:

1. Client and server exchange public information
2. Both derive the same shared secret
3. That secret becomes the symmetric encryption key

### ML-DSA (Dilithium) and FALCON

Digital signature algorithms.

These replace RSA or ECDSA signatures, used for things like:

- TLS certificates
- Code signing
- Identity assertions

Dilithium appears to be simpler to implement while Falcon produces smaller signatures but is more complex mathematically. I suspect that particular trade-off will decide which one actually sees wider use down the line.

### SLH-DSA (SPHINCS+)

Other than ruining the naming trend after Warp Drive fuel and Lightsaber energy crystals, SPHINCS+ is a hash-based signature scheme. It’s slower and produces really large signatures, but it has a valuable property: its security relies only on the strength of cryptographic hash functions, which are reasonably well understood.

## The Future Is Now

The interesting part for me as a Platform Engineer is that PQC is quietly showing up in various services and has been for some time now.

I most recently noticed it in a recent AWS announcement, which was the final incentive to do some more digging and put my thoughts together.

AWS recently introduced support for post-quantum certificates using ML-DSA (FIPS 204) in [IAM Roles Anywhere](https://aws.amazon.com/about-aws/whats-new/2026/03/iam-roles-anywhere-post-quantum-digital-certificates/). This allows external workloads to authenticate to AWS using certificates signed with PQC algorithms rather than traditional RSA or ECDSA, and hopefully be more prepared for HNDL-style risks.

Several cloud providers and CDNs have begun experimenting with hybrid TLS key exchanges, combining a classical algorithm (e.g. X25519) and a post-quantum algorithm (e.g. Kyber / ML-KEM). Both keys must be compromised for the session to be broken. This allows systems to gain quantum resistance without abandoning existing cryptographic infrastructure.

Cloudflare has already deployed hybrid TLS in production experiments and similar approaches are appearing across the ecosystem.

AWS has a Post Quantum Cryptography migration plan which boils down to inventorying cryptographic dependencies, introducing hybrid cryptography, then gradually moving to PQC where practical. Given I know a few places where SSL 1.0 is still knocking about, I’m not expecting we’ll complete this quickly.

## So… Now What?

For cryptographers, mathematicians, and some InfoSec professionals, the interesting questions involve proofs and security reductions. For me, the questions are more mundane (and only partially because I don’t understand the maths, and partially because a lattice is still a pastry from Greggs to me).

The ones that stand out most to me are:

- **Key sizes** – PQC public keys and signatures can be significantly larger than RSA/ECDSA equivalents. How large are these going to be in real deployments? Does my secrets management system support them? AWS Systems Manager Parameter Store’s 4KB limit is already pushing it.
- **Network overhead** – larger handshakes increase TLS negotiation size, throughput, and bandwidth consumption. Some providers charge for that.
- **CPU impact** – some PQC algorithms require more computation. What does that do to all my right-sizing spreadsheets?
- **Certificate chains** – larger signatures propagate through the entire PKI. At scale, that becomes noticeable — and expensive.

The common guidance seems to favour hybrid approaches: Kyber-based key exchange combined with classical signatures, keeping overheads manageable while adding quantum resistance.

### Cryptographers make algorithms viable. Platform Engineers make them deployable.

Quantum computing has followed a fairly familiar hype cycle. Early claims of revolutionary machines, followed by quieter but genuinely impressive (and limited) systems. Somewhere along the way governments and standards bodies started preparing for a future that may arrive gradually rather than suddenly.

In the meantime, cloud providers are already introducing post-quantum primitives into identity and encryption systems.

Even if quantum computers capable of breaking RSA are decades away, post-quantum cryptography has already arrived in the platforms we use. If nothing else, it’s a reminder that the cloud is mostly made of mathematics and physics wearing a trench coat.

> *“It’s very hard to talk quantum using a language originally designed to tell other monkeys where the ripe fruit is.”*
> — *Night Watch, Terry Pratchett*

For the moment, the best I think we non-mathematicians can do is keep an eye on the primitives appearing in our infrastructure, understand roughly what they do, and make sure that when the future eventually arrives it does not break all our toys.

I’ve quoted the man who first introduced me to the word “quantum” twice already, so it seems only fair to finish properly:

**GNU Terry Pratchett.**
