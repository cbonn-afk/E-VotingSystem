<?php

declare(strict_types=1);

namespace Modules\Loan\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\IdentityAccess\Models\User;
use Modules\Loan\Models\Loan;
use Modules\Loan\Models\LoanAgreement;
use Modules\Loan\Models\LoanApplication;
use Modules\Loan\Models\LoanApplicationApproval;
use Modules\Loan\Models\LoanApplicationDocument;
use Modules\Loan\Models\LoanApplicationEvaluation;
use Modules\Loan\Models\LoanApplicationEvent;
use Modules\Loan\Models\LoanApplicationGuarantor;
use Modules\Loan\Models\LoanProduct;
use Modules\Loan\Models\LoanRelease;
use Modules\Loan\Support\AgreementService;
use Modules\Loan\Support\ApplicationStatus as S;
use Modules\Loan\Support\ApprovalPolicy;
use Modules\Members\Models\Member;
use Spatie\Permission\Exceptions\RoleDoesNotExist;

/**
 * One sample application at every stage of the workflow, from draft to released (plus rejected and cancelled),
 * so each Loan screen has something to show. Needs the members, products, approval levels and staff accounts.
 *
 * Skipped when any application already exists, so real data is never mixed with samples.
 * The uploaded "documents" are a 1x1 placeholder image written to the private disk.
 */
final class LoanApplicationSeeder extends Seeder
{
    private const PLACEHOLDER_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    /** @var array<string, User> */
    private array $staff = [];

    public function run(): void
    {
        if (LoanApplication::query()->exists()) {
            return;
        }

        $members = Member::query()->get()->keyBy('member_code');
        $products = LoanProduct::query()->with('documents')->get()->keyBy('code');

        if ($members->count() < 20 || $products->isEmpty()) {
            $this->command?->warn('Loan applications skipped: run MembersDatabaseSeeder and LoanProductSeeder first.');

            return;
        }

        $this->draft($members['M-0001'], $products['SAL']);
        $this->submitted($members['M-0002'], $products['EML']);
        $this->documentReview($members['M-0003'], $products['EDU']);
        $this->returned($members['M-0004'], $products['AGR'], $members['M-0016']);
        $this->forEvaluation($members['M-0005'], $products['SAL']);
        $this->forApproval($members['M-0006'], $products['BUS'], [$members['M-0017'], $members['M-0018']]);
        $this->approved($members['M-0007'], $products['SAL']);
        $this->forAgreement($members['M-0008'], $products['EDU']);
        $this->forRelease($members['M-0010'], $products['SAL']);
        $this->released($members['M-0011'], $products['AGR'], $members['M-0019']);
        $this->rejected($members['M-0012'], $products['SAL']);
        $this->cancelled($members['M-0002'], $products['SAL']);
    }

    // ───────────────────────────── scenarios ─────────────────────────────

    private function draft(Member $member, LoanProduct $product): void
    {
        $this->application($member, $product, S::DRAFT, [
            'amount' => 15000, 'term' => 6, 'purpose' => 'School supplies and uniforms for my two children.',
            'income' => 22000, 'employer' => 'Municipal Treasurer\'s Office, Batac',
        ]);
    }

    private function submitted(Member $member, LoanProduct $product): void
    {
        $at = now()->subDays(1);
        $app = $this->application($member, $product, S::SUBMITTED, [
            'amount' => 8000, 'term' => 4, 'purpose' => 'Hospital bill of a family member.',
            'income' => 18000, 'employer' => 'Self-employed, sari-sari store', 'submitted_at' => $at,
        ]);
        $this->documents($app, $product, 'pending');
        $this->trail($app, $at, [[S::DRAFT, S::SUBMITTED, 'member', $member->name, null]]);
    }

    private function documentReview(Member $member, LoanProduct $product): void
    {
        $at = now()->subDays(3);
        $officer = $this->staff('Loan Officer');
        $app = $this->application($member, $product, S::DOCUMENT_REVIEW, [
            'amount' => 25000, 'term' => 8, 'purpose' => 'Tuition for the second semester (BS Nursing).',
            'income' => 30000, 'employer' => 'Laoag City Water District', 'submitted_at' => $at, 'reviewed_by' => $officer->id,
        ]);
        $this->documents($app, $product, 'pending');
        $this->trail($app, $at, [
            [S::DRAFT, S::SUBMITTED, 'member', $member->name, null],
            [S::SUBMITTED, S::DOCUMENT_REVIEW, 'staff', $officer->name, null],
        ]);
    }

