type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({ className = "", ...props }: ButtonProps) {
    return (
        <button
            className={`w-full rounded-lg bg-gain py-2 text-sm font-medium text-black transition hover:opacity-90 disabled:opacity-50 ${className}`}
            {...props}
        />
    );
}