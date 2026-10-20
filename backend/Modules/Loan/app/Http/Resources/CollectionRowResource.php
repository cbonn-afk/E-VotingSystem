<?php

declare(strict_types=1);

namespace Modules\Loan\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Loan\Support\CollectionClassifier;

/** One late loan in the follow-up list. @mixin \Modules\Loan\Models\Loan */
final class CollectionRowResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'loan_no' => $this->loan_no,
            'collection_status' => $this->collection_status,
            'days_past_due' => $this->days_past_due,
            'bucket' => CollectionClassifier::bucket((int) $this->days_past_due),
            'overdue_amount' => (string) $this->overdue_amount,
            'oldest_due_date' => $this->oldest_due_date?->format('Y-m-d'),
            'outstanding_balance' => (string) $this->outstanding_balance,
            'last_payment_on' => $this->last_payment_on === null ? null : substr((string) $this->last_payment_on, 0, 10),
            'member' => $this->whenLoaded('member', fn () => [
                'id' => $this->member->id,
                'member_code' => $this->member->member_code,
                'name' => $this->member->name,
                'mobile_number' => $this->member->mobile_number,
            ]),
            'product' => $this->whenLoaded('product', fn () => ['id' => $this->product->id, 'name' => $this->product->name]),
        ];
    }
}
