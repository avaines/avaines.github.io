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
date: 2026-03-11T00:00:00.000Z
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




------- AI NONSENSE BE HERE ------

Platform engineers spend an unusual amount of time thinking about identity.

Not in the philosophical sense. In the much less interesting sense of certificates, tokens, key exchanges, and authentication flows. Logging in to AWS. Signing API calls. Issuing TLS certificates. Rotating secrets. Establishing tunnels between systems that would rather not trust each other.

The cloud runs on cryptography. If that cryptography fails, everything else fails shortly afterwards.

Which is why post-quantum cryptography (PQC) has quietly moved from theoretical mathematics into something infrastructure engineers are expected to at least recognise in a changelog.

Recently AWS announced support for **post-quantum digital certificates in IAM Roles Anywhere** using **FIPS 204**. That was the moment this stopped being purely academic for me. If the cloud providers are wiring this into identity infrastructure, it’s time to understand what is actually happening.

Not from the perspective of a cryptographer, but from the perspective of someone responsible for keeping production systems secure.

---

## Quantum computers: impressive, but not here yet

Before getting into post-quantum cryptography, it is worth grounding the conversation in reality.

Despite the headlines, **we do not currently have quantum computers capable of breaking modern public-key cryptography**.

What we have instead are impressive but extremely constrained experimental systems.

Google’s well-publicised **53-qubit processor** demonstrated “quantum supremacy” in a very narrow benchmark problem. IBM, IonQ and others now operate machines with **hundreds or occasionally over a thousand qubits**, but these are **noisy, error-prone qubits** that cannot yet run the enormous fault-tolerant computations required for attacks like Shor’s algorithm against RSA.

Breaking RSA-2048, for example, is estimated to require **millions of stable logical qubits**, along with massive error correction overhead. Current machines operate orders of magnitude below that scale.

This doesn’t diminish the engineering involved. Building machines that manipulate fragile quantum states at millikelvin temperatures is astonishing. But from a practical cryptographic threat perspective, we are still firmly in the **Noisy Intermediate-Scale Quantum (NISQ)** era.

Which makes the current situation slightly awkward: we’re preparing for computers that might exist in the future, using models that assume they eventually will.

Or, as Terry Pratchett put it:

> *“At last IIa said, ‘What does “quantum” mean anyway?’
> IIb shrugged. ‘It means add another nought,’ he said.”*
> — *Pyramids*

---

## The real risk: Harvest Now, Decrypt Later

If quantum computers capable of breaking RSA do not exist yet, why are governments and standards bodies taking this seriously now?

The answer is a threat model called **Harvest Now, Decrypt Later (HNDL)**.

An attacker does not need a quantum computer today. They only need to **collect encrypted data today** that may still be sensitive in the future.

Healthcare data, government communications, intellectual property, and long-lived secrets can remain valuable for decades. If someone records that encrypted traffic now, and quantum computers appear in 15 or 20 years, it may become decryptable.

For workloads dealing with long-term confidentiality — healthcare systems included — that is a non-trivial concern.

This is why agencies like **NIST** and the **UK National Cyber Security Centre (NCSC)** have spent nearly a decade running formal competitions to select quantum-resistant algorithms.

And it’s also why my employer, **CGI**, being recognised as one of the NCSC’s **Post-Quantum Cryptography Assured Consultancy providers** is rather interesting to see from inside the industry.

Even if my day-to-day job involves Kubernetes clusters rather than number theory.

---

## NIST’s first post-quantum cryptography standards

In 2024 NIST finalised the first group of post-quantum cryptographic standards. Four algorithms were selected.

Three are now formalised as **FIPS standards**, and one additional algorithm is kept as a backup option.

| Original Name | Standard Name                        | Purpose                               |
| ------------- | ------------------------------------ | ------------------------------------- |
| Kyber         | **ML-KEM (FIPS 203)**                | Key encapsulation / encryption        |
| Dilithium     | **ML-DSA (FIPS 204)**                | Digital signatures                    |
| Falcon        | **FALCON / FN-DSA (FIPS 205 draft)** | Digital signatures                    |
| SPHINCS+      | **SLH-DSA**                          | Hash-based signatures (backup option) |

The naming scheme is slightly bureaucratic but straightforward once decoded:

* **KEM** = Key Encapsulation Mechanism
* **DSA** = Digital Signature Algorithm
* **ML** = Module-Lattice
* **SLH** = Stateless Hash-based

Most of the interesting work happens in **lattice-based cryptography**, which is where algorithms like Kyber and Dilithium originate.

This was the point where I realised my mental model of “lattice” came from rock climbing training rather than mathematics.

---

## What a “lattice” means in cryptography

In cryptography, a **lattice** is essentially a repeating grid of points in high-dimensional space.

Many PQC algorithms rely on the mathematical difficulty of solving problems such as:

* finding the shortest vector in that lattice
* solving noisy linear equations over that lattice

These problems appear to be extremely difficult even for quantum computers.

Where classical algorithms rely on number theory problems like **integer factorisation (RSA)** or **elliptic curve discrete logarithms (ECDSA)**, PQC algorithms instead rely on **lattice problems that have resisted efficient attacks from both classical and quantum algorithms**.

The downside is that lattice schemes tend to produce **much larger keys and signatures**.

Which, from a platform engineering perspective, is where things start getting operationally interesting.

---

## What these algorithms actually do

