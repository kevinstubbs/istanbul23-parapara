all: install build
# Install forge dependencies (not needed if submodules are already initialized).
install:; forge install && pnpm install
# Build contracts and inject the Poseidon library.
build:; forge build
# Update forge dependencies.
update:; forge update
# Deploy contracts
deploy:; node --no-warnings scripts/deploy.js
template:; node --no-warnings scripts/template.js
fund:; node --no-warnings scripts/fund.js
