build: 
	[-d dist] && echo 'BUILD' || mkdir dist && echo 'BUILD'
	rsync -av lib/ dist
	babel lib --out-dir dist
