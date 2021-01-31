import * as path from 'path';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codecommit from '@aws-cdk/aws-codecommit';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecr from '@aws-cdk/aws-ecr';
import * as eks from '@aws-cdk/aws-eks';
import * as targets from '@aws-cdk/aws-events-targets';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';

export class DemoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = getOrCreateVpc(this);

    const cluster = new eks.Cluster(this, 'Cluster', {
      vpc,
      version: eks.KubernetesVersion.V1_18,
      defaultCapacity: 2,
    });

    const ecrRepo = new ecr.Repository(this, 'EcrRepo');

    const repository = new codecommit.Repository(this, 'CodeCommitRepo', {
      repositoryName: `${this.stackName}-repo`,
    });

    const project = new codebuild.Project(this, 'MyProject', {
      projectName: `${this.stackName}`,
      source: codebuild.Source.codeCommit({ repository }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.fromAsset(this, 'CustomImage', {
          directory: path.join(__dirname, '../dockerAssets.d'),
        }),
        privileged: true,
      },
      environmentVariables: {
        CLUSTER_NAME: {
          value: `${cluster.clusterName}`,
        },
        ECR_REPO_URI: {
          value: `${ecrRepo.repositoryUri}`,
        },
        ECR_REPO_NAME:{
          value:`${ecrRepo.repositoryName}`,
        }
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'env',
              'export TAG=${CODEBUILD_RESOLVED_SOURCE_VERSION}',
              'export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output=text)',
              '/usr/local/bin/entrypoint.sh',
              'echo Logging in to Amazon ECR',
              'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com',
              'aws ecr --region $AWS_DEFAULT_REGION describe-repositories --repository-names $ECR_REPO_NAME || aws ecr --region $AWS_DEFAULT_REGION create-repository --repository-name $ECR_REPO_NAME',
            ],
          },
          build: {
            commands: [
              'flake8 flask-docker-app',
              'cd flask-docker-app',
              'docker build -t $ECR_REPO_URI:$TAG .',
              'docker push $ECR_REPO_URI:$TAG',
              'aws ecr start-image-scan --repository-name $ECR_REPO_NAME --image-id imageTag=$TAG --region $AWS_DEFAULT_REGION',
            ],
          },
          post_build: {
            commands: [
              'sleep 15',
              '/usr/local/bin/image_scan.sh $ECR_REPO_NAME $TAG $AWS_DEFAULT_REGION',
              'kubectl get no',
              'kubectl set image deployment flask-deployment flask=$ECR_REPO_URI:$TAG',
            ],
          },
        },
      }),
    });

    repository.onCommit('OnCommit', {
      target: new targets.CodeBuildProject(codebuild.Project.fromProjectArn(this, 'OnCommitEvent', project.projectArn)),
    });

    ecrRepo.grantPullPush(project.role!);
    cluster.awsAuth.addMastersRole(project.role!);
    project.addToRolePolicy(new iam.PolicyStatement({
      actions: ['eks:DescribeCluster'],
      resources: [`${cluster.clusterArn}`],
    }));

    new cdk.CfnOutput(this, 'CodeCommitRepoName', { value: `${repository.repositoryName}` });
    new cdk.CfnOutput(this, 'CodeCommitRepoArn', { value: `${repository.repositoryArn}` });
    new cdk.CfnOutput(this, 'CodeCommitCloneUrlSsh', { value: `${repository.repositoryCloneUrlSsh}` });
    new cdk.CfnOutput(this, 'CodeCommitCloneUrlHttp', { value: `${repository.repositoryCloneUrlHttp}` });
  }
}

function getOrCreateVpc(scope: cdk.Construct): ec2.IVpc {
  // use an existing vpc or create a new one
  return scope.node.tryGetContext('use_default_vpc') === '1' ?
    ec2.Vpc.fromLookup(scope, 'Vpc', { isDefault: true }) :
    scope.node.tryGetContext('use_vpc_id') ?
      ec2.Vpc.fromLookup(scope, 'Vpc', { vpcId: scope.node.tryGetContext('use_vpc_id') }) :
      new ec2.Vpc(scope, 'Vpc', { maxAzs: 3, natGateways: 1 });
}
