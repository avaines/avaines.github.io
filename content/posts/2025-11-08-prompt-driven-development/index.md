---
draft: false
title: 'Prompt Driven Development; BDD but shift-left-y-er'
author: Aiden Vaines
image: featured.png
featured: true
categories:
  - Thought Leadership
  - AI
date: 2025-11-08T23:00:00.000Z
---

#### Déjà Vu in the IDE

Every few years the industry seems to come back to the same idea with a fresh lick of paint. Behaviour-Driven Development (BDD) was all the rage when I entered Platform Engineering, what feels like forever ago. With Cucumber, Gherkin, SpecFlow and the rest, the plan was to write tests in something approaching natural human language: Given … Then … When. It is not far from the familiar As a … I want … So that … format we use in user stories.

BDD taught us to describe intent rather than implementation. Now, with AI-assisted development tools, we seem to be going back to that with a new flavour. This time it's a language model rather than a test framework that handles the statements.

It's not quite history repeating itself, but it certainly rhymes. The same challenges remain: how do we express intent clearly enough for someone else to act on it, whether that's a developer or an AI service?

#### Prompt Club: The First Rule Is, You Always Tweak the Prompt

The current pattern across Cursor, GitHub Copilot, Duet, ChatGPT/Codex, or a local agent is similar. Start a chat. Describe what you are trying to do in a couple of paragraphs. Press *Go* and see what happens. After a few rounds you find a flow that works. I often start with COSTAR. Others I see a lot are RACE, RISEN, CRAFT and APE. They all point in the same direction: set context, pick a role to narrow focus, relate inputs, and describe the output.

