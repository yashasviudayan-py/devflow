import type { OrganizationMember } from "@/lib/api";

type MemberListProps = {
  members: OrganizationMember[];
  currentUserId: string;
};

export function MemberList({ members, currentUserId }: MemberListProps) {
  return (
    <ul className="divide-y divide-neutral-200">
      {members.map((member) => (
        <li key={member.id} className="flex items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-950">
              {member.user.name}
              {member.user.id === currentUserId ? (
                <span className="ml-2 text-xs font-normal text-neutral-500">(you)</span>
              ) : null}
            </p>
            <p className="truncate text-sm text-neutral-500">{member.user.email}</p>
          </div>
          <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
            {member.role}
          </span>
        </li>
      ))}
    </ul>
  );
}
