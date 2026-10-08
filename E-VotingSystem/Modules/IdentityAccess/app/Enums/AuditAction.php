<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Enums;

enum AuditAction: string
{
    case UserCreated = 'user.created';
    case UserUpdated = 'user.updated';
    case UserStatusUpdated = 'user.status.updated';
    case UserRolesUpdated = 'user.roles.updated';
    case UserPasswordReset = 'user.password.reset';
    case UserDeleted = 'user.deleted';
    case RoleCreated = 'role.created';
    case RoleUpdated = 'role.updated';
    case RoleDeleted = 'role.deleted';

    case ElectionAssemblyCreated = 'election.assembly.created';
    case ElectionAssemblyUpdated = 'election.assembly.updated';
    case ElectionAssemblyStatusUpdated = 'election.assembly.status.updated';
    case ElectionAssemblyDeleted = 'election.assembly.deleted';
    case ElectionMemberCreated = 'election.member.created';
    case ElectionMemberUpdated = 'election.member.updated';
    case ElectionMemberDeleted = 'election.member.deleted';
    case ElectionMembersImported = 'election.members.imported';
    case ElectionAttendanceRegistered = 'election.attendance.registered';
    case ElectionAttendanceRemoved = 'election.attendance.removed';
    case ElectionSetupChanged = 'election.setup.changed';
    case ElectionBallotCast = 'election.ballot.cast';
    case ElectionTokenIssued = 'election.token.issued';
    case ElectionSettingsUpdated = 'election.settings.updated';
}
