FROM jenkins/jenkins:lts

USER root

RUN apt-get update \
    && apt-get install -y docker.io \
    && rm -rf /var/lib/apt/lists/*

ARG DOCKER_GID=125

RUN groupadd -g ${DOCKER_GID} docker-host \
    && usermod -aG docker-host jenkins

USER jenkins