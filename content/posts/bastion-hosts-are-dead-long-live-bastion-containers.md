+++
author = "Aiden Vaines"
catagories = ["AWS"]
date = 2023-01-11T00:00:00Z
featured = true
image = "/uploads/deathtobastionhosts.png"
tags = ["AWS"]
title = "Death to Bastion Hosts, long live Bastion Containers!"

+++
For a long time now most container based workloads and projects I have worked with have needed EC2 Bastion hosts for various reasons; as Fargate in particular has expanded features and general functionality those needs for an EC2 bastion hosts have been in decline.

One of the biggest use-cases has been [tunneling](https://www.ssh.com/academy/ssh/tunneling) through or proxying to services only accessible to the workloads running in container workloads using the `-L` SSH argument. like accessing a backend RDS instance.

![](/uploads/bastion-containers7.png)

Up until late 2022 it was possible to connect to a Fargate container in much the same way using ECS Exec (when it works) or using the Systems Manager `ssm start-session` commands. ECS Exec just intermittently rejects connections and for a while AWS support's advice was to use SSM directly.

When a container is being run within Fargate there is an agent added automatically and the SSM document support is based on this version.

One of the major things I would need to be able to cease using EC2 Bastion Hosts would be this tunneling functionality, the SSM agent baked in to the layer AWS injects has been stuck at `3.1.1260` dated April 2022 [https://github.com/aws/amazon-ssm-agent/releases/tag/3.1.1732.0](https://github.com/aws/amazon-ssm-agent/releases/tag/3.1.1732.0 "https://github.com/aws/amazon-ssm-agent/releases/tag/3.1.1732.0").

![](/uploads/bastion-containers6.png)

This agent from April has support for the `AWS-StartPortForwardingSession` SSM document, this allows you to forward connection to another device. Like using a container to pass your SSM connection over to another server.......like another Bastion Host (yo dog, i heard you like....etc etc). But it doesn't support the `AWS-StartPortForwardingSessionToRemoteHost`document which I would need for the main use-case.

For that I need the `3.1.1374.0` release, dated May 2022, as it supports the `AWS-StartPortForwardingSessionToRemoteHost` document which is what we would need to replace this final hurdle for my EC2 based Bastion hosts.

Until at least November 2022 every container I spun up continued to have that April release basked in to the containers morning when I checked again this week, its finally moved on and I can now tunnel through a container running in Fargate to manage other services like this:

![](/uploads/bastion-containers5.png)

### Playground

If you would like to test this out, I've put together a Terraform repo with the basics to create a single Fargate container with an RDS instance and everything else necessary to test the port forwarding in a semi-realistic scenario (obviously its not fit for production use). Source code here: [https://github.com/n3rden/tf-fargate-rds-ssm-port-forward](https://github.com/n3rden/tf-fargate-rds-ssm-port-forward "https://github.com/n3rden/tf-fargate-rds-ssm-port-forward")

_This will spin up billable services to the tune of <$15 p/m (excluding free tier). So for a couple of hours to experiment you should be looking at around few of dollars tops._ [_https://calculator.aws/#/estimate?id=1df2d8940113fe82dad6ffcdfe0581dfacbdf4c6_](https://calculator.aws/#/estimate?id=1df2d8940113fe82dad6ffcdfe0581dfacbdf4c6 "https://calculator.aws/#/estimate?id=1df2d8940113fe82dad6ffcdfe0581dfacbdf4c6")

#### I've deployed the infrastructure, now what?

Once you have the stack up and running there are a few hoops to jump through

Firstly set up a couple of variables, one for the name of the ECS cluster, one for the RDS instance endpoint. Both of these should be in the outputs from the Terraform above.

    ECS_CLUSTER_NAME="main"
    TARGET_RDS_ENDPOINT="terraform-123132321123.abc123def.eu-west-1.rds.amazonaws.com"

Next there are a few variables to assemble by looking up the AWS services

    AWS_TASK_ARN=$(aws ecs list-tasks --cluster ${ECS_CLUSTER_NAME} | jq -r '.taskArns[]')
    AWS_TASK=$(aws ecs describe-tasks \ 
        --cluster ${ECS_CLUSTER_NAME} \ 
        --tasks ${AWS_TASK_ARN}
     )
     AWS_TASK_RUNTIME_ID=$(echo ${AWS_TASK} | jq -r '.tasks[0].containers[0].runtimeId')
     AWS_TASK_ID=$(echo ${AWS_TASK_RUNTIME_ID} | cut -d "-" -f 1)

Then we need to build a 'target' reference; unlike everything else in the AWS ecosystem, this construct seems poorly imagined and inconsistent with other services, its built from `ecs:${cluster-name}_${task-id}_${container-runtime-id}` see [https://github.com/aws/amazon-ssm-agent/issues/361](https://github.com/aws/amazon-ssm-agent/issues/361 "https://github.com/aws/amazon-ssm-agent/issues/361") for more

    STUPID_REFERENCE_CONSTRUCT="ecs:${ECS_CLUSTER_NAME}${AWS_TASK_ID}${AWS_TASK_RUNTIME_ID}"

Finally use the SSM start-session command to connect to the container

    aws ssm start-session \
      --target ${STUPID_REFERENCE_CONSTRUCT}

Or tunnel through it! (if you have a local MySQL server or tcp/3306 consumed by something else, change the `localPortNumber`

    aws ssm start-session --target ${STUPID_REFERENCE_CONSTRUCT} \
      --document-name AWS-StartPortForwardingSessionToRemoteHost \
      --parameters "{\"portNumber\":[\"3306\"], \"host\":[\"${TARGET_RDS_ENDPOINT}\"], \"localPortNumber\":[\"3306\"]}"

It should look something like this;

![](/uploads/bastion-containers3.png)

You can now connect to `127.0.0.1:3306` with your database workbench of choice. Here i've connected, create a table and a couple of rows in the `main` database the Terraform initialised in the RDS cluster.

![](/uploads/bastion-containers4.png)

![](/uploads/bastion-containers2.png)