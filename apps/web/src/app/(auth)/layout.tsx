export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-brand-950 to-slate-900 px-4 py-12">
            <div className="w-full max-w-md">{children}</div>
        </div>
    );
}
