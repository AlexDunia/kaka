<?php
// Test harness only. The reused runner requires a newly created temporary SQLite database.
$integrationScript = __DIR__.'/check-phase07-e2e.mjs';
$integrationFixture = __DIR__.'/phase07-http-fixture.php';
$instrumentRequests = true;
require __DIR__.'/check-phase04-http.php';
