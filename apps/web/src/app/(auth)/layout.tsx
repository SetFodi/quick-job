export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#09090b] px-4 py-12 relative">
            {/* Ambient glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-gold/[0.04] rounded-full blur-[120px] pointer-events-none" />
            <div className="w-full max-w-md relative z-10">{children}</div>
        </div>
    );
}
