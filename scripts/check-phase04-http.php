<?php
$root=dirname(__DIR__,2).'/kakabackend';
if(is_file($root.'/bootstrap/cache/config.php'))throw new RuntimeException('Clear configuration cache before isolated tests.');
$database=str_replace('\\','/',sys_get_temp_dir()).'/rushhour-phase04-'.bin2hex(random_bytes(12)).'.sqlite';
$handle=fopen($database,'x');if(!$handle)throw new RuntimeException('Cannot create isolated database.');fclose($handle);
$fixture=tempnam(sys_get_temp_dir(),'rushhour-phase04-fixture-');
$router=tempnam(sys_get_temp_dir(),'rushhour-phase04-router-');
$log=tempnam(sys_get_temp_dir(),'rushhour-phase04-log-');
$environment=array_merge(getenv(),['APP_ENV'=>'testing','APP_DEBUG'=>'false','DB_CONNECTION'=>'sqlite','DB_DATABASE'=>$database,'DB_URL'=>'','CACHE_STORE'=>'array','SESSION_DRIVER'=>'database','QUEUE_CONNECTION'=>'sync','MAIL_MAILER'=>'array','APP_URL'=>'http://127.0.0.1:8014','FRONTEND_URL'=>'http://localhost:5174','SESSION_DOMAIN'=>'','PHASE04_FIXTURE'=>$fixture]);
$run=function(array $command,string $cwd) use($environment) {
 $process=proc_open($command,[0=>STDIN,1=>STDOUT,2=>STDERR],$pipes,$cwd,$environment);
 if(!is_resource($process)||proc_close($process)!==0)throw new RuntimeException('Isolated integration subprocess failed.');
};
$server=null;
try {
 $socket=@stream_socket_client('tcp://127.0.0.1:8014',$errno,$error,1);
 if($socket){fclose($socket);throw new RuntimeException('Integration port is already in use.');}
 $run([PHP_BINARY,'artisan','migrate','--force'],$root);
 $seed=proc_open([PHP_BINARY,__DIR__.'/phase04-http-fixture.php'],[0=>STDIN,1=>['file',$fixture,'w'],2=>STDERR],$pipes,$root,$environment);
 if(!is_resource($seed)||proc_close($seed)!==0)throw new RuntimeException('Fixture creation failed.');
 $source=file_get_contents($root.'/tests/Support/phase03-http-router.php');
 $source=str_replace("dirname(__DIR__, 2)",var_export($root,true),$source);
 $source=str_replace('rushhour-phase03-','rushhour-phase04-',$source);
 file_put_contents($router,$source);
 $server=proc_open([PHP_BINARY,'-S','127.0.0.1:8014',$router],[0=>['pipe','r'],1=>['file',$log,'a'],2=>['file',$log,'a']],$pipes,$root,$environment);
 if(!is_resource($server))throw new RuntimeException('Cannot start isolated server.');fclose($pipes[0]);
 $ready=false;
 for($attempt=0;$attempt<100;$attempt++) { $socket=@stream_socket_client('tcp://127.0.0.1:8014',$errno,$error,0.1);if($socket){fclose($socket);$ready=true;break;}usleep(100000); }
 if(!$ready)throw new RuntimeException('Isolated HTTP server did not start.');
 $run(['node',$integrationScript ?? __DIR__.'/check-phase04-e2e.mjs'],dirname(__DIR__));
} finally {
 if(is_resource($server)){proc_terminate($server);proc_close($server);}
 foreach([$database,$fixture,$router,$log] as $temporary)if(is_file($temporary))unlink($temporary);
 echo 'Removed only generated Phase 4 integration files.'.PHP_EOL;
}
