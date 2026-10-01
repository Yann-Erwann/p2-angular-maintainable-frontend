FROM node:22-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        openssh-server \
        git \
        curl \
        ca-certificates \
        procps \
        bash \
    && rm -rf /var/lib/apt/lists/*

# Allow public-key SSH login without setting a usable password.
RUN usermod --password '*' node

RUN mkdir -p \
    /run/sshd \
    /home/node/.ssh \
    /var/lib/ssh-host-keys \
    /workspace/node_modules

COPY sshd_config /etc/ssh/sshd_config
COPY entrypoint.sh /usr/local/bin/workspace-entrypoint

RUN chmod 0755 /usr/local/bin/workspace-entrypoint

WORKDIR /workspace

EXPOSE 22 4200

ENTRYPOINT ["/usr/local/bin/workspace-entrypoint"]