    private function returned(Member $member, LoanProduct $product, Member $guarantor): void
    {
        $at = now()->subDays(6);
        $officer = $this->staff('Loan Officer');
        $remarks = 'The barangay certification is blurry and unsigned. Please upload a clear, signed copy.';
        $app = $this->application($member, $product, S::RETURNED, [
            'amount' => 40000, 'term' => 6, 'purpose' => 'Fertilizer and seeds for the dry-season corn planting.',
            'income' => 15000, 'employer' => 'Own 2-hectare farm, Bangui', 'submitted_at' => $at,
            'reviewed_by' => $officer->id, 'remarks' => $remarks,
        ]);
        $this->documents($app, $product, 'accepted', $officer, [
            'Barangay certification of farm ownership or tenancy' => ['rejected', 'Unsigned and hard to read.'],
        ]);
        $this->guarantors($app, [$guarantor]);
        $this->trail($app, $at, [
            [S::DRAFT, S::SUBMITTED, 'member', $member->name, null],
            [S::SUBMITTED, S::DOCUMENT_REVIEW, 'staff', $officer->name, null],
            [S::DOCUMENT_REVIEW, S::RETURNED, 'staff', $officer->name, $remarks],
        ]);
    }

    private function forEvaluation(Member $member, LoanProduct $product): void
    {
        $at = now()->subDays(8);
        $officer = $this->staff('Loan Officer');
        $app = $this->application($member, $product, S::FOR_EVALUATION, [
            'amount' => 30000, 'term' => 12, 'purpose' => 'Roof repair after the typhoon.',
            'income' => 28000, 'employer' => 'Ilocos Norte Electric Cooperative', 'submitted_at' => $at, 'reviewed_by' => $officer->id,
        ]);
        $this->documents($app, $product, 'accepted', $officer);
        $this->trail($app, $at, [
            [S::DRAFT, S::SUBMITTED, 'member', $member->name, null],
            [S::SUBMITTED, S::DOCUMENT_REVIEW, 'staff', $officer->name, null],
            [S::DOCUMENT_REVIEW, S::FOR_EVALUATION, 'staff', $officer->name, null],
        ]);
    }

    /** @param list<Member> $guarantors */
    private function forApproval(Member $member, LoanProduct $product, array $guarantors): void
    {
        $at = now()->subDays(14);
        $officer = $this->staff('Loan Officer');
        $evaluator = $this->staff('Loan Evaluator');
        $amount = 120000;

        $app = $this->application($member, $product, S::FOR_APPROVAL, [
            'amount' => $amount, 'term' => 24, 'purpose' => 'Buy a second delivery tricycle and stock for the hardware store.',
            'income' => 65000, 'employer' => 'Owner, Teresita Hardware and Construction Supply',
            'submitted_at' => $at, 'reviewed_by' => $officer->id, 'chain' => (new ApprovalPolicy)->chainFor($amount),
        ]);
        $this->documents($app, $product, 'accepted', $officer);
        $this->guarantors($app, $guarantors);
        $this->evaluation($app, $evaluator, 'approve', null, 65000, 12000, 'Store has steady sales. Debt-to-income ratio is acceptable. Recommend full amount.');

        $chain = $app->approval_chain;
        $this->approval($app, $chain[0], $officer, $amount, 'Good standing, complete documents.', $at->copy()->addDays(5));

        $this->trail($app, $at, [
            [S::DRAFT, S::SUBMITTED, 'member', $member->name, null],
            [S::SUBMITTED, S::DOCUMENT_REVIEW, 'staff', $officer->name, null],
            [S::DOCUMENT_REVIEW, S::FOR_EVALUATION, 'staff', $officer->name, null],
            [S::FOR_EVALUATION, S::FOR_APPROVAL, 'staff', $evaluator->name, 'Evaluation: recommends approval.'],
            [S::FOR_APPROVAL, S::FOR_APPROVAL, 'staff', $officer->name, 'Loan Officer approved. Good standing, complete documents.'],
        ]);
    }

