<?php
ob_start();
require __DIR__.'/phase04-http-fixture.php';
$fixture = json_decode(ob_get_clean(), true, 512, JSON_THROW_ON_ERROR);
$event = App\Models\Event::findOrFail($fixture['free_event']);
$event->update(['total_tickets' => 2000]);
// Real registration service creates 1,000 admission records on this disposable database.
for ($batch = 0; $batch < 50; $batch++) {
    $attendees = [];
    for ($unit = 0; $unit < 20; $unit++) {
        $attendees[] = ['unit_index' => $unit, 'seat_index' => 0, 'answers' => ['name' => 'Load guest '.($batch * 20 + $unit), 'email' => 'load'.($batch * 20 + $unit).'@example.invalid']];
    }
    app(App\Services\Commerce\FreeRegistrationService::class)->register($event->id, [
        'checkout_token' => (string) Illuminate\Support\Str::uuid(), 'quantity' => 20,
        'customer' => ['first_name' => 'Load', 'last_name' => 'Buyer', 'email' => 'loadbuyer'.$batch.'@example.invalid'],
        'attendees' => $attendees,
    ], null);
}
$owner = $event->created_by;
for ($i = 0; $i < 35; $i++) {
    app(App\Services\CreateEventService::class)->saveEvent(['title' => 'Pagination fixture '.$i], $owner);
}
echo json_encode($fixture, JSON_THROW_ON_ERROR);
