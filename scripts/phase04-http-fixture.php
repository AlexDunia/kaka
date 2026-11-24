<?php
$root = dirname(__DIR__, 2).'/kakabackend';
require $root.'/vendor/autoload.php';
$app = require $root.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$path = str_replace('\\', '/', config('database.connections.sqlite.database'));
if (!app()->environment('testing') || config('database.default') !== 'sqlite' || !str_starts_with($path, str_replace('\\', '/', sys_get_temp_dir()).'/rushhour-phase04-')) exit(3);
$fixtures = new class {
    use Tests\Support\EventLifecycleFixtures;
    public function create(): array {
        $owner=App\Models\User::factory()->create(['email'=>'owner-phase04@example.invalid','password'=>Illuminate\Support\Facades\Hash::make('Phase04-test-password!')]);
        $staff=App\Models\User::factory()->create(['email'=>'door-phase04@example.invalid','password'=>Illuminate\Support\Facades\Hash::make('Phase04-test-password!')]);
        $other=App\Models\User::factory()->create(['email'=>'other-phase04@example.invalid','password'=>Illuminate\Support\Facades\Hash::make('Phase04-test-password!')]);
        $schema=json_encode([['id'=>'name','label'=>'Guest name','enabled'=>true,'required'=>true],['id'=>'email','label'=>'Guest email','enabled'=>true,'required'=>false]]);
        $table=$this->lifecycleEvent($owner,true);
        $table->forceFill(['attendee_fields'=>$schema])->save();
        $individual=$this->lifecycleEvent($owner,true);
        $individual->forceFill(['attendee_fields'=>$schema])->save();
        $individual->ticketTypes()->first()->update(['unit_type'=>'individual','people_per_unit'=>1]);
        $free=$this->lifecycleEvent($owner,true,false);
        $free->forceFill(['attendee_fields'=>$schema,'total_tickets'=>2])->save();
        $gates=[];
        foreach([$table,$individual,$free] as $event) $gates[$event->id]=Illuminate\Support\Facades\DB::table('event_entrances')->insertGetId(['event_id'=>$event->id,'name'=>'Main entrance','active'=>true,'opens_at'=>'2020-01-01','closes_at'=>'2040-01-01','created_at'=>now(),'updated_at'=>now()]);
        Illuminate\Support\Facades\DB::table('event_staff')->insert(['event_id'=>$table->id,'user_id'=>$staff->id,'role'=>'door','entrance_id'=>$gates[$table->id],'active'=>true]);
        return ['table_event'=>$table->id,'table_type'=>$table->ticketTypes()->first()->id,'individual_event'=>$individual->id,'individual_type'=>$individual->ticketTypes()->first()->id,'free_event'=>$free->id,'gates'=>$gates];
    }
};
echo json_encode($fixtures->create(),JSON_THROW_ON_ERROR);
