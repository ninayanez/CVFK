all :
	make deps
	make rebuild
	make build
	make css

build : 
	mkdir -p dist
	rsync -av src/ dist
	node_modules/.bin/babel src --out-dir dist

css :
	node_modules/.bin/stylus s.styl

deps : 
	npm i

rebuild :
	node_modules/.bin/electron-rebuild -v $(shell node_modules/.bin/electron -v | cut -d 'v' -f 2)

run :
	node_modules/.bin/electron .
