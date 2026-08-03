.PHONY: build dev start lint format clean install test

SHELL := /bin/bash

build:
	npm run build

dev:
	npm run dev

start:
	npm run start

lint:
	npm run lint

format:
	npm run format

clean:
	rm -rf dist node_modules

install:
	npm install

test:
	echo "No tests yet"
