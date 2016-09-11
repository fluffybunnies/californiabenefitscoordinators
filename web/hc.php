<?php
if (!defined('WEBROOT'))
	exit;

use \ace\Ace;

checkWordpressDb();

header('Content-Type: text/plain');
echo 'OK';

function checkWordpressDb(){
	try {
		$db = new mysqli(Ace::getConfig('WORDPRESS_DB_HOST'), Ace::getConfig('WORDPRESS_DB_USER'), Ace::getConfig('WORDPRESS_DB_PASS'), Ace::getConfig('WORDPRESS_DB_NAME'), Ace::getConfig('WORDPRESS_DB_PORT'));
		if (!empty($db->connect_error))
			throw new \Exception('Error connecting to DB. Errno: '.$db->connect_errno);
		$req = $db->query('show tables');
		if (!$req)
			throw new \Exception('Error querying DB');
		$r = $req->fetch_assoc();
		if (!($r && current($r)))
			throw new \Exception('Expecting at least one table');
	} catch (\Exception $e) {
		errorOut('db', $e->getMessage()."\n".$e->getTraceAsString());
	}
}

function errorOut($errorKey, $error){
	header('HTTP/1.1 503 Service Unavailable');
	header('X-Error-Key: '.$errorKey);
	header('Retry-After: 60');
	echo $error;
	exit;
}
