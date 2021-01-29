// import * as path from 'path';
// import * as codebuild from '@aws-cdk/aws-codebuild';
// import * as codecommit from '@aws-cdk/aws-codecommit';
// import * as ec2 from '@aws-cdk/aws-ec2';
// import * as ecr from '@aws-cdk/aws-ecr';
// import * as eks from '@aws-cdk/aws-eks';
// import * as targets from '@aws-cdk/aws-events-targets';
// import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import { DemoStack } from './DemoStack';
var fs= require("fs")

const app = new cdk.App();
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};
new DemoStack(app, 'eks-cicd-codebuild-stack', { env: devEnv });

app.synth();

check_opa()

console.log('Start Deploy.');

function check_opa(){
    console.log('In check_opa');
    fs.exists("cdk.out/eks-cicd-codebuild-stack.template.json", function(exists: any) {
        if(exists){
            // console.log('file exists');
            const execSync = require('child_process').execSync;
            const output = execSync('/home/ec2-user/environment/opa eval --format pretty -i cdk.out/eks-cicd-codebuild-stack.template.json -d ../opa_cdk.rego data');
            console.log(output.toString());
            const resoutput = JSON.parse(output.toString());
            for(var police in resoutput.opa_cdk){
                console.log(resoutput.opa_cdk[police][0]);
                if (resoutput.opa_cdk[police][0] == true){
                    console.log('Police check is not pass.');
                    process.exit(1);
                }
            }
        }else{
            setTimeout(function() {
                // console.log('wait for file');
                check_opa();
            }, 2000);
        }
    }); 
}
