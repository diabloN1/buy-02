#!/bin/zsh

mkdir -p "$HOME/.local/jdks"
cd "$HOME/.local/jdks" || exit 1

if [ ! -f eclipse ]; then
    echo "Downloading JDK 21..."
    curl -LO https://api.adoptium.net/v3/binary/latest/21/ga/linux/x64/jdk/hotspot/normal/eclipse
else
    echo "JDK archive already exists, skipping download."
fi

if [ ! -d "jdk-21.0.12+8" ]; then
    echo "Extracting JDK 21..."
    tar -xzf eclipse
else
    echo "JDK 21 already extracted, skipping extraction."
fi

export JAVA_HOME="$HOME/.local/jdks/jdk-21.0.12+8"
export PATH="$JAVA_HOME/bin:$PATH"

cd -