import { useState, useMemo } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { useSignIn } from "@agenda-app/client";
import { useAppStore } from "@/store/appStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_auth/auth/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: LoginPage,
});

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const setAuth = useAppStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const { redirect: redirectTo } = Route.useSearch();

  const schema = useMemo(
    () =>
      z.object({
        username: z.string().min(1, t("auth.login.validation.username.required")),
        password: z.string().min(1, t("auth.login.validation.password.required")),
      }),
    [t],
  );

  type LoginData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginData>({
    mode: "onSubmit",
    resolver: zodResolver(schema),
  });

  const { mutate: signIn, isPending } = useSignIn({
    mutation: {
      onSuccess: async () => {
        setAuth(true);
        queryClient.clear();
        await router.invalidate();
        await navigate({ to: redirectTo ?? "/", replace: true });
      },
      onError: (error: { status?: number }) => {
        if (error.status === 400 || error.status === 401 || error.status === 403) {
          setError("username", {
            message: t("auth.login.validation.credentials.invalid"),
          });
        }
      },
    },
  });

  const onSubmit = (values: LoginData) => signIn({ data: values });

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_1.1fr]">
      {/* Left: form */}
      <div className="flex flex-col justify-between bg-(--color-bg-card) px-10 py-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-(--color-primary)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 12h6M12 9v6"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-sm-body font-medium tracking-tight text-(--color-text-primary)">
            Clínico
          </span>
        </div>

        {/* Form */}
        <div>
          <h1 className="mb-1.5 text-xl font-medium tracking-tight text-(--color-text-primary)">
            {t("auth.login.title")}
          </h1>
          <p className="mb-6 leading-relaxed text-sm text-(--color-text-secondary)">
            {t("auth.login.subtitle")}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5" noValidate>
            {/* Username */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-(--color-text-secondary)">
                {t("auth.login.form.username")}
              </label>
              <div className="relative">
                <Mail
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-tertiary)"
                />
                <Input
                  {...register("username")}
                  type="text"
                  autoComplete="username"
                  placeholder="dr.silva"
                  className={cn("pl-9 text-sm", errors.username && "border-(--color-warning)")}
                />
              </div>
              {errors.username?.message && (
                <p className="mt-1 text-2xs text-(--color-warning)">{errors.username.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex justify-between">
                <label className="text-xs font-medium text-(--color-text-secondary)">
                  {t("auth.login.form.password")}
                </label>
                <button
                  type="button"
                  className="cursor-pointer text-xs font-medium text-(--color-primary) hover:text-(--color-primary-hover)"
                >
                  {t("auth.login.form.forgotPassword")}
                </button>
              </div>
              <div className="relative">
                <Lock
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-tertiary)"
                />
                <Input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className={cn(
                    "pl-9 pr-10 text-sm",
                    errors.password?.message && "border-(--color-warning)",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-tertiary) hover:text-(--color-text-secondary)"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password?.message && (
                <p className="mt-1 text-2xs text-(--color-warning)">{errors.password.message}</p>
              )}
            </div>

            {/* Remember me */}
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 cursor-pointer rounded-[3px] border border-(--color-border) accent-(--color-primary)"
              />
              <span className="text-xs text-(--color-text-secondary)">
                {t("auth.login.form.rememberMe")}
              </span>
            </label>

            <Button
              type="submit"
              disabled={isPending}
              className="mt-1 w-full bg-(--color-primary) text-sm font-medium hover:bg-(--color-primary-hover)"
            >
              {isPending ? t("states.loading") : t("auth.login.form.submit")}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-(--color-border) pt-3.5 text-2xs text-(--color-text-tertiary)">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={11} />
            <span>{t("auth.login.footer.security")}</span>
          </div>
          <span className="font-mono">v1.0.0</span>
        </div>
      </div>

      {/* Right: decorative panel */}
      <div className="relative hidden overflow-hidden bg-[#0F172A] lg:block">
        <DecorativeArt />
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-10">
          <h2 className="mb-2 text-xl font-medium leading-snug tracking-tight text-[#F8FAFC]">
            {t("auth.login.panel.title")}
            <br />
            <span className="text-[#5EEAD4]">{t("auth.login.panel.highlight")}</span>
          </h2>
          <p className="text-xs leading-relaxed text-[#94A3B8]">
            {t("auth.login.panel.description")}
          </p>
        </div>
      </div>
    </div>
  );
}

