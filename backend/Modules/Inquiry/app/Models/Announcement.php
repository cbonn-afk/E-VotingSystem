<?php

declare(strict_types=1);

namespace Modules\Inquiry\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Announcement extends Model
{
    protected $table = 'inquiry_announcements';

    protected $fillable = ['title', 'body', 'image_path', 'is_published', 'created_by'];

    protected function casts(): array
    {
        return ['is_published' => 'boolean'];
    }

    protected function imageUrl(): Attribute
    {
        return Attribute::get(
            fn (): ?string => $this->image_path ? Storage::disk('public')->url($this->image_path) : null,
        );
    }

    /** @return array<string,mixed> */
    public function toPayload(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'body' => $this->body,
            'image_url' => $this->image_url,
            'is_published' => $this->is_published,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
