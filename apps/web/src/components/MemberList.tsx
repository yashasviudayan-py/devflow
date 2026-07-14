import type { UserRole } from "@devflow/shared";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { OrganizationMember } from "@/lib/api";

// Owners stand out gently; everyone else stays quiet.
const roleTones: Record<UserRole, { label: string; tone: BadgeTone }> = {
  OWNER: { label: "Owner", tone: "brand" },
  ADMIN: { label: "Admin", tone: "info" },
  MEMBER: { label: "Member", tone: "neutral" },
  VIEWER: { label: "Viewer", tone: "faint" },
};

type MemberListProps = {
  members: OrganizationMember[];
  currentUserId: string;
};

export function MemberList({ members, currentUserId }: MemberListProps) {
  return (
    <ul className="divide-y divide-edge-subtle">
      {members.map((member) => {
        const role = roleTones[member.role] ?? { label: member.role, tone: "neutral" as const };

        return (
          <li key={member.id} className="flex items-center gap-3 py-3">
            <Avatar name={member.user.name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">
                {member.user.name}
                {member.user.id === currentUserId ? (
                  <span className="ml-2 text-xs font-normal text-ink-muted">(you)</span>
                ) : null}
              </p>
              <p className="truncate text-sm text-ink-muted">{member.user.email}</p>
            </div>
            <Badge tone={role.tone} className="shrink-0">
              {role.label}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}
