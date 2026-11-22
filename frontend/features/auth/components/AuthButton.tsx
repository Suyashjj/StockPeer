type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function AuthButton({ className = "", ...props }: ButtonProps) {
    return (
        <button
            className={`w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50 ${className}`}
            {...props}
        />
    );
}