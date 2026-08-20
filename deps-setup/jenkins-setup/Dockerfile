FROM jenkins/jenkins:lts

USER root

RUN apt-get update \
    && apt-get install -y docker.io curl \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /usr/local/lib/docker/cli-plugins \
    && curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
       -o /usr/local/lib/docker/cli-plugins/docker-compose \
    && chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

ARG DOCKER_GID=125

RUN groupadd -g ${DOCKER_GID} docker-host \
    && usermod -aG docker-host jenkins

USER jenkins