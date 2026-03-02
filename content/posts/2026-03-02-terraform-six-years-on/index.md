---
title: 'Terraform Six Years On (Retrospective)'
author: Aiden Vaines
image: featured.png
featured: true
draft: false
categories:
  - Thought Leadership
  - IAC
  - Terraform
  - Retrospective
date: 2026-03-02T00:00:00.000Z
references:
  - /posts/2019-10-19-starting-terraform-taxing-tangled-a-bit-tenuous/
---

Back in 2019 when I started at BJSS as a fairly junior Platform Engineer I was first introduced to Terraform around the time when 0.11 and 0.12. If you remember that migration path, you'll know it wasn't exactly the gentlest onboarding experience.

I immediately found myself surrounded by patterns, wrappers, and opinions that solved problems I didn't yet understand. [I wrote about that confusion at the time](/posts/2019-10-19-starting-terraform-taxing-tangled-a-bit-tenuous/), trying to articulate why Terraform felt chaotic.

Six years on, I like to think I’m reasonably proficient. I’ve built, maintained and supported multiple services across multiple programmes where Terraform is the sole method for declaring infrastructure. I mentor engineers who are where I once was. I’ve broken things, refactored things, migrated state, inherited other people’s *creative* directory structures, I've even [solved Advent of Code puzzles with Terraform Locals](https://github.com/avaines/advent_of_code/blob/main/2022/Day%201%20Calorie%20Counting/day1_but_in_terraform.tf); which is either a sign of confidence, or poor life choices.

One of the things which I still think is poorly explained is how to structure a good Terraform project. And by good I mean multiple environments, minimal drift, and clear enough that someone joining the team can understand it without archaeology. In 2019 this was a huge mental knot for me: how do you keep environments separate, avoid sharing state disasters, stay reasonably [DRY][dry] and not disappear into abstraction?

Early on I felt Terraform was powerful but was a bit feral. It would do exactly what you asked; including the things you didn’t mean.

## Boring is Good

These days I start with the most boring solution possible.

Ignore the urge, to abstract, and prematurely optimise for [DRY][dry] principles, but remember why  [DRY][dry]  exists and balance it against cognitive load. I want something close to "Change a tfvars file and go" not a checklist of things I have to remember.

Environments like 'dev', 'prod' and whatever sits between live in an `envs` folder. A `modules` directory contains the reusable building blocks, I've used `network`, `observability`, and `service` in the example below. These modules then get composed together like Lego; passing variables in and outputs along the the chain.

I lean on `auto.tfvars` files in each of the `env` folders because they slightly simplify each CLI invocation, and reduces a risk of me forgetting. The difference between the environments now should just be backend and the values in the `auto.tfvars` file. All the conditional logic is down in the modules.

This was the crux of my original confusions. I was convinced duplication of the `.tf` files across environments was a mistake and that drift was inevitable. I wanted only a `backend.tf` and a set of `.tfvars` files per environment with everything else shared. I was - and still am - adamant that no two environments should ever share a state file (looking up outputs is fine). I hung so many of my original worries and concerns on these two things I was essentially stuck thinking in circles.

```text
└── infra
    ├── envs
    │   ├── dev
    │   │   ├── backend.tf
    │   │   ├── dev.auto.tfvars
    │   │   ├── main.tf
    │   │   ├── providers.tf
    │   │   ├── variables.tf
    │   │   └── versions.tf
    │   └── prod
    │       ├── backend.tf
    │       ├── main.tf
    │       ├── prod.auto.tfvars
    │       ├── providers.tf
    │       ├── variables.tf
    │       └── versions.tf
    └── modules
        ├── network
        │   ├── main.tf
        │   ├── outputs.tf
        │   └── variables.tf
        ├── observability
        │   ├── main.tf
        │   ├── outputs.tf
        │   └── variables.tf
        └── service
            ├── main.tf
            ├── outputs.tf
            └── variables.tf
```

