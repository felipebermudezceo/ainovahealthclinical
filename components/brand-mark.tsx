type BrandMarkProps = {
  variant?: "login" | "nav";
};

export function BrandMark({ variant = "nav" }: BrandMarkProps) {
  const isLogin = variant === "login";

  return (
    <img
      src="/ainovahealth-logo.png"
      alt={isLogin ? "AinovaHealth" : ""}
      width={180}
      height={180}
      draggable={false}
      className={
        isLogin
          ? "h-auto w-[180px] max-w-full object-contain"
          : "h-11 w-11 shrink-0 object-contain"
      }
    />
  );
}
