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
    case LoanManage = 'loan.manage';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $p): string => $p->value, self::cases());
    }
}
