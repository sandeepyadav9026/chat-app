import { useMemo, useState } from "react";
import { FiUsers, FiX } from "react-icons/fi";
import assets from "../assets/assets";
import { getUserDisplayName, getUserInitials } from "../lib/utils";

function CreateGroupModal({ isOpen, users, isSaving, onClose, onSubmit }) {
    const [groupName, setGroupName] = useState("");
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);

    const availableUsers = useMemo(() => users || [], [users]);

    if (!isOpen) return null;

    const toggleMember = (userId) => {
        setSelectedMemberIds((current) =>
            current.includes(userId)
                ? current.filter((id) => id !== userId)
                : [...current, userId]
        );
    };

    const resetAndClose = () => {
        setGroupName("");
        setSelectedMemberIds([]);
        onClose();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const created = await onSubmit({
            name: groupName,
            memberIds: selectedMemberIds,
        });

        if (created) {
            resetAndClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#091223] p-6 text-white shadow-[0_30px_120px_rgba(2,8,23,0.65)]">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">New group</p>
                        <h2 className="mt-2 text-2xl font-semibold text-white">Create a group chat</h2>
                        <p className="mt-2 text-sm text-slate-400">Pick a name and choose the members you want to add.</p>
                    </div>
                    <button type="button" onClick={resetAndClose} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-300 transition hover:bg-white/10">
                        <FiX size={18} />
                    </button>
                </div>

                <div className="mt-6">
                    <label className="text-sm text-slate-300">Group name</label>
                    <input
                        value={groupName}
                        onChange={(event) => setGroupName(event.target.value)}
                        placeholder="Project Team, Family, Weekend Plan..."
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40"
                        required
                    />
                </div>

                <div className="mt-6">
                    <div className="flex items-center justify-between gap-3">
                        <label className="text-sm text-slate-300">Members</label>
                        <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                            {selectedMemberIds.length} selected
                        </div>
                    </div>

                    <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
                        {availableUsers.map((user) => {
                            const isSelected = selectedMemberIds.includes(user._id);

                            return (
                                <button
                                    key={user._id}
                                    type="button"
                                    onClick={() => toggleMember(user._id)}
                                    className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${isSelected ? "border-cyan-300/30 bg-cyan-300/10" : "border-white/8 bg-white/4 hover:bg-white/7"}`}
                                >
                                    {user.profilePic ? (
                                        <img src={user.profilePic || assets.avatar_icon} alt="" className="h-12 w-12 rounded-2xl object-cover" />
                                    ) : (
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-500 text-sm font-semibold text-slate-950">
                                            {getUserInitials(user)}
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-white">{getUserDisplayName(user)}</p>
                                        <p className="mt-1 truncate text-xs text-slate-400">{user.bio || "Available for conversation"}</p>
                                    </div>
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs ${isSelected ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100" : "border-white/10 text-slate-400"}`}>
                                        <FiUsers size={14} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                    <button type="button" onClick={resetAndClose} className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isSaving ? "Creating..." : "Create group"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CreateGroupModal;
