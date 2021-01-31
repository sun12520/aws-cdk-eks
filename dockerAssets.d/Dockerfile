FROM public.ecr.aws/amazonlinux/amazonlinux:latest


ENV KUBECONFIG /home/kubectl/.kube/kubeconfig
ENV HOME /home/kubectl
# ENV KUBECONFIG /root/.kube/kubeconfig

ARG KUBECTL_VERSION=1.18.8/2020-09-18

RUN yum install -y unzip jq && \
	amazon-linux-extras install docker 

RUN amazon-linux-extras install python3 
# RUN amazon-linux-extras install pip3

RUN set -ex \
	&& python3 -V

RUN curl -O "https://bootstrap.pypa.io/get-pip.py" && python3 get-pip.py --user
RUN mv /home/kubectl/.local/bin/pip /usr/bin/pip
RUN pip install flake8

# install aws-cli v2
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
	unzip awscliv2.zip && \
	./aws/install


# RUN \
# 	mkdir /root/bin /aws; \
# 	apk -Uuv add groff less bash python py-pip jq curl docker && \
# 	pip install --upgrade pip; \
# 	pip install awscli && \
# 	apk --purge -v del py-pip && \
# 	rm /var/cache/apk/* && \
# 	# Create non-root user (with a randomly chosen UID/GUI).
# 	adduser kubectl -Du 5566

# ADD https://amazon-eks.s3.us-west-2.amazonaws.com/1.15.10/2020-02-22/bin/linux/amd64/kubectl /usr/local/bin/kubectl
# #COPY kubectl /usr/local/bin/kubectl

# install python3 pip3 
# RUN set -ex \
# 	&& yum -y install tar zlib-devel bzip2-devel libffi-devel openssl-devel ncurses-devel sqlite-devel readline-devel tk-devel gcc make wget \
# 	&& yum clean all \
# 	&& mkdir /usr/local/python3 

# COPY Python-3.7.4.tar.xz  /usr/local/python3/ 

# RUN set -ex \
# 	&& cd /usr/local/python3 \
# 	&& tar -xvJf  Python-3.7.4.tar.xz \
# 	&& cd Python-3.7.4 \
# 	&& ./configure prefix=/usr/local/python3 \
# 	&& make && make install \
# 	&& ln -s /usr/local/python3/bin/python3.7 /usr/local/bin/python3 \
# 	&& ln -s /usr/local/python3/bin/pip3 /usr/local/bin/pip3 

# install kubectl
RUN curl -o kubectl https://amazon-eks.s3.us-west-2.amazonaws.com/${KUBECTL_VERSION}/bin/linux/amd64/kubectl && \
	chmod +x kubectl && \
	mv kubectl /usr/local/bin/kubectl

WORKDIR $HOME

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
COPY image_scan.sh /usr/local/bin/image_scan.sh

RUN chmod a+x /usr/local/bin/kubectl /usr/local/bin/entrypoint.sh /usr/local/bin/image_scan.sh


# USER kubectl
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
