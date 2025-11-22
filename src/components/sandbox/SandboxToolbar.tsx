import { useApp } from "../../store";
import { AlertTriangle, Check, X } from "lucide-react";

export function SandboxToolbar() {
    const { isSandbox, commitSandbox, exitSandbox } = useApp();

    if (!isSandbox) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 h-12 bg-yellow-400 flex items-center justify-between px-6 shadow-md border-b-4 border-black">
            <div className="flex items-center gap-2 font-bold text-black uppercase tracking-wider">
                <AlertTriangle className="h-5 w-5" />
                <span>Sandbox Mode Active</span>
                <span className="text-xs bg-black text-yellow-400 px-2 py-0.5 rounded ml-2">
                    SIMULATION
                </span>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={exitSandbox}
                    className="flex items-center gap-1 px-3 py-1 bg-white border-2 border-black text-black font-bold hover:bg-red-100 text-sm"
                >
                    <X className="h-4 w-4" />
                    Discard Changes
                </button>
                <button
                    onClick={commitSandbox}
                    className="flex items-center gap-1 px-3 py-1 bg-black text-white font-bold hover:bg-gray-800 text-sm"
                >
                    <Check className="h-4 w-4" />
                    Commit to Live
                </button>
            </div>
        </div>
    );
}
