all: 
	css
	es6

es6:
	[-d dist] && echo 'BUILD' || mkdir dist && echo 'BUILD'
	rsync -av lib/ dist
	node_modules/.bin/babel lib --out-dir dist

css:
	node_modules/.bin/stylus s.styl
