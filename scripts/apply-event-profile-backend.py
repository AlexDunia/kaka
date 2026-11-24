"""Install the public-profile schema/API changes into the connected Laravel app.

This updates source only. It never seeds events or edits event content.
"""
from pathlib import Path
import shutil
import re

workspace = Path(__file__).resolve().parents[1]
backend = Path(r'C:\Users\HP\kakabackend').resolve()
assert (backend / 'artisan').is_file(), 'Expected the connected Laravel backend.'
staged = workspace / 'backend' / 'laravel-event-profile'
for source in staged.rglob('*.php'):
    destination = backend / source.relative_to(staged)
    assert destination.resolve().is_relative_to(backend)
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, destination)

model = backend / 'app/Models/Event.php'
content = model.read_text(encoding='utf-8-sig')
if 'function publicProfile(' not in content:
    method = '''
    public function publicProfile(): \\Illuminate\\Database\\Eloquent\\Relations\\HasOne
    {
        return $this->hasOne(EventPublicProfile::class);
    }
'''
    position = content.rfind('}')
    content = content[:position] + method + content[position:]
    model.write_text(content, encoding='utf-8')

controller = backend / 'app/Http/Controllers/Api/EventController.php'
content = controller.read_text(encoding='utf-8-sig')
start = content.index('    public function show(Event $event)')
end = content.index('    /**', start)
block = content[start:end]
if '$reservedQuantities' not in block:
    block = block.replace('        $relatedIds', '''        $inventory = app(\\App\\Services\\Commerce\\InventoryService::class);
        $reservedQuantities = $inventory->reservedQuantities($event->ticketTypes->pluck('id')->all());
        foreach ($event->ticketTypes as $ticketType) {
            $ticketType->setAttribute('available_quantity', $inventory->availableQuantity(
                (int) $ticketType->quantity, (int) ($reservedQuantities[$ticketType->id] ?? 0)
            ));
        }

        $relatedIds''', 1) if '$relatedIds' in block else block
if "'publicProfile'" not in block:
    block = block.replace("            'category',", "            'publicProfile',\n            'media',\n            'category',", 1)
if '$relatedIds' not in block:
    block = block.replace('        return response()->json([', '''        $relatedIds = $event->publicProfile?->related_event_ids ?? [];
        $event->setAttribute('related_events', Event::query()
            ->with(['organizer', 'address'])
            ->whereIn('id', $relatedIds)
            ->where('id', '!=', $event->id)
            ->where('status', 'active')
            ->get(['id', 'title', 'date', 'main_image', 'organizer_id', 'address_id']));

        return response()->json([''', 1)
content = content[:start] + block + content[end:]
controller.write_text(content, encoding='utf-8')
# This application authenticates SPA buyers with cookie sessions. Its existing
# test used a token helper that requires a trait the session-only User lacks.
lifecycle = backend / 'tests/Feature/CommercePaymentLifecycleTest.php'
if lifecycle.is_file():
    content = lifecycle.read_text(encoding='utf-8-sig')
    if 'Sanctum::actingAs(' in content:
        content = re.sub(r'Sanctum::actingAs\((\$\w+)\);', r"$this->actingAs(\1, 'web');", content)
        content = content.replace('use Laravel\\Sanctum\\Sanctum;\n', '')
        lifecycle.write_text(content, encoding='utf-8')
    # Bind the authenticated request guard directly, as the token helper did,
    # so switching buyers within one test replaces its cached request identity.
    adjusted = re.sub(r"\$this->actingAs\((\$(?:buyer|other)), 'web'\);", r"$this->actingAs(\1, 'sanctum');", content)
    if adjusted != content:
        lifecycle.write_text(adjusted, encoding='utf-8')
print('Installed event profile migration, model, API relation and isolated tests. No event rows were inserted.')
