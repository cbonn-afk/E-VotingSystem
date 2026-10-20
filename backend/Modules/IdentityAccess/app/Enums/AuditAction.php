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

    case MemberCreated = 'member.created';
    case MemberUpdated = 'member.updated';
    case MemberDeleted = 'member.deleted';
    case MembersImported = 'members.imported';

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

    case LoanSettingsUpdated = 'loan.settings.updated';
    case LoanProductCreated = 'loan.product.created';
    case LoanProductUpdated = 'loan.product.updated';
    case LoanProductDeleted = 'loan.product.deleted';
    case LoanPortalOtpRequested = 'loan.portal.otp.requested';
    case LoanPortalLoginSucceeded = 'loan.portal.login.succeeded';
    case LoanPortalLoginFailed = 'loan.portal.login.failed';
    case LoanPortalPasswordChanged = 'loan.portal.password.changed';
    case MemberPasswordReset = 'member.password.reset';
    case LoanApplicationCreated = 'loan.application.created';
    case LoanApplicationSubmitted = 'loan.application.submitted';
    case LoanApplicationStatusUpdated = 'loan.application.status.updated';
    case LoanDocumentUploaded = 'loan.document.uploaded';
    case LoanDocumentReviewed = 'loan.document.reviewed';
    case LoanApplicationEvaluated = 'loan.application.evaluated';
    case LoanApprovalDecided = 'loan.application.approval.decided';
    case LoanApprovalLevelsUpdated = 'loan.approval.levels.updated';
    case LoanAgreementGenerated = 'loan.agreement.generated';
    case LoanAgreementSigned = 'loan.agreement.signed';
    case LoanReleased = 'loan.released';
    case LoanPaymentRecorded = 'loan.payment.recorded';
    case LoanPaymentVoided = 'loan.payment.voided';

    case DocumentSettingsUpdated = 'documents.settings.updated';

    case InquiryStatementsImported = 'inquiry.statements.imported';
    case InquiryStationLookup = 'inquiry.station.lookup';
    case InquiryAnnouncementCreated = 'inquiry.announcement.created';
    case InquiryAnnouncementUpdated = 'inquiry.announcement.updated';
    case InquiryAnnouncementDeleted = 'inquiry.announcement.deleted';
}
