"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LoaderCircle, Lock } from "lucide-react";

const LABEL_CLASS = "mb-2 block text-sm text-white/70";
const FIELD_CLASS =
  "flex h-11 items-center gap-2.5 rounded-lg bg-white/[0.09] px-3 transition-shadow focus-within:ring-2 focus-within:ring-white/40";
const INPUT_CLASS =
  "min-w-0 flex-1 bg-transparent text-white placeholder:text-white/40 focus:outline-none";
const LINK_CLASS =
  "rounded text-sm text-white transition-colors hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type Props = {
  onBackHome: () => void;
};

// Experience: inicio de sesión. Si los datos son los del administrador, entra
// al panel (/management). Usa el mismo login del panel: la contraseña la
// valida el servidor y la sesión queda en una cookie.
export function ExperienceView({ onBackHome }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = email.trim() !== "" && password !== "" && !isLoading;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/management/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/management");
        return;
      }
    } catch {
      // sin conexión: se trata como un intento fallido
    }
    setIsLoading(false);
    setMessage("Los datos no son correctos. Inténtalo de nuevo.");
    setPassword("");
  };

  // Recuperar contraseña y registro aún no existen: todavía no hay cuentas.
  const handleUnavailable = () => {
    setMessage("Esta opción todavía no está disponible.");
  };

  return (
    <section className="flex flex-1 flex-col items-center justify-center px-6 py-8 animate-fade-in">
      <form onSubmit={handleSubmit} className="w-full max-w-[19rem]">
        <h1 className="text-center text-3xl font-bold tracking-tight text-white">
          Iniciar sesión
        </h1>

        <div className="mt-10">
          <label htmlFor="experience-email" className={LABEL_CLASS}>
            Correo
          </label>
          <div className={FIELD_CLASS}>
            <input
              id="experience-email"
              type="email"
              name="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingresa tu correo"
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="experience-password" className={LABEL_CLASS}>
            Contraseña
          </label>
          <div className={FIELD_CLASS}>
            <Lock aria-hidden className="size-4 shrink-0 text-white/50" />
            <input
              id="experience-password"
              type={isPasswordVisible ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setMessage("");
              }}
              placeholder="Ingresa tu contraseña"
              className={INPUT_CLASS}
            />
            <button
              type="button"
              aria-label={isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={isPasswordVisible}
              onClick={() => setIsPasswordVisible((visible) => !visible)}
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isPasswordVisible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </div>

        <button type="button" onClick={handleUnavailable} className={`mt-5 ${LINK_CLASS}`}>
          ¿Olvidaste tu contraseña?
        </button>

        <p role="alert" className="mt-3 min-h-5 text-center text-sm text-red-400">
          {message}
        </p>

        <div className="mt-3 flex flex-col items-center gap-9">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded px-2 py-1 font-bold text-white transition-[opacity,scale] duration-150 hover:opacity-80 active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isLoading ? "Entrando…" : "Entrar"}
            {isLoading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <ArrowRight className="size-4" strokeWidth={2.5} />
            )}
          </button>

          <button type="button" onClick={handleUnavailable} className={LINK_CLASS}>
            ¿No tienes cuenta? Regístrate
          </button>

          <button
            type="button"
            onClick={onBackHome}
            className="rounded text-sm text-white/50 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Volver al inicio
          </button>
        </div>
      </form>
    </section>
  );
}