From an infrastructure perspective, there are two categories that matter.

### ML-KEM (Kyber)

**Purpose:** secure key exchange.

This replaces the role of **RSA key exchange or elliptic-curve Diffie-Hellman** in protocols like TLS.

In simplified terms:

1. Client and server exchange public information
2. Both derive the same shared secret
3. That secret becomes the symmetric encryption key

ML-KEM is designed to remain secure even against attackers with quantum computers.

### ML-DSA (Dilithium) and FALCON

**Purpose:** digital signatures.

These replace **RSA or ECDSA signatures**, used for things like:

* TLS certificates
* code signing
* identity assertions

Dilithium tends to be simpler to implement, while Falcon produces smaller signatures but is more complex mathematically.

### SLH-DSA (SPHINCS+)

This is a **hash-based signature scheme**.

It is slower and produces very large signatures, but it has a valuable property: its security relies only on the strength of cryptographic hash functions, which are well understood.

Because of this, it is often viewed as a **conservative fallback option**.

---

## Where this already appears in the cloud

The interesting part for platform engineers is that PQC is quietly showing up in infrastructure services.

Examples include:

### AWS IAM Roles Anywhere

AWS recently introduced **support for post-quantum certificates** using **ML-DSA (FIPS 204)**.

This allows external workloads to authenticate to AWS using certificates signed with PQC algorithms rather than traditional RSA or ECDSA.

For systems integrating on-premise infrastructure with AWS identity, this is a notable step.

### Hybrid TLS

Several cloud providers and CDNs have begun experimenting with **hybrid TLS key exchanges**.

These combine:

* a classical algorithm (e.g. X25519)
* a post-quantum algorithm (e.g. Kyber / ML-KEM)

Both keys must be compromised for the session to be broken.

This approach allows systems to gain **quantum resistance without abandoning existing cryptographic infrastructure**.

Cloudflare has already deployed hybrid TLS in production experiments, and similar approaches are appearing across the ecosystem.

### AWS PQC roadmap

AWS has published a migration approach centred around:

1. **Inventorying cryptographic dependencies**
2. **Introducing hybrid cryptography**
3. Gradually moving to **pure PQC where practical**

This mirrors guidance from NIST and NCSC.

From an infrastructure perspective, the important takeaway is simple:

PQC will likely arrive **incrementally through hybrid protocols**, not as a sudden switch.

---

## The practical engineering questions

For cryptographers the interesting questions involve proofs and security reductions.

For platform engineers the questions are more mundane.

For example:

* **Key sizes** – PQC public keys and signatures can be significantly larger than RSA/ECDSA equivalents.
* **Network overhead** – larger handshake messages increase TLS negotiation size.
* **CPU impact** – some PQC algorithms require more computation.
* **Certificate chains** – larger signatures propagate through the entire PKI.

In large distributed systems these details matter.

If a TLS handshake suddenly grows by several kilobytes across millions of connections per second, that becomes noticeable very quickly.

Which is why many real deployments currently favour **Kyber-based key exchange combined with classical signatures**.

---

## The platform engineer’s role

I am not designing cryptographic primitives.

That job belongs to people with significantly stronger mathematics backgrounds.

What I care about is **how these algorithms surface in systems I operate**.

Questions like:

* Which AWS services support PQC today?
* What impact does hybrid TLS have on latency?
* How do certificate authorities issue PQC certificates?
* How large do keys become in real deployments?

Those are the practical concerns.

Cryptographers make the algorithms viable. Platform engineers make them **deployable**.

---

In cryptography, primitives are the basic building blocks used to construct security systems.

They are small, well-defined algorithms that perform one specific security function. More complex protocols (like TLS, SSH, or PKI) are built by combining several primitives together.

Common examples include:

Hash functions – e.g. SHA-256, used for integrity and fingerprints

Encryption algorithms – e.g. AES, used to keep data confidential

Key exchange mechanisms – e.g. Diffie-Hellman, used to establish shared secrets

Digital signature algorithms – e.g. RSA, ECDSA, used to prove identity

Post-quantum algorithms such as ML-KEM (Kyber) or ML-DSA (Dilithium) are simply new cryptographic primitives designed to replace classical ones that could be broken by quantum computers.

So when people say “new primitives are appearing in cloud infrastructure”, they mean the underlying cryptographic algorithms used by systems like TLS, certificates, or identity services are changing.

---

## A slightly British conclusion

Quantum computing has followed a hype cycle that feels familiar.

There were the early claims of revolutionary machines. Then the quieter reality of extremely impressive but limited systems. Somewhere along the way governments and standards bodies started preparing for a future that may arrive gradually rather than suddenly.

In the meantime, cloud providers are already introducing **post-quantum primitives into identity and encryption systems**.

Which means that even if quantum computers capable of breaking RSA are decades away, **post-quantum cryptography has already arrived in the platforms we use**.

If nothing else, it is another reminder that the cloud is mostly made of mathematics wearing a networking trench coat.

And, perhaps, one final observation from Terry Pratchett:

> *“It’s very hard to talk quantum using a language originally designed to tell other monkeys where the ripe fruit is.”*
> — *Night Watch*

For the moment, the best we can do is keep an eye on the primitives appearing in our infrastructure, understand roughly what they do, and make sure that when the future eventually arrives it does not break all our certificates.

And, of course, since I've quoted him twice,
**GNU Terry Pratchett.**
