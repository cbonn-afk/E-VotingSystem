<?php

declare(strict_types=1);

namespace Modules\Documents\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Modules\Documents\Models\DocumentSetting;
use Modules\IdentityAccess\Models\User;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

final class DocumentSettingsTest extends TestCase
{
    use RefreshDatabase;

    private function staff(array $permissions = []): User
    {
        $user = User::factory()->create();

        foreach ($permissions as $name) {
            $user->givePermissionTo(Permission::findOrCreate($name, 'web'));
        }

        return $user;
    }

    public function test_any_signed_in_user_can_read_the_settings_and_defaults_are_created(): void
    {
        $this->actingAs($this->staff())
            ->getJson('/api/documents/settings')
            ->assertOk()
            ->assertJsonPath('data.template', 'classic')
            ->assertJsonPath('data.paperSize', 'A4')
            ->assertJsonPath('data.footerPageNumberLabel', 'Page');

        $this->assertSame(1, DocumentSetting::query()->count());
    }

    public function test_guests_cannot_read_the_settings(): void
    {
        $this->getJson('/api/documents/settings')->assertUnauthorized();
    }

    public function test_updating_requires_the_manage_permission(): void
    {
        $this->actingAs($this->staff())
            ->patchJson('/api/documents/settings', ['company_name' => 'Nope'])
            ->assertForbidden();
    }

    public function test_manager_can_update_and_values_persist(): void
    {
        $this->actingAs($this->staff(['settings.documents.manage']))
            ->patchJson('/api/documents/settings', [
                'company_name' => 'Cooperative Inc.',
                'accent_color' => '#112233',
                'template' => 'executive',
                'margin_mm' => 20,
                'company_tin' => '123-456-789-000',
                'show_signature_blocks' => false,
            ])
            ->assertOk()
            ->assertJsonPath('data.companyName', 'Cooperative Inc.')
            ->assertJsonPath('data.showSignatureBlocks', false);

        $this->assertDatabaseHas('document_settings', ['company_name' => 'Cooperative Inc.', 'template' => 'executive']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'documents.settings.updated']);
    }

    public function test_invalid_values_are_rejected(): void
    {
        $this->actingAs($this->staff(['settings.documents.manage']))
            ->patchJson('/api/documents/settings', [
                'accent_color' => 'red',
                'margin_mm' => 99,
                'company_tin' => '12345',
                'template' => 'fancy',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['accent_color', 'margin_mm', 'company_tin', 'template']);
    }

    public function test_logo_upload_and_replace_removes_the_previous_file(): void
    {
        Storage::fake('public');
        $user = $this->staff(['settings.documents.manage']);

        $this->actingAs($user)
            ->post('/api/documents/settings/logo', ['logo' => UploadedFile::fake()->image('a.png')], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.logoMode', 'upload');

        $first = DocumentSetting::current()->uploaded_logo_path;
        Storage::disk('public')->assertExists($first);

        $this->actingAs($user)
            ->post('/api/documents/settings/logo', ['logo' => UploadedFile::fake()->image('b.png')], ['Accept' => 'application/json'])
            ->assertOk();

        Storage::disk('public')->assertMissing($first);
    }

    public function test_switching_logo_to_none_clears_the_stored_file(): void
    {
        Storage::fake('public');
        $user = $this->staff(['settings.documents.manage']);

        $this->actingAs($user)->post('/api/documents/settings/logo', ['logo' => UploadedFile::fake()->image('a.png')], ['Accept' => 'application/json']);
        $path = DocumentSetting::current()->uploaded_logo_path;

        $this->actingAs($user)->patchJson('/api/documents/settings', ['logo_mode' => 'none'])->assertOk()
            ->assertJsonPath('data.uploadedLogoUrl', null);

        Storage::disk('public')->assertMissing($path);
    }

    public function test_logo_url_is_built_from_the_stored_path(): void
    {
        Storage::fake('public');
        $user = $this->staff(['settings.documents.manage']);

        $response = $this->actingAs($user)
            ->post('/api/documents/settings/logo', ['logo' => UploadedFile::fake()->image('a.png')], ['Accept' => 'application/json'])
            ->assertOk();

        $path = DocumentSetting::current()->uploaded_logo_path;
        $this->assertStringEndsWith('/storage/'.$path, $response->json('data.uploadedLogoUrl'));
    }
}
