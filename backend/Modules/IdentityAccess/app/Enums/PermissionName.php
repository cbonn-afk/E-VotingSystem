<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Enums;

enum PermissionName: string
{
    case SettingsAccess = 'settings.access';
    case SettingsUsersView = 'settings.users.view';
    case SettingsUsersManage = 'settings.users.manage';
    case SettingsRolesView = 'settings.roles.view';
    case SettingsRolesManage = 'settings.roles.manage';
    case SettingsAuditView = 'settings.audit.view';
    case SettingsDocumentsManage = 'settings.documents.manage';

    case MembersView = 'members.view';
    case MembersManage = 'members.manage';

    case ElectionAccess = 'election.access';
    case ElectionAssembliesManage = 'election.assemblies.manage';
    case ElectionMembersView = 'election.members.view';
    case ElectionMembersManage = 'election.members.manage';
    case ElectionRegistrationView = 'election.registration.view';
    case ElectionRegistrationManage = 'election.registration.manage';
    case ElectionBallotView = 'election.ballot.view';
    case ElectionBallotManage = 'election.ballot.manage';
    case ElectionVotingCast = 'election.voting.cast';
    case ElectionTokensManage = 'election.tokens.manage';
    case ElectionResultsView = 'election.results.view';
    case ElectionReportsExport = 'election.reports.export';
    case ElectionSettingsManage = 'election.settings.manage';

    case LoanAccess = 'loan.access';
    case LoanSettingsManage = 'loan.settings.manage';
    case LoanProductsManage = 'loan.products.manage';
    case LoanApplicationsView = 'loan.applications.view';
    case LoanApplicationsManage = 'loan.applications.manage';
    case LoanEvaluate = 'loan.evaluate';
    case LoanApprove = 'loan.approve';
    case LoanRelease = 'loan.release';
    case LoanPaymentsRecord = 'loan.payments.record';
    case LoanReportsView = 'loan.reports.view';

    case InquiryAccess = 'inquiry.access';
    case InquiryStatementsView = 'inquiry.statements.view';
    case InquiryStatementsImport = 'inquiry.statements.import';
    case InquiryStationUse = 'inquiry.station.use';
    case InquiryAnnouncementsManage = 'inquiry.announcements.manage';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $p): string => $p->value, self::cases());
    }
}