function DecorativeArt() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 480 640"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <pattern id="login-dot-grid" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.9" fill="#334155" />
        </pattern>
      </defs>

      <rect width="480" height="640" fill="url(#login-dot-grid)" opacity="0.5" />

      {/* Color blobs */}
      <circle cx="420" cy="-20" r="200" fill="#0D9488" opacity="0.14" />
      <circle cx="-40" cy="600" r="230" fill="#2563EB" opacity="0.12" />
      <circle cx="400" cy="490" r="120" fill="#1E40AF" opacity="0.16" />

      {/* ECG line */}
      <path
        d="M 0 320 L 80 320 L 96 296 L 112 348 L 128 264 L 146 356 L 162 316 L 186 320 L 480 320"
        stroke="#0D9488"
        strokeWidth="1.2"
        strokeOpacity="0.45"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Concentric rings */}
      <g transform="translate(240, 310)">
        <circle r="175" stroke="#5EEAD4" strokeOpacity="0.07" strokeWidth="0.8" fill="none" />
        <circle r="138" stroke="#5EEAD4" strokeOpacity="0.13" strokeWidth="0.8" fill="none" />
        <circle r="104" stroke="#5EEAD4" strokeOpacity="0.25" strokeWidth="0.9" fill="none" />
        <circle r="70" stroke="#5EEAD4" strokeOpacity="0.42" strokeWidth="0.9" fill="none" />
        <circle r="38" stroke="#5EEAD4" strokeOpacity="0.66" strokeWidth="1" fill="none" />
        <circle r="18" stroke="#5EEAD4" strokeOpacity="0.5" strokeWidth="0.8" fill="none" />
        <circle r="7" fill="#5EEAD4" />
      </g>

      {/* Data points on rings */}
      <g transform="translate(240, 310)">
        <circle cx="104" cy="0" r="2.5" fill="#5EEAD4" opacity="0.85" />
        <circle cx="-70" cy="0" r="2" fill="#5EEAD4" opacity="0.7" />
        <circle cx="0" cy="-138" r="2" fill="#5EEAD4" opacity="0.5" />
        <circle cx="0" cy="104" r="2" fill="#5EEAD4" opacity="0.5" />
      </g>

      {/* Scattered particles */}
      <circle cx="68" cy="130" r="1.8" fill="#5EEAD4" opacity="0.55" />
      <circle cx="425" cy="152" r="2.2" fill="#5EEAD4" opacity="0.4" />
      <circle cx="76" cy="520" r="1.8" fill="#3B82F6" opacity="0.6" />
      <circle cx="438" cy="464" r="1.8" fill="#5EEAD4" opacity="0.5" />
      <circle cx="218" cy="100" r="1.8" fill="#5EEAD4" opacity="0.45" />
      <circle cx="265" cy="555" r="2.2" fill="#3B82F6" opacity="0.5" />
      <circle cx="42" cy="228" r="1.2" fill="#5EEAD4" opacity="0.35" />
      <circle cx="448" cy="284" r="1.2" fill="#5EEAD4" opacity="0.35" />

      {/* Cross marks */}
      <g stroke="#5EEAD4" strokeWidth="1.2" strokeOpacity="0.55" strokeLinecap="round">
        <line x1="78" y1="210" x2="92" y2="210" />
        <line x1="85" y1="203" x2="85" y2="217" />
      </g>
      <g stroke="#3B82F6" strokeWidth="1.2" strokeOpacity="0.45" strokeLinecap="round">
        <line x1="400" y1="78" x2="414" y2="78" />
        <line x1="407" y1="71" x2="407" y2="85" />
      </g>
      <g stroke="#5EEAD4" strokeWidth="1" strokeOpacity="0.4" strokeLinecap="round">
        <line x1="52" y1="418" x2="64" y2="418" />
        <line x1="58" y1="412" x2="58" y2="424" />
      </g>
    </svg>
  );
}
