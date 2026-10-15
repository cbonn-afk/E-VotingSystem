<?php

declare(strict_types=1);

namespace Modules\Members\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'member_code' => $this->member_code,
            'name' => $this->name,
            'mobile_number' => $this->mobile_number,
            'birth_date' => $this->birth_date?->format('Y-m-d'),
            'address' => $this->address,
            'membership_date' => $this->membership_date?->format('Y-m-d'),
            'status' => $this->status,
            'is_delinquent' => $this->is_delinquent,
        ];
    }
}