    private function approved(Member $member, LoanProduct $product): void
    {
        $at = now()->subDays(10);
        $officer = $this->staff('Loan Officer');
        $evaluator = $this->staff('Loan Evaluator');
        $requested = 40000;
        $approved = 35000;

        $app = $this->application($member, $product, S::APPROVED, [
            'amount' => $requested, 'approved_amount' => $approved, 'term' => 12,
            'purpose' => 'Home repair and a refrigerator.', 'income' => 32000, 'employer' => 'Department of Education, Vigan',
            'submitted_at' => $at, 'reviewed_by' => $officer->id, 'chain' => (new ApprovalPolicy)->chainFor($approved),
        ]);
        $this->documents($app, $product, 'accepted', $officer);
        $this->evaluation($app, $evaluator, 'approve_lower', (float) $approved, 32000, 9000, 'Existing obligations limit the capacity. Recommend a lower amount.');
        $this->approval($app, $app->approval_chain[0], $officer, $approved, null, $at->copy()->addDays(4));

        $this->trail($app, $at, [
            [S::DRAFT, S::SUBMITTED, 'member', $member->name, null],
            [S::SUBMITTED, S::DOCUMENT_REVIEW, 'staff', $officer->name, null],
            [S::DOCUMENT_REVIEW, S::FOR_EVALUATION, 'staff', $officer->name, null],
            [S::FOR_EVALUATION, S::FOR_APPROVAL, 'staff', $evaluator->name, 'Evaluation: recommends a lower amount.'],
            [S::FOR_APPROVAL, S::APPROVED, 'staff', $officer->name, 'Loan Officer approved. Final approved amount: 35,000.00.'],
        ]);
    }

    private function forAgreement(Member $member, LoanProduct $product): void
    {
        $at = now()->subDays(12);
        $officer = $this->staff('Loan Officer');
        $evaluator = $this->staff('Loan Evaluator');
        $amount = 40000;

        $app = $this->application($member, $product, S::FOR_AGREEMENT, [
            'amount' => $amount, 'approved_amount' => $amount, 'term' => 10,
            'purpose' => 'Tuition and boarding house for my son in college.', 'income' => 27000, 'employer' => 'Santa Maria Rural Bank',
            'submitted_at' => $at, 'reviewed_by' => $officer->id, 'chain' => (new ApprovalPolicy)->chainFor($amount),
        ]);
        $this->documents($app, $product, 'accepted', $officer);
        $this->evaluation($app, $evaluator, 'approve', null, 27000, 3000, 'Stable employment. Recommend approval.');
        $this->approval($app, $app->approval_chain[0], $officer, $amount, null, $at->copy()->addDays(3));
        $this->agreement($app, $officer, $this->firstDue(), null, $at->copy()->addDays(4));

        $this->trail($app, $at, [
            [S::DRAFT, S::SUBMITTED, 'member', $member->name, null],
            [S::SUBMITTED, S::DOCUMENT_REVIEW, 'staff', $officer->name, null],
            [S::DOCUMENT_REVIEW, S::FOR_EVALUATION, 'staff', $officer->name, null],
            [S::FOR_EVALUATION, S::FOR_APPROVAL, 'staff', $evaluator->name, 'Evaluation: recommends approval.'],
            [S::FOR_APPROVAL, S::APPROVED, 'staff', $officer->name, 'Loan Officer approved. Final approved amount: 40,000.00.'],
            [S::APPROVED, S::FOR_AGREEMENT, 'staff', $officer->name, 'Agreement generated for 40000.'],
        ]);
    }

