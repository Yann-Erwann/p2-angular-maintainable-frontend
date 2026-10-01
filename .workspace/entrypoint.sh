#!/usr/bin/env bash

set -euo pipefail

mkdir -p /home/node/.ssh
mkdir -p /var/lib/ssh-host-keys
mkdir -p /workspace/node_modules

if [ ! -f /var/lib/ssh-host-keys/ssh_host_ed25519_key ]; then
    ssh-keygen \
        -t ed25519 \
        -f /var/lib/ssh-host-keys/ssh_host_ed25519_key \
        -N ""
fi

if [ -f /tmp/authorized_keys ]; then
    cp /tmp/authorized_keys /home/node/.ssh/authorized_keys
fi

chown node:node /home/node
chown node:node /home/node/.ssh

if [ -f /home/node/.ssh/authorized_keys ]; then
    chown node:node /home/node/.ssh/authorized_keys
    chmod 600 /home/node/.ssh/authorized_keys
fi

chmod 700 /home/node/.ssh

chown node:node /workspace/node_modules

exec /usr/sbin/sshd -D -e
