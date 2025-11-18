import { PropsWithChildren } from "react";

interface GradientIllustrationProps extends PropsWithChildren {
  label: string;
  caption: string;
}

export function GradientIllustration({
  label,
  caption,
  children,
}: GradientIllustrationProps) {
  return (
    <div className="relative hidden min-h-screen w-full max-w-xl flex-col justify-between overflow-hidden bg-[#e7efff] text-[#0a225f] lg:flex">
      <div className="space-y-6">
         <img src={label} alt="" />
      </div>
    </div>
  );
}

