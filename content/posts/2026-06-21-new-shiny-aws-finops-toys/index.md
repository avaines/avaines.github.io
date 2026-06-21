---
title: 'New Shiny AWS FinOps Toys?'
author: Aiden Vaines
image: featured.png
featured: true
draft: false
categories:
  - Thought Leadership
  - Cloud
  - FinOps
  - DevOps
date: 2026-06-21T00:00:00.000Z
references:
  - https://aws.amazon.com/about-aws/whats-new/2026/06/aws-compute-optimizer-six-new-idle/
  - https://aws.amazon.com/about-aws/whats-new/2026/06/aws-cost-explorer-intelligent-cost-explanations/
  - https://aws.amazon.com/about-aws/whats-new/2026/06/aws-cur2.0-athena-redshift/
  - https://aws.amazon.com/about-aws/whats-new/2026/06/aws-finops-agent-preview/
  - https://aws.amazon.com/about-aws/whats-new/2026/06/aws-savings-plans-coverage/
  - https://aws.amazon.com/blogs/aws-cloud-financial-management/aws-finops-agent-is-now-public-preview
  - https://aws.amazon.com/blogs/aws-cloud-financial-management/extending-aws-managed-monitors-in-cost-anomaly-detection/
  - https://data.finops.org/
  - https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-controls.html
  - https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html
  - https://docs.aws.amazon.com/cost-management/latest/userguide/manage-ad.html
  - https://docs.cloud.google.com/billing/docs/how-to/control-usage
  - https://learn.microsoft.com/en-us/azure/cost-management-billing/manage/cost-management-budget-scenario
syndicate:
  - bluesky
  - devto
  - hashnode
  - mastodon
  - substack
---

AWS appears to have spent June quietly scattering new FinOps-shaped features around the place. Some are immediately useful, some are probably worth a exploratory look, and some are AI-flavoured that I want to poke them with a stick before declaring them helpful.