If you share one `envs` folder and switch between `.tfvars` files, you quickly hit the backend problem in that you can't use variables inside `backend.tf` (I know you can do this in OpenTufu now). Separating state then requires a bunch of scripts, templating, or increasingly *creative* patterns. In trying to optimise for [DRY][dry], I was introducing complexity.

Rather than trying to achieve perfect [DRY][dry] principals, I'm instead going for [KISS][kiss]. The extra cognitive burden of clever indirection rarely pays for itself. Most teams do not need the architectural gymnastics required to keep Terraform [DRY][dry] to manage a handful of environments.

I know I said I didn't want to abstract things but to avoid missing arguments or badly typed commands I use a little wrapper script to ensure some consistency `make terraform-apply env=dev` and away it goes.

```Makefile
.PHONY: terraform-init terraform-plan terraform-apply terraform-destroy

TERRAFORM_DIR := infra/envs

# Validate environment parameter and directory
define validate_env
    $(if $(env),,$(error env parameter is required. Usage: make $(1) env=<env>))
    @if [ ! -d "$(TERRAFORM_DIR)/$(env)" ]; then \
        echo "Error: Environment directory '$(env)' not found"; \
        echo "Expected directory: $(TERRAFORM_DIR)/$(env)"; \
        exit 1; \
    fi
endef

# Run terraform command in environment directory
define run_terraform
    @echo "Running terraform $(1) for $(env)..."
    @cd $(TERRAFORM_DIR)/$(env) && terraform $(1)
endef

terraform-init:
    $(call validate_env,terraform-init)
    $(call run_terraform,init)

terraform-plan:
    $(call validate_env,terraform-plan)
    $(call run_terraform,plan)

terraform-apply:
    $(call validate_env,terraform-apply)
    $(call run_terraform,apply)

terraform-destroy:
    $(call validate_env,terraform-destroy)
    $(call run_terraform,destroy)
```

