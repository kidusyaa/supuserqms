// auth/_components/StepIndicator.tsx
import { Check, User, Sparkles, Lock, Mail } from "lucide-react";

const STEPS = [
  { id: 1, label: "Account",  icon: Mail     },
  { id: 2, label: "About",    icon: User     },
  { id: 3, label: "Avatar",   icon: Sparkles },
  { id: 4, label: "Password", icon: Lock     },
];

export function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, idx) => {
        const done   = current > step.id;
        const active = current === step.id;
        const Icon   = step.icon;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`
                w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300
                ${done   ? "bg-amber-400 border-amber-400 text-white" : ""}
                ${active ? "bg-white border-amber-400 text-amber-500 shadow-md shadow-amber-100" : ""}
                ${!done && !active ? "bg-gray-50 border-gray-200 text-gray-300" : ""}
              `}>
                {done ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <span className={`text-[10px] font-medium ${active ? "text-amber-600" : done ? "text-amber-400" : "text-gray-300"}`}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`w-10 h-0.5 mx-1 mb-4 rounded transition-all duration-500 ${current > step.id ? "bg-amber-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}