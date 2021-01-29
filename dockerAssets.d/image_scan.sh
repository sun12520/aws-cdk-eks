#!/bin/bash
set -e

ECR_REPO_URI=$1
IMGTAG=$2
AWS_DEFAULT_REGION=$3

IFS=$'\n'
LEVEL=['MEDIUM','High','Critical']
# cmd="/usr/bin/aws ecr describe-image-scan-findings --repository-name $ECR_REPO_URI --image-id imageTag=$IMGTAG --region $AWS_DEFAULT_REGION --query imageScanFindings --output=text"
cmd="df"
# echo $cmd
for line in `aws ecr describe-image-scan-findings --repository-name $ECR_REPO_URI --image-id imageTag=$IMGTAG --region $AWS_DEFAULT_REGION --query imageScanFindings --output=text`
# for line in `$cmd`
do
    # echo $line
    if [ `echo $line | grep 'FINDINGS'` != '' ];then
        level=`echo $line | awk -F " " '{print $3}'`
        echo $level
        if [ $level == 'High' ] || [ $level == 'Critical' ] || [ $level == 'MEDIUM' ] ;then
            echo 'ERROR'
            exit 1
        fi
    fi
    # echo 'pass'
done