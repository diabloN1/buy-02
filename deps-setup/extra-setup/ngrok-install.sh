mkdir -p "$HOME/.local/bin"

curl -L https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz \
  | tar -xz -C "$HOME/.local/bin"

chmod +x "$HOME/.local/bin/ngrok"

echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
export PATH="$HOME/.local/bin:$PATH"
