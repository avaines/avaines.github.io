+++
author = "Aiden Vaines"
catagories = ["AWS"]
date = 2023-01-11T00:00:00Z
draft = true
featured = true
image = "/uploads/deathtobastionhosts.png"
tags = ["AWS"]
title = "Death to Bastion Hosts, long live Bastion Containers!"

+++
For a long time now my container based workloads needed EC2 Bastion hosts for various reasons, as Fargate in particular has expanded features and general functionality those needs for an EC2 bastion host have been in decline.

One of the biggest reasons has been tunneling through or proxying to services only accessible to the workloads running in container workloads using the `-L` SSH argument.

![](/uploads/bastion-containers7.png)

Up until late 2022 it was possible to connect to a Fargate container in much the same way using ECS Exec (when it works) or using the Systems Manager `ssm start-session` commands.

When a container is being run within Fargate there is an agent added automatically and the SSM document support is based on this version. 

For most of 2022 this was stuck at `3.1.1260` dated April 2022 [https://github.com/aws/amazon-ssm-agent/releases/tag/3.1.1732.0](https://github.com/aws/amazon-ssm-agent/releases/tag/3.1.1732.0 "https://github.com/aws/amazon-ssm-agent/releases/tag/3.1.1732.0"). This SSM version has support for the `AWS-StartPortForwardingSession` SSM document

![](/uploads/bastion-containers6.png)

The May release, `3.1.1374.0` came with support for the `AWS-StartPortForwardingSessionToRemoteHost` document which is what we would need to replace this final hurdle for my EC2 based Bastion hosts.

Until at least November every container I spun up continued to have that April release basked in to the containers morning when I checked again its finally moved on!

![](/uploads/bastion-containers3.png)

![](/uploads/bastion-containers2.png)

![](/uploads/bastion-containers4.png)

![](/uploads/bastion-containers5.png)

One of the major benefits of this is that my Bastion Containers are entirely stateless, they can be spun up on demand and discarded without regard (I know EC2 can do this too, but provisioning from scratch is slower than launching a container).

If you would like to test this out, I've put together a Terraform repo with the basics to create a single Fargate container, an RDS instance with everything necessary to test the port forwarding in a semi-realistic scenario. Source code here: [https://github.com/n3rden/tf-fargate-rds-ssm-port-forward](https://github.com/n3rden/tf-fargate-rds-ssm-port-forward "https://github.com/n3rden/tf-fargate-rds-ssm-port-forward")

_This will spin up billable services to the tune of <$15 p/m (excluding free tier). So for a couple of hours to experiment you should be looking at around few of dollars._ [_https://calculator.aws/#/estimate?id=1df2d8940113fe82dad6ffcdfe0581dfacbdf4c6_](https://calculator.aws/#/estimate?id=1df2d8940113fe82dad6ffcdfe0581dfacbdf4c6 "https://calculator.aws/#/estimate?id=1df2d8940113fe82dad6ffcdfe0581dfacbdf4c6")

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

Then we need to build a 'target' reference, unlike everything else in the AWS ecosystem, this construct seems poorly imagined and is built of `ecs:clustername_taskid_containerruntimeid` see [https://github.com/aws/amazon-ssm-agent/issues/361](https://github.com/aws/amazon-ssm-agent/issues/361 "https://github.com/aws/amazon-ssm-agent/issues/361") for more

    STUPID_REFERENCE_CONSTRUCT="ecs:${ECS_CLUSTER_NAME}${AWS_TASK_ID}${AWS_TASK_RUNTIME_ID}"

  
\# Connect for terminal onlyaws ssm start-session \\ --target ${STUPID_REFERENCE_CONSTRUCT}  
\# Tunnel through to a remote databaseaws ssm start-session --target ${STUPID_REFERENCE_CONSTRUCT} \\ --document-name AWS-StartPortForwardingSessionToRemoteHost \\ --parameters "{\\"portNumber\\":\[\\"3306\\"\], \\"host\\":\[\\"${TARGET_RDS_ENDPOINT}\\"\], \\"localPortNumber\\":\[\\"3306\\"\]}"

aws ssm start-session --target ${ssm_target} \\ --document-name AWS-StartPortForwardingSessionToRemoteHost \\ --parameters "{\\"portNumber\\":\[\\"3306\\"\], \\"host\\":\[\\"${ENV_RDS_READER_ENDPOINT}\\"\], \\"localPortNumber\\":\[\\"${TUNNEL_PORT}\\"\]}"  
aws ssm start-session \\ --target ${ssm_target} \\ --document-name AWS-StartInteractiveCommand \\ --parameters "{\\"command\\":\[\\"${COMMAND}\\"\]}"  
\# Set some variablesECS_CLUSTER_NAME="main"TARGET_RDS_ENDPOINT="terraform-20230111164245485900000001.ca2tjwk4kprq.eu-west-1.rds.amazonaws.com"  
\# Construct and lookup some othersAWS_TASK_ARN=$(aws ecs list-tasks --cluster ${ECS_CLUSTER_NAME} | jq -r '.taskArns\[\]')AWS_TASK=$(aws ecs describe-tasks \\ --cluster ${ECS_CLUSTER_NAME} \\ --tasks ${AWS_TASK_ARN})AWS_TASK_RUNTIME_ID=$(echo ${AWS_TASK} | jq -r '.tasks\[0\].containers\[0\].runtimeId')AWS_TASK_ID=$(echo ${AWS_TASK_RUNTIME_ID} | cut -d "-" -f 1)  
\# This stupid construct is how you connect to the target: 'ecs:clustername_taskid_containerruntimeid' see [https://github.com/aws/amazon-ssm-agent/issues/361](https://github.com/aws/amazon-ssm-agent/issues/361 "https://github.com/aws/amazon-ssm-agent/issues/361") for moreSTUPID_REFERENCE_CONSTRUCT="ecs:${ECS_CLUSTER_NAME}_${AWS_TASK_ID}_${AWS_TASK_RUNTIME_ID}"  
\# Connect for terminal onlyaws ssm start-session \\ --target ${STUPID_REFERENCE_CONSTRUCT}  
\# Tunnel through to a remote databaseaws ssm start-session --target ${STUPID_REFERENCE_CONSTRUCT} \\ --document-name AWS-StartPortForwardingSessionToRemoteHost \\ --parameters "{\\"portNumber\\":\[\\"3306\\"\], \\"host\\":\[\\"${TARGET_RDS_ENDPOINT}\\"\], \\"localPortNumber\\":\[\\"3306\\"\]}"

\# handy [https://github.com/aws-containers/amazon-ecs-exec-checker](https://github.com/aws-containers/amazon-ecs-exec-checker "https://github.com/aws-containers/amazon-ecs-exec-checker")\`\`\`