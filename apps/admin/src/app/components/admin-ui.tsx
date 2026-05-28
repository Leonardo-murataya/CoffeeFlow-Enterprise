import Link from "next/link";
import type { ReactNode } from "react";

type NavItem = {
    href: string;
    label: string;
    description: string;
};

type AdminShellProps = {
    activeHref: string;
    eyebrow: string;
    title: string;
    description: string;
    summary?: ReactNode;
    headerActions?: ReactNode;
    children: ReactNode;
};

const navItems: NavItem[] = [
    {
        href: "/",
        label: "Resumen",
        description: "Ventas de hoy y alertas",
    },
    {
        href: "/estado-platillos",
        label: "Menú e inventario",
        description: "Precios, categorías y stock",
    },
];

const toneClasses = {
    sky: "bg-sky-50 text-sky-700 ring-sky-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
} as const;

type Tone = keyof typeof toneClasses;

export function AdminShell({
    activeHref,
    eyebrow,
    title,
    description,
    summary,
    headerActions,
    children,
}: AdminShellProps) {
    return (
        <main className="min-h-dvh bg-slate-50 px-4 py-6 text-slate-950 md:px-8 md:py-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-6">
                <header className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <div className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-white">
                                CoffeeFlow Admin
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium uppercase tracking-[0.28em] text-sky-700">
                                    {eyebrow}
                                </p>
                                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                                    {title}
                                </h1>
                                <p className="max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                                    {description}
                                </p>
                            </div>
                        </div>

                        {summary ? (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 shadow-sm">
                                {summary}
                            </div>
                        ) : null}
                    </div>

                    {headerActions ? (
                        <div className="mt-4 flex justify-end">
                            {headerActions}
                        </div>
                    ) : null}

                    <nav
                        aria-label="Admin navigation"
                        className="mt-6 grid gap-3 md:grid-cols-2"
                    >
                        {navItems.map((item) => {
                            const isActive = activeHref === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`rounded-2xl border px-4 py-4 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 hover:-translate-y-0.5 ${
                                        isActive
                                            ? "border-sky-700 bg-sky-50 text-sky-700 shadow-sm"
                                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-semibold">
                                                {item.label}
                                            </p>
                                            <p
                                                className={`mt-1 text-sm ${
                                                    isActive
                                                        ? "text-slate-200"
                                                        : "text-slate-500"
                                                }`}
                                            >
                                                {item.description}
                                            </p>
                                        </div>
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                                                isActive
                                                    ? "bg-sky-50 text-sky-700 ring-sky-100"
                                                    : "bg-slate-100 text-slate-600 ring-slate-200"
                                            }`}
                                        >
                                            {isActive ? "Activo" : "Abrir"}
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>
                </header>

                <section className="grid gap-6">{children}</section>
            </div>
        </main>
    );
}

export function ToneChip({
    tone,
    children,
}: {
    tone: Tone;
    children: ReactNode;
}) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${toneClasses[tone]}`}
        >
            {children}
        </span>
    );
}

export function StatCard({
    title,
    value,
    detail,
    accent = "sky",
}: {
    title: string;
    value: string;
    detail: string;
    accent?: Tone;
}) {
    return (
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {title}
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                        {value}
                    </p>
                </div>
                <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${toneClasses[accent]}`}
                >
                    En vivo
                </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
        </article>
    );
}

export function Panel({
    title,
    subtitle,
    children,
    className = "",
}: {
    title: string;
    subtitle?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={`rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm ${className}`}
        >
            <div className="mb-4 space-y-1">
                <h2 className="text-xl font-semibold text-slate-950">
                    {title}
                </h2>
                {subtitle ? (
                    <p className="text-sm leading-6 text-slate-600">
                        {subtitle}
                    </p>
                ) : null}
            </div>
            {children}
        </section>
    );
}

export function FieldLabel({
    htmlFor,
    children,
}: {
    htmlFor?: string;
    children: ReactNode;
}) {
    return (
        <label
            htmlFor={htmlFor}
            className="mb-2 block text-sm font-medium text-slate-700"
        >
            {children}
        </label>
    );
}

export function AdminButton({
    children,
    variant = "primary",
    type = "button",
    className = "",
}: {
    children: ReactNode;
    variant?: "primary" | "secondary";
    type?: "button" | "submit";
    className?: string;
}) {
    return (
        <button
            type={type}
            className={`inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                variant === "primary"
                    ? "bg-slate-950 text-white hover:bg-slate-800"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            } ${className}`}
        >
            {children}
        </button>
    );
}