    private function forRelease(Member $member, LoanProduct $product): void
    {
        $at = now()->subDays(16);
        $officer = $this->staff('Loan Officer');
        $evaluator = $this->staff('Loan Evaluator');
        $amount = 20000;

        $app = $this->application($member, $product, S::FOR_RELEASE, [
            'amount' => $amount, 'approved_amount' => $amount, 'term' => 10,
            'purpose' => 'Working capital for a small piggery.', 'income' => 24000, 'employer' => 'Self-employed, backyard piggery',
            'submitted_at' => $at, 'reviewed_by' => $officer->id, 'chain' => (new ApprovalPolicy)->chainFor($amount),
        ]);
        $this->documents($app, $product, 'accepted', $officer);
        $this->evaluation($app, $evaluator, 'approve', null, 24000, 2000, 'Recommend approval.');
        $this->approval($app, $app->approval_chain[0], $officer, $amount, null, $at->copy()->addDays(3));
        $this->agreement($app, $officer, $this->firstDue(), 'portal', $at->copy()->addDays(5));

        $this->trail($app, $at, [
            [S::DRAFT, S::SUBMITTED, 'member', $member->name, null],
            [S::SUBMITTED, S::DOCUMENT_REVIEW, 'staff', $officer->name, null],
            [S::DOCUMENT_REVIEW, S::FOR_EVALUATION, 'staff', $officer->name, null],
            [S::FOR_EVALUATION, S::FOR_APPROVAL, 'staff', $evaluator->name, 'Evaluation: recommends approval.'],
            [S::FOR_APPROVAL, S::APPROVED, 'staff', $officer->name, 'Loan Officer approved. Final approved amount: 20,000.00.'],
            [S::APPROVED, S::FOR_AGREEMENT, 'staff', $officer->name, 'Agreement generated for 20000.'],
            [S::FOR_AGREEMENT, S::FOR_RELEASE, 'member', $member->name, 'The member accepted the agreement.'],
        ]);
    }

    private function released(Member $member, LoanProduct $product, Member $guarantor): void
    {
        $at = now()->subDays(20);
        $officer = $this->staff('Loan Officer');
        $evaluator = $this->staff('Loan Evaluator');
        $committee = $this->staff('Credit Committee');
        $cashier = $this->staff('Cashier');
        $amount = 60000;

        $app = $this->application($member, $product, S::RELEASED, [
            'amount' => $amount, 'approved_amount' => $amount, 'term' => 12,
            'purpose' => 'Irrigation pump and inputs for the wet-season rice crop.', 'income' => 38000, 'employer' => 'Own 3-hectare rice farm, Narvacan',
            'submitted_at' => $at, 'reviewed_by' => $officer->id, 'chain' => (new ApprovalPolicy)->chainFor($amount),
        ]);
        $this->documents($app, $product, 'accepted', $officer);
        $this->guarantors($app, [$guarantor]);
        $this->evaluation($app, $evaluator, 'approve', null, 38000, 4000, 'Seasonal income, good repayment history. Recommend approval.');

        $chain = $app->approval_chain;
        $this->approval($app, $chain[0], $officer, $amount, null, $at->copy()->addDays(3));
        $this->approval($app, $chain[1], $committee, $amount, 'Approved by the committee.', $at->copy()->addDays(5));

        $agreement = $this->agreement($app, $officer, $this->firstDue(), 'portal', $at->copy()->addDays(7));
        $this->release($app, $agreement, $cashier, $at->copy()->addDays(8));

        $this->trail($app, $at, [
            [S::DRAFT, S::SUBMITTED, 'member', $member->name, null],
            [S::SUBMITTED, S::DOCUMENT_REVIEW, 'staff', $officer->name, null],
            [S::DOCUMENT_REVIEW, S::FOR_EVALUATION, 'staff', $officer->name, null],
            [S::FOR_EVALUATION, S::FOR_APPROVAL, 'staff', $evaluator->name, 'Evaluation: recommends approval.'],
            [S::FOR_APPROVAL, S::FOR_APPROVAL, 'staff', $officer->name, 'Loan Officer approved.'],
            [S::FOR_APPROVAL, S::APPROVED, 'staff', $committee->name, 'Credit Committee approved. Final approved amount: 60,000.00. Approved by the committee.'],
            [S::APPROVED, S::FOR_AGREEMENT, 'staff', $officer->name, 'Agreement generated for 60000.'],
            [S::FOR_AGREEMENT, S::FOR_RELEASE, 'member', $member->name, 'The member accepted the agreement.'],
            [S::FOR_RELEASE, S::RELEASED, 'staff', $cashier->name, 'Loan released by cash.'],
        ]);
    }

    private function rejected(Member $member, LoanProduct $product): void
    {
        $at = now()->subDays(9);
        $officer = $this->staff('Loan Officer');
        $remarks = 'The requested amount is more than the member can repay based on the submitted payslip.';
        $app = $this->application($member, $product, S::REJECTED, [
            'amount' => 50000, 'term' => 6, 'purpose' => 'Personal expenses.', 'income' => 14000, 'employer' => 'Contractual worker, Pagudpud',
            'submitted_at' => $at, 'reviewed_by' => $officer->id, 'remarks' => $remarks,
        ]);
        $this->documents($app, $product, 'pending');
        $this->trail($app, $at, [
            [S::DRAFT, S::SUBMITTED, 'member', $member->name, null],
            [S::SUBMITTED, S::REJECTED, 'staff', $officer->name, $remarks],
        ]);
    }