The short version is that AWS appears to be moving cost management away from periodic dashboards and towards a more continuous, workflow-driven model. That is not just my legendary perception; Amazon said as much in the news post for the [FinOps Agent Preview that sparked me writing this](https://aws.amazon.com/about-aws/whats-new/2026/06/aws-finops-agent-preview/), describing FinOps as shifting from dashboard reviews towards continuous workflows shared between engineering, finance and FinOps teams.

That seems to match the broader industry direction as well. FinOps increasingly seems to be becoming a more proactive discipline rather than just a cloud bill explanation function. AI cost management, forecasting, governance, organisational alignment and broader technology value are all becoming part of the scene. Which is useful, because “why did the bill bill go up?” is rarely a satisfying model.

For me, the interesting AWS changes are not just the shiny hype AI stuff. The [new Compute Optimizer idle resource recommendations](https://aws.amazon.com/about-aws/whats-new/2026/06/aws-compute-optimizer-six-new-idle/) is probably the most immediately useful. Compute Optimizer now detects idle resources across several additional services, including DynamoDB, ElastiCache which should apply almost immediate savings to one of the services I work with. EC2 rightsizing and obvious oversized compute are useful, but idle managed-service resources are often where the annoying. Its easy to create them but easy to forget, and not always obvious in a normal dashboard unless you are already looking for them.

The [CUR 2.0 Athena and Redshift integration](https://aws.amazon.com/about-aws/whats-new/2026/06/aws-cur2.0-athena-redshift/) is also worth watching. At the moment, I dump CUR reports into an S3 bucket, sync them into a central account, run a custom Glue crawler over them, and then let Athena wrangle the data behind a Grafana dashboard. That gives useful partial workload analytics without giving everyone access to the billing management account, but it is still a fairly hand-rolled pipeline.

CUR 2.0 now supporting Athena and Redshift more directly might remove some of that glue, hopefully resulting in less crawler weirdness and fewer random columns appearing in the schema. It doesn't necessarily remove the need for centralised cost-data tooling service but it does look like it could make it a bit less unpleasant.

The [Cost Explorer intelligent explanations feature](https://aws.amazon.com/about-aws/whats-new/2026/06/aws-cost-explorer-intelligent-cost-explanations/) is another example of AWS trying to make billing data more legible. Cost Explorer can now use Amazon Q Developer now to explain cost trends, and anomalies based on a report. This sounds useful for the parts of AWS billing that are technically correct but cognitively hostile; I am looking at you API Gateway.

There is also a new [target coverage analysis feature in Savings Plans Purchase Analyzer](https://aws.amazon.com/about-aws/whats-new/2026/06/aws-savings-plans-coverage/). Instead of only looking at generic recommendations, you can set a desired percentage of On-Demand spend to cover with Savings Plans, and the tool seems to estimate a purchase amount based on historical usage. It also lets you compare cost, coverage, utilisation and savings across different coverage targets which sounds fun, but I don't know what I'm going to do with that.

Savings Plans are one of those areas where the tooling needs to support discussion rather than just “Buy this amount” which is inherently less useful than “here is the risk profile if we aim for 60%, 70% or 80% coverage.” so this is probably a step in the right direction.

The obvious headline toy over the last month or so has to be [AWS FinOps Agent preview](https://aws.amazon.com/about-aws/whats-new/2026/06/aws-finops-agent-preview/). The agent can answer natural-language cost questions, build reports, make rightsizing suggestions, identify idle resource and Savings Plans recommendations, investigate Cost Anomaly Detection events, and create Jira tickets or post findings into Slack. It almost seems like all those other new features were in fact to support this one AI agent toy doesn't it.

<img src="money-printer.png" alt="money printer" width="630"/>

The thing I want to see is not whether it can produce a polished summary. Lots of tools can summarise a bill but the more interesting question is whether it can shorten the time between detection, ownership, and action. Amazon says the preview "includes event-triggered cost anomaly investigation, recurring cost reporting, and optimisation recommendations". In the real production environment world, cost ownership is rarely as simple as “this account belongs to this team”. There are shared services, inherited platforms, weird tagging gaps, edge cases and accounts that mean different things depending on the programme. A FinOps tool that cannot understand that context tends to become another dashboard that a central team has to interpret manually.

I am optimistically cautious though, FinOps is often reactive because the underlying billing model is reactive. Budget data is still never available while you are doing things, its always the next day, and you can absolutely spend all-the-money before a budget notification gets anywhere near you. Cost Anomaly Detection is better, but it is still based on delayed billing and usage data, and it needs enough history before it can reliably tell you that something looks unusual.

For that reason I'm not sure these launches magically solve cloud cost control, they might improve visibility, make explaining the bill easier but they do not turn cloud billing into a real-time circuit breaker which would be a game changer. Whilst there are budget actions, they are still scoped actions rather than a clean universal “stop spending now” button. You can attach policies, apply SCPs, or target some specific resources, but that is not the same as a safe provider-native hard cap across arbitrary workloads. As far as I can tell, none of the big three cloud providers offers the thing people usually imagine when they ask for a hard billing cap: “turn things off when I hit this number, before the bill gets worse.”

Cost anomaly alarms are obviously useful, but anyone who has been alerted about a terrifying percentage increase because a tiny service went from almost nothing to two dollars knows the problem. Percentage-based anomaly detection and spiky workloads are not always friends. Amazon has improved the anomaly-monitoring tooling and includes managed monitors for linked accounts, cost allocation tags and cost categories and so on, but some of the more useful organisational views still sit in the management account, while member accounts remain more limited.

## Is this a sign of better FinOps tooling to come?

Amazon is clearly adding more native cost tooling because customers need it, especially as AI, autoscaling workloads and managed services make cost attribution harder. The wider FinOps industry also seems to be moving towards standardised data, and more automation. The FinOps Foundation’s [FOCUS specification](https://focus.finops.org/) is part of that same trend: a common billing-data specification intended to reduce complexity across cloud, SaaS, data centre, AI and other technology vendors.

For me, the most useful thing is that that cost optimisation is becoming more operational rather than just a monthly review. Not just someone in finance asking why the bill changed three weeks after the deployment that caused it or yet more dashboards. I dream of a future state where cost data is queryable, anomalies are investigated quickly and teams can understand the cost impact of their own systems without needing access to the entire billing estate.

That is still different from the proactive cost controls as the billing data is still delayed and the pricing models are still complicated. Autoscaling still makes prediction difficult and the Cloud providers still benefit from consumption-based ambiguity more than most customers would like.

June's AWS features do feel like a step towards my FinOps hopes of it becoming part of normal Platform Engineering or DevOps day-to-day rather than a regular reporting exercise that happens after the money has already gone.