When I was first learning Terraform, [Workspaces](https://developer.hashicorp.com/terraform/language/state/workspaces) had just been introduced. At the time, the guidance around CLI usage was to avoid it unless you were a Terraform Enterprise Cloud user. Workspaces however, exists to solve exactly the backend/state namespacing problem that caused my early confusion.

I still feel slightly odd about Workspaces. I know they are fine, and I know they are stable and well supported, but I just can't bring myself to use it in anger. That said, theres no reason you should be stuck with my hang ups and when I'm feeling fruity I can achieve some more of those [DRY][dry] principals I desired.

By smushing the environments together into one folder and moving from `auto.tfvars` files to just `environment.tfvars` it's done. Workspaces needs you need to remember to switch the workspace accordingly in order to select the right statefile, which I think is where I worry about the risks of being in the wrong workspace. Worries aside, separate Workspaces fixes the `backend.tf` problems and indecisions which sparked my original problems.

Using a Workspace can look like this:

```text
└── infra
    ├── envs
    │   ├── backend.tf
    │   ├── dev.tfvars        # Separate tfvars for the two environments
    │   ├── main.tf
    │   ├── prod.tfvars        # Note not auto.tfvars anymore
    │   ├── providers.tf
    │   ├── variables.tf
    │   └── versions.tf
    └── ...
```

The best thing about wrapper scripts is you can keep the [DevEx][devex] the same but alter the task running under the hood. Instead of switching the directory, it just switches the workspace to the desired environment (after checking it exists).

```Makefile
.PHONY: terraform-init terraform-plan terraform-apply terraform-destroy

TERRAFORM_DIR := infra/envs

# Validate environment parameter and tfvars file
define validate_env
    $(if $(env),,$(error env parameter is required. Usage: make $(1) env=<env>))
    @if [ ! -f "$(TERRAFORM_DIR)/$(env).tfvars" ]; then \
        echo "Error: No tfvars file found for environment '$(env)'"; \
        echo "Expected file: $(TERRAFORM_DIR)/$(env).tfvars"; \
        exit 1; \
    fi
endef

# Run terraform command with workspace switching
define run_terraform
    @echo "Switching to $(env) workspace..."
    @cd $(TERRAFORM_DIR) && \
        (terraform workspace select $(env) 2>/dev/null || terraform workspace new $(env)) && \
        echo "Running terraform $(1) for $(env)..." && \
        terraform $(1) -var-file=$(env).tfvars
endef

terraform-init:
    $(call validate_env,terraform-init)
    $(call run_terraform,init)

terraform-plan:
    $(call validate_env,terraform-plan)
    $(call run_terraform,plan)

terraform-apply:
    $(call validate_env,terraform-apply)
    $(call run_terraform,apply)

terraform-destroy:
    $(call validate_env,terraform-destroy)
    $(call run_terraform,destroy)
```

Logically both approaches solve the same problem: one leans on filesystem separation, the other leans on a Terraform feature. My reservations are not germane to the choice you make.

## Things have changed since 2019

Over the last six years Terraform hasn't really changed that much. Sure, there has been plenty of maturity and [QoL][qol] improvements. The 0.13/1.0 release marking the end of the craziness before. When writing this I had a flick through the last 6 years of major release notes:

- **0.12 (2019)**: HCL2 introduced the major language overhaul which needed the horrible state change palava. This is when the switch from `name = "${local.string}"` to `name = local.string` came in.

- **0.13 (2020)**: Explicit provider source addresses and improved module handling creating `versions.tf` became useful.
- **0.14 (2020)**: Dependency lock file `.terraform.lock.hcl`, bringing reproducibility closer to what `package-lock.json` does in the JavaScript ecosystem.
- **1.0 (2021)**: Stability promise and semantic versioning commitment, "No breaking changes between major versions, we promise, Scouts honour." - Hashicorp 2021
- **1.1 (2021)**: *[moved](https://developer.hashicorp.com/terraform/language/block/moved)* blocks, allowing refactors without manual state surgery.
- **1.2 (2022)**: Pre-conditions and post-conditions for safer assumptions in configuration.
- **1.5 (2023)**: *[import](https://developer.hashicorp.com/terraform/language/block/import)* blocks.
- **1.6 (2023)**: [terraform test](https://developer.hashicorp.com/terraform/language/tests), introducing a first-party testing workflow.
- **1.7 (2023)**: [Stacks](https://developer.hashicorp.com/terraform/language/stacks) looks like a move towards higher-level orchestration of multiple stateful components, though with it being a HCP (Hashicorp Cloud) only feature, I have not played with this yet.
- **1.8–1.9 (2024)**: [ephemeral resources](https://developer.hashicorp.com/terraform/plugin/framework/ephemeral-resources), import and test refinements, and incremental CLI output improvements.
- **1.10–1.12 (2024)**: Ongoing enhancements to testing, validation and provider interactions, smoothing off rough edges rather than redefining the model.
- **1.13 (2025)**: Further improvements to plan clarity, drift visibility and workflow ergonomics.
- **1.14 (2025/2026)**: Introduction of an MCP server mode and continued CLI/runtime refinements, reflecting Terraform’s role in a broader automation ecosystem rather than changing its core abstractions.

The state works better and you don't have to do worrying upgrades every few months, theres new functions and QoL improvements, we've finally moved to version 0.13/1.0, and you can choose between Terraform and OpenTofu depending on what you want. I'm also aware that OpenTofu can do variables in places Terraform can't and I'm ignoring that for the sake of this update.

The worries, things I didn't understand and straight-up misunderstood are nice to look back on and see how I've progressed. A lot of the concerns I held still seem like reasonable things to worry about, though I didn't really understand the options in order to make properly reasoned decisions - hence all the confusion.

[kiss]: ## "Keep It Simple Stupid"
[dry]: ## "Don't Repeat Yourself"
[devex]: ## "Developer Experience"
[qol]: ## "Quality of Life"