    private function cancelled(Member $member, LoanProduct $product): void
    {
        $at = now()->subDays(18);
        $app = $this->application($member, $product, S::CANCELLED, [
            'amount' => 10000, 'term' => 5, 'purpose' => 'No longer needed.', 'income' => 18000, 'employer' => 'Self-employed, sari-sari store',
            'submitted_at' => $at,
        ]);
        $this->trail($app, $at, [
            [S::DRAFT, S::SUBMITTED, 'member', $member->name, null],
            [S::SUBMITTED, S::CANCELLED, 'member', $member->name, null],
        ]);
    }

    // ───────────────────────────── building blocks ─────────────────────────────

    /** @param array<string, mixed> $o */
    private function application(Member $member, LoanProduct $product, string $status, array $o): LoanApplication
    {
        $submitted = $o['submitted_at'] ?? null;

        $app = LoanApplication::query()->create([
            'member_id' => $member->id,
            'product_id' => $product->id,
            'status' => $status,
            'amount' => $o['amount'],
            'approved_amount' => $o['approved_amount'] ?? null,
            'term_months' => $o['term'],
            'purpose' => $o['purpose'],
            'monthly_income' => $o['income'] ?? null,
            'employer_business' => $o['employer'] ?? null,
            'submitted_at' => $submitted,
            'product_snapshot' => $submitted === null ? null : $product->only([
                'code', 'name', 'interest_rate', 'interest_method', 'payment_frequency',
                'processing_fee_percent', 'service_fee_percent', 'penalty_rate_percent', 'grace_period_days',
            ]),
            'approval_chain' => $o['chain'] ?? null,
            'reviewed_by' => $o['reviewed_by'] ?? null,
            'status_remarks' => $o['remarks'] ?? null,
        ]);

        $app->update(['reference_no' => sprintf('LN-%s-%06d', now()->format('Y'), $app->id)]);

        return $app->refresh();
    }

    /**
     * Uploads every required document of the product (a 1x1 placeholder image).
     *
     * @param  array<string, array{0:string,1:?string}>  $overrides  requirement => [status, remarks]
     */
    private function documents(LoanApplication $app, LoanProduct $product, string $default, ?User $reviewer = null, array $overrides = []): void
    {
        foreach ($product->documents->where('is_required', true) as $doc) {
            [$status, $remarks] = $overrides[$doc->name] ?? [$default, null];
            $slug = Str::slug($doc->name);
            $path = "loan/applications/{$app->id}/{$slug}.png";

            Storage::disk('local')->put($path, (string) base64_decode(self::PLACEHOLDER_PNG, true));

            LoanApplicationDocument::query()->create([
                'application_id' => $app->id,
                'requirement' => $doc->name,
                'path' => $path,
                'original_name' => "{$slug}.png",
                'mime' => 'image/png',
                'size' => (int) Storage::disk('local')->size($path),
                'status' => $status,
                'remarks' => $remarks,
                'reviewed_by' => $status === 'pending' ? null : $reviewer?->id,
                'reviewed_at' => $status === 'pending' ? null : now()->subDays(2),
            ]);
        }
    }

    /** @param list<Member> $guarantors */
    private function guarantors(LoanApplication $app, array $guarantors): void
    {
        foreach ($guarantors as $guarantor) {
            LoanApplicationGuarantor::query()->create(['application_id' => $app->id, 'member_id' => $guarantor->id]);
        }
    }

    private function evaluation(LoanApplication $app, User $evaluator, string $recommendation, ?float $recommended, float $income, float $obligations, string $notes): void
    {
        LoanApplicationEvaluation::query()->create([
            'application_id' => $app->id,
            'evaluator_id' => $evaluator->id,
            'evaluator_name' => $evaluator->name,
            'recommendation' => $recommendation,
            'recommended_amount' => $recommendation === 'approve' ? (float) $app->amount : $recommended,
            'verified_income' => $income,
            'existing_obligations' => $obligations,
            'notes' => $notes,
        ]);
    }

