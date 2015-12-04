build: 
	rsync -av lib/ dist
	babel lib --out-dir dist
