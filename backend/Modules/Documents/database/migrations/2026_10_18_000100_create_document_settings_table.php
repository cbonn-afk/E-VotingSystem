<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One row of global print settings. Every printable in every module
 * (loan agreements/receipts, election and accounting reports, payslips)
 * reads this row so the organisation's branding is configured once.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_settings', function (Blueprint $table): void {
            $table->id();
            $table->string('template')->default('classic');
            $table->string('paper_size')->default('A4');
            $table->string('orientation')->default('portrait');
            $table->unsignedSmallInteger('margin_mm')->default(12);
            $table->string('font_family')->default('Inter');
            $table->string('header_alignment')->default('split');
            $table->string('logo_mode')->default('none');
            $table->unsignedSmallInteger('logo_size')->default(44);
            $table->string('uploaded_logo_url', 2048)->nullable();
            $table->string('uploaded_logo_path', 2048)->nullable();
            $table->string('density')->default('comfortable');
            $table->string('border_style')->default('accent');
            $table->string('company_name')->default('Your Organization');
            $table->string('company_address', 500)->default('');
            $table->string('company_contact', 500)->default('');
            $table->string('company_tin', 20)->nullable();
            $table->string('accent_color', 20)->default('#B8892E');
            $table->text('footer_note')->nullable();
            $table->boolean('show_prepared_by')->default(true);
            $table->boolean('show_signature_blocks')->default(true);
            $table->boolean('table_striped')->default(true);
            $table->string('watermark')->nullable();
            $table->string('terms_title')->default('Terms and Notes');
            $table->string('footer_page_number_label')->default('Page');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_settings');
    }
};