    /** @param array{sequence:int,name:string} $step */
    private function approval(LoanApplication $app, array $step, User $approver, float $amount, ?string $remarks, Carbon $at): void
    {
        LoanApplicationApproval::query()->create([
            'application_id' => $app->id,
            'sequence' => $step['sequence'],
            'level_name' => $step['name'],
            'approver_id' => $approver->id,
            'approver_name' => $approver->name,
            'decision' => 'approved',
            'approved_amount' => $amount,
            'remarks' => $remarks,
            'decided_at' => $at,
        ]);
    }

    /** Builds the agreement with the same figures the app computes. $signedMethod null = not signed yet. */
    private function agreement(LoanApplication $app, User $staff, CarbonImmutable $firstDue, ?string $signedMethod, Carbon $generatedAt): LoanAgreement
    {
        $terms = app(AgreementService::class)->terms($app->refresh(), $firstDue);

        $agreement = LoanAgreement::query()->create($terms + [
            'application_id' => $app->id,
            'generated_by' => $staff->id,
            'generated_at' => $generatedAt,
            'signed_at' => $signedMethod === null ? null : $generatedAt->copy()->addDay(),
            'signed_method' => $signedMethod,
        ]);
        $agreement->update(['agreement_no' => sprintf('AG-%s-%06d', now()->format('Y'), $agreement->id)]);

        return $agreement;
    }

    /** Creates the loan account, its schedule and the cashier's release record. */
    private function release(LoanApplication $app, LoanAgreement $agreement, User $cashier, Carbon $at): void
    {
        $loan = Loan::query()->create([
            'application_id' => $app->id,
            'member_id' => $app->member_id,
            'product_id' => $app->product_id,
            'principal' => $agreement->principal,
            'total_interest' => $agreement->total_interest,
            'outstanding_balance' => round((float) $agreement->principal + (float) $agreement->total_interest, 2),
            'installments_count' => $agreement->installments_count,
            'first_due_date' => $agreement->first_due_date,
            'maturity_date' => $agreement->maturity_date,
            'status' => 'active',
            'released_at' => $at,
        ]);
        $loan->update(['loan_no' => sprintf('LO-%s-%06d', now()->format('Y'), $loan->id)]);

        foreach ($agreement->schedule as $item) {
            $loan->scheduleItems()->create([
                'number' => $item['number'],
                'due_date' => $item['due_date'],
                'principal' => $item['principal'],
                'interest' => $item['interest'],
                'total' => $item['total'],
                'balance_after' => $item['balance_after'],
            ]);
        }

        $release = LoanRelease::query()->create([
            'loan_id' => $loan->id,
            'method' => 'cash',
            'reference_no' => null,
            'amount_released' => $agreement->net_proceeds,
            'fees_total' => round((float) $agreement->processing_fee + (float) $agreement->service_fee, 2),
            'fee_handling' => $agreement->fee_handling,
            'remarks' => 'Sample release.',
            'released_by' => $cashier->id,
            'released_by_name' => $cashier->name,
            'released_at' => $at,
        ]);
        $release->update(['receipt_no' => sprintf('RC-%s-%06d', now()->format('Y'), $release->id)]);
    }

    /** @param list<array{0:?string,1:string,2:string,3:?string,4:?string}> $steps from, to, actor type, actor name, remarks */
    private function trail(LoanApplication $app, Carbon $start, array $steps): void
    {
        $at = $start->copy();

        foreach ($steps as [$from, $to, $type, $actor, $remarks]) {
            $event = new LoanApplicationEvent([
                'application_id' => $app->id,
                'from_status' => $from,
                'to_status' => $to,
                'actor_type' => $type,
                'actor_name' => $actor,
                'remarks' => $remarks,
            ]);
            $event->created_at = $at->copy();
            $event->save();

            $at->addHours(6);
        }
    }

    /** The 15th of next month: always in the future and a valid date for monthly loans. */
    private function firstDue(): CarbonImmutable
    {
        return CarbonImmutable::now()->startOfMonth()->addMonth()->setDay(15);
    }

    /** A staff account holding the role; falls back to the first user so the seeder still runs on a thin install. */
    private function staff(string $role): User
    {
        if (isset($this->staff[$role])) {
            return $this->staff[$role];
        }

        try {
            $user = User::query()->role($role)->orderBy('id')->first();
        } catch (RoleDoesNotExist) {
            $user = null;
        }

        return $this->staff[$role] = $user ?? User::query()->orderBy('id')->firstOrFail();
    }
}