If you are deep into prompt design you may have an [Agents.md](https://agents.md/) file where you state the role, tone and tooling instructions. Maybe you're getting really fancy with advanced prompt techniques like “apes strong together”, which can bizarrely nudges a cooperative, and energetic vibe in your AI chat. My favourite of these is including *“I’ll tip you £200”* with some researchers found to improve benchmark scores ([Li et al.](https://arxiv.org/abs/2307.11760v7)). Make of that what you will.

Developing with AI now feels like briefing a junior colleague. Most of the time and effort goes into refining tasks and thinking about how the ask will be interpreted. Your plan goes away with your bright eyed and bushy tailed colleague....and code happens. You then review, which sometimes takes longer than if you had done the task in the first place. Sometimes you have to go slow to go fast. In reviewing, you can fix-up the obvious bits, and clarify the request where you were vague or over-ambitious. At some point you realise you are writing feature scenarios and user stories again.....oh no.

#### Shift Left-ier

BDD grew out of Test-Driven Development (TDD) from the late '90s. The idea was to help everyone on the team, including non-technical stakeholders, share the same view of the requirements. The move from TDD to BDD shifted focus from “prove it works” to “agree what it should do”. It turned tests into a contract and cut down on ambiguity.

Teams have been moving critical tasks earlier in the Software Development Lifecycle (SDLC) for years. AI-aided development looks like another step in that direction to me. Whether it helps you do 80% faster and leaves headspace for the interesting 20%, or the ratio is flipped, the effect is similar. We are not only shifting tests left. We are shifting **intent** left. The abstraction layer is creeping from implementation into description.

> “There is no single development, in either technology or management technique, which by itself promises even one order-of-magnitude improvement within a decade in productivity, in reliability, in simplicity.”
> Fred Brooks, *No Silver Bullet* (1986)

In modern IDEs with AI plugins, the chat pane interprets our intent. If BDD helped less technical colleagues express testing intent, prompts do something similar. In most cases they are easier for those same people to read and write. After decades of formalising syntax and keywords for machines, we now have machines that tolerate our informal syntax.... more or less.

There's still a gap. BDD gave you explicit structure where as LLMs rely on implied understanding. Given some of the prompts I've seen people type into ChatGPT, the rigid constraints of BDD DSLs actually seem rather sensible.

#### Contracts and Prompts

Imagine the “Hello, World” of cloud apps, the **an image-resizing service**, you can write clean BDD scenarios and you can also phrase the same behaviour as AI-readable prompts for a coding assistant. Collected together, those prompts start to look like a **behavioural contract**.

| Task                     | Classic BDD (summary)                                                                                                                                                                                   | Prompt Contract                                                                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Uploading an image       | `Given a user selects an image; When they upload it; Then it is stored and a confirmation shown.`                                                                                                       | Build an upload endpoint that saves files securely and returns a success message confirming the upload.                                                                              |
| Resizing logic           | `Given a user has selected an image on their device <br>When they upload it through the web form <br>Then the image should be stored on the server <br>And a confirmation message should be displayed.` | After the image upload completes, automatically generate resized copies at 150 px, 500 px, and 1000 px widths. Store them under predictable file names that include the size suffix. |
| Returning download links | `Given the image has been resized <br>When the processing is complete <br>Then the user should see URLs for each resized version <br>And the links should be valid and accessible.`                     | Once resizing finishes, provide the user with a JSON response containing public URLs to each resized version. Each link should be valid and accessible from a browser.               |
| Handling invalid uploads | `Given the user tries to upload a non-image file <br>When the upload request is made <br>Then the system should reject the file <br>And display an appropriate error message.`                          | If the file isn’t an image (e.g. PDF or text), reject it gracefully and return “Unsupported file type. Please upload a valid image format.”                                          |
| Performance expectation  | `Given a valid image is uploaded <br>When it is resized <br>Then the response should be completed within 3 seconds.`                                                                                    | The resizing process should complete within roughly 3 seconds for typical image sizes (< 5 MB). Optimise where possible to meet that target.                                         |

#### Spec as Contract

If tests, scenarios or prompts act as an executable agreement, the code must meet them. Written as prompts, your agent should generate code that satisfies the agreement. The prompt set becomes a catalogue of statements. Slight wording changes alter behaviour. Different models and different days produce different code. If the contract holds, the app should still work.

What counts as “passing” when the contract is probabilistic? Real systems are not always deterministic, although we try to pin behaviour down with tests. A prompt-based agreement is not guaranteed either. The aim is a high enough probability of correct behaviour, given the quality of the prompt set.

[SpecKit](https://github.com/github/spec-kit) explores this path:

> *Spec-Driven Development flips the script on traditional software development. For decades, code has been king; specifications were scaffolding. Spec-Driven Development changes this: specifications become executable, generating working implementations rather than merely guiding them.*

SpecKit shows how natural-language specs can produce scaffolds. It is not magic. It does, however, get close to **executable intent**, or design as contract.

#### Our Infinite Monkeys Exclusively Use Neovim

There are some downsides to this Prompt Driven Design (PDD) approach, for which I'm coining as as a thing. The current AI tooling we have access to has known challenges, the biggest one is that it produces lowest common denominator code. All the models are trained on whats in Github, StackOverflow and similar, then its homogenised and regurgitated. If you picture AI as a room with infinite ~~monkeys~~ junior developers with infinite ~~typewriters~~ IDE's and target the tasks as you would for such an audience you tend to get better solutions. Clear, short, and well defined tasks get the best results. This same challenge is going to be very relevant when declaring prompts for our contract of intent.

Then there's all the bizarre stuff like hallucinations, post-rationalisation, context window escaping, invisible priors, glazing, model-poisoning, and training biases which we have to acknowledge and accept as the price of doing business with our new overlords. There are things we can do like well defined prompts, guardrails, and in depth code reviews. Not to mention the silly phrases that can drastically change the quality or direction of output I mentioned earlier.

There is another thing I've noticed with code written by AI which doesn't seem widely acknowledged and that's the love of the game. Solving problems, learning new techniques and ways to solve things is fun for those of us wired to enjoy this sort of thing. Solving a problem you've been banging against for a few hours releases a lovely little dopamine hit right through you, solving the same problems with AI tools does not do that, its like someone giving you the answers to a crossword, the puzzle gets done but you don't get the sense of achievement. I hope that embedding a pattern like Prompt Based Development in conjunction to more traditional TDD and just straight up writing code helps elevate the boring bits and save the hard gnarly parts that AI is poor at for us and a reminder that AI is not a silver bullet to solve all our problems, despite the hype surrounding it. Abstraction is a fine thing until it abstracts out the satisfaction.

I lost where I was going with this a little at the end there; I'm not suggesting Prompt Driven Development is the next big step in software delivery, more that it’s already happening, quietly, in how we work. We’ve slipped into describing behaviour again, testing intent before implementation, just with a chat window instead of Cucumber. It feels less like a new start and more like an old habit with better marketing.

Maybe BDD was never obsolete — it was just waiting for a more gullible listener.
