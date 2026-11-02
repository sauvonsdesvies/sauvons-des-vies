
"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { HeartHandshake, LockKeyhole, ShieldCheck } from "lucide-react";

type AuthLayoutProps = {
  children: ReactNode;
  title: string;
  description: string;
};

export default function AuthLayout({
  children,
  title,
  description,
}: AuthLayoutProps) {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#061B39] px-4 py-8 sm:px-6">
      {/* Fond décoratif */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 h-[450px] w-[450px] rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:min-h-[620px] lg:grid-cols-2">
        {/* Présentation de la fondation */}
        <section className="flex flex-col justify-center bg-gradient-to-br from-[#07376C] via-[#062B56] to-[#03172F] px-7 py-9 text-white sm:px-12 lg:px-14">
          <div className="mx-auto w-full max-w-sm">
            <div className="relative mx-auto h-28 w-full max-w-[270px] sm:h-36">
              <Image
                src="/logo/logo.png"
                alt="Fondation Sauvons des Vies"
                fill
                priority
                sizes="270px"
                className="object-contain"
              />
            </div>

            <div className="mt-8 hidden lg:block">
              <h1 className="text-3xl font-bold leading-tight">
                Ensemble,
                <span className="block text-cyan-300">
                  sauvons des vies.
                </span>
              </h1>

              <p className="mt-5 text-sm leading-7 text-blue-100">
                Espace privé de gestion de la Fondation
                Sauvons des Vies.
              </p>

              <div className="mt-10 space-y-5">
                <div className="flex items-center gap-4">
                  <ShieldCheck className="h-6 w-6 text-cyan-300" />
                  <span className="text-sm">
                    Accès administrateur sécurisé
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <LockKeyhole className="h-6 w-6 text-cyan-300" />
                  <span className="text-sm">
                    Vérification en deux étapes
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <HeartHandshake className="h-6 w-6 text-cyan-300" />
                  <span className="text-sm">
                    Solidarité, santé et entraide
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Formulaire */}
        <section className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-14">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-7">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <LockKeyhole className="h-6 w-6" />
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-[#09234D] sm:text-3xl">
                {title}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {description}
              </p>
            </div>

            {children}

            <div className="mt-10 border-t border-slate-100 pt-5 text-center">
              <p className="text-sm text-slate-400">
                © 2026 Fondation Sauvons des Vies
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Espace réservé à l&apos;administration
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
